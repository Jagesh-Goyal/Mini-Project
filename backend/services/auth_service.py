import bleach
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from backend.models.user import User
from backend.repositories import user_repo

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def register_user(db: Session, full_name: str, email: str, password: str, role) -> User:
    safe_name = bleach.clean(full_name, strip=True)
    safe_email = bleach.clean(email, strip=True).lower()
    user = User(full_name=safe_name, email=safe_email, hashed_password=hash_password(password), role=role)
    return user_repo.create(db, user)


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    safe_email = bleach.clean(email, strip=True).lower()
    user = user_repo.get_by_email(db, safe_email)
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
