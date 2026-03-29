import secrets

from fastapi import Header, HTTPException, Request, status


CSRF_COOKIE_NAME = "csrf_token"
CSRF_HEADER_NAME = "X-CSRF-Token"


def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def validate_csrf(request: Request, x_csrf_token: str | None = Header(default=None, alias=CSRF_HEADER_NAME)):
    cookie_token = request.cookies.get(CSRF_COOKIE_NAME)
    if not cookie_token or not x_csrf_token or cookie_token != x_csrf_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid CSRF token")
