import secrets

from fastapi import Header, HTTPException


def generate_csrf_token() -> str:
    return secrets.token_urlsafe(24)


def validate_csrf_token(x_csrf_token: str | None = Header(default=None)) -> None:
    if not x_csrf_token:
        raise HTTPException(status_code=403, detail="Missing CSRF token")
