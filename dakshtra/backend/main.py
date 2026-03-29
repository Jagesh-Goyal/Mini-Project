from datetime import timedelta

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi_jwt_auth import AuthJWT
from fastapi_jwt_auth.exceptions import AuthJWTException
from pydantic import BaseModel

from backend.config import get_settings
from backend.database import Base, engine
from backend.middleware.cors_middleware import add_cors_middleware
from backend.middleware.rate_limit import limiter
from backend.routes import auth, employees, forecasting, recommendations, reports, resume, skill_gap, skills

settings = get_settings()


class JWTSettings(BaseModel):
    authjwt_secret_key: str = settings.secret_key
    authjwt_token_location: set = {"cookies"}
    authjwt_cookie_csrf_protect: bool = False
    authjwt_access_token_expires: timedelta = timedelta(minutes=settings.access_token_expire_minutes)
    authjwt_refresh_token_expires: timedelta = timedelta(days=settings.refresh_token_expire_days)


@AuthJWT.load_config
def get_jwt_config():
    return JWTSettings()


app = FastAPI(title="Dakshtra API", version="1.0.0")
app.state.limiter = limiter
add_cors_middleware(app)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
    return response


@app.exception_handler(AuthJWTException)
def authjwt_exception_handler(request: Request, exc: AuthJWTException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(skills.router)
app.include_router(skill_gap.router)
app.include_router(forecasting.router)
app.include_router(resume.router)
app.include_router(recommendations.router)
app.include_router(reports.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
