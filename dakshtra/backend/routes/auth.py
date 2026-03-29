from datetime import timedelta

from fastapi import APIRouter, Depends, Request
from fastapi_jwt_auth import AuthJWT
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.middleware.rate_limit import limiter
from backend.schemas.user import ForgotPasswordRequest, ResetPasswordRequest, UserLogin, UserOut, UserRegister
from backend.security.csrf import generate_csrf_token, validate_csrf_token
from backend.services.auth_service import create_reset_token, login_user, register_user, reset_password, token_expirations

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut)
def register(payload: UserRegister, db: Session = Depends(get_db), _: None = Depends(validate_csrf_token)):
    return register_user(db, payload.full_name, payload.email, payload.password, payload.role)


@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, payload: UserLogin, authorize: AuthJWT = Depends(), db: Session = Depends(get_db), _: None = Depends(validate_csrf_token)):
    user = login_user(db, payload.email, payload.password)
    access_delta, refresh_delta = token_expirations()
    access_token = authorize.create_access_token(subject=str(user.id), user_claims={"role": user.role.value}, expires_time=access_delta)
    refresh_token = authorize.create_refresh_token(subject=str(user.id), expires_time=refresh_delta)

    authorize.set_access_cookies(access_token)
    authorize.set_refresh_cookies(refresh_token)

    return {"message": "Logged in", "csrf_token": generate_csrf_token(), "role": user.role}


@router.post("/logout")
def logout(authorize: AuthJWT = Depends()):
    authorize.jwt_required()
    authorize.unset_jwt_cookies()
    return {"message": "Logged out"}


@router.post("/refresh")
def refresh(authorize: AuthJWT = Depends()):
    authorize.jwt_refresh_token_required()
    subject = authorize.get_jwt_subject()
    access_delta, _ = token_expirations()
    token = authorize.create_access_token(subject=subject, expires_time=access_delta)
    authorize.set_access_cookies(token)
    return {"message": "Token refreshed"}


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest):
    token = create_reset_token(payload.email)
    return {"message": "Password reset token generated", "token": token}


@router.post("/reset-password")
def update_password(payload: ResetPasswordRequest, db: Session = Depends(get_db), _: None = Depends(validate_csrf_token)):
    reset_password(db, payload.token, payload.new_password)
    return {"message": "Password updated"}
