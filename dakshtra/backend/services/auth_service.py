import uuid
from datetime import timedelta

import bleach
from fastapi import HTTPException
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from backend.config import get_settings
from backend.models.user import User
from backend.repositories.user_repo import UserRepository

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
password_reset_tokens: dict[str, str] = {}


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def register_user(db: Session, full_name: str, email: str, password: str, role):
    repo = UserRepository(db)
    sanitized_name = bleach.clean(full_name, strip=True)
    sanitized_email = bleach.clean(email, strip=True).lower()

    if repo.get_by_email(sanitized_email):
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        email=sanitized_email,
        hashed_password=hash_password(password),
        full_name=sanitized_name,
        role=role,
    )
    return repo.create(user)


def login_user(db: Session, email: str, password: str):
    repo = UserRepository(db)
    user = repo.get_by_email(email.lower())
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user


def create_reset_token(email: str) -> str:
    token = str(uuid.uuid4())
    password_reset_tokens[token] = email.lower()
    return token


def reset_password(db: Session, token: str, new_password: str):
    email = password_reset_tokens.get(token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    repo = UserRepository(db)
    user = repo.get_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(new_password)
    db.commit()
    del password_reset_tokens[token]


def token_expirations():
    settings = get_settings()
    return timedelta(minutes=settings.access_token_expire_minutes), timedelta(days=settings.refresh_token_expire_days)
