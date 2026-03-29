"""
Security utilities for the Dakshtra application.

Features:
- 🔐 Password hashing with bcrypt (no plain text)
- 🎫 JWT authentication with access & refresh tokens
- ♻️ Token expiry & refresh mechanism
- 🛡️ Role-based access control (Admin, HR, Employee)
- ⏱️ Rate limiting (100 requests/minute per IP)
"""

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Callable, Optional
from functools import wraps
import os
import bcrypt

from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
try:
    from passlib.context import CryptContext  # pyright: ignore[reportMissingModuleSource]
except Exception:  # pragma: no cover
    CryptContext = None  # type: ignore[assignment]
from jose import JWTError, jwt
import logging

logger = logging.getLogger(__name__)


# =============================
# PASSWORD HASHING (bcrypt)
# =============================

# Bcrypt context for secure password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") if CryptContext is not None else None


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        Bcrypt hashed password (always different due to salt)
    """
    if pwd_context is not None:
        return pwd_context.hash(password)
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against its hash.
    
    Args:
        plain_password: User-provided password
        hashed_password: Stored bcrypt hash from database
        
    Returns:
        True if password matches, False otherwise
    """
    if pwd_context is not None:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return False

    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


# =============================
# JWT TOKEN MANAGEMENT
# =============================

class TokenManager:
    """Manages JWT token generation and validation."""
    
    def __init__(self):
        self.secret_key = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
        self.algorithm = "HS256"
        self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
        self.refresh_token_expire_days = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        Create a JWT access token.
        
        Args:
            data: Payload to encode (must include 'sub' for user ID)
            expires_delta: Optional custom expiration time
            
        Returns:
            Encoded JWT token
        """
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def create_refresh_token(self, data: dict) -> str:
        """
        Create a JWT refresh token (longer expiration).
        
        Args:
            data: Payload to encode (must include 'sub' for user ID)
            
        Returns:
            Encoded JWT refresh token
        """
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(days=self.refresh_token_expire_days)
        
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str, token_type: str = "access") -> dict:
        """
        Verify and decode a JWT token.
        
        Args:
            token: JWT token to verify
            token_type: Expected token type ("access" or "refresh")
            
        Returns:
            Decoded token payload
            
        Raises:
            HTTPException: If token is invalid or expired
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # Verify token type
            if payload.get("type") != token_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid token type. Expected {token_type}."
                )
            
            user_id: str = payload.get("sub")
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: missing user ID"
                )
            
            return payload
            
        except JWTError as e:
            logger.warning(f"JWT verification failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )


# Global token manager instance
token_manager = TokenManager()


# =============================
# FASTAPI SECURITY DEPENDENCIES
# =============================

security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    FastAPI dependency to extract and validate current user from JWT token.
    
    Usage:
        @router.get("/profile")
        async def get_profile(current_user: dict = Depends(get_current_user)):
            return {"user_id": current_user["sub"]}
    """
    token = credentials.credentials
    return token_manager.verify_token(token, token_type="access")


async def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    FastAPI dependency to ensure current user is admin.
    
    Usage:
        @router.delete("/users/{user_id}")
        async def delete_user(user_id: int, admin: dict = Depends(get_current_admin)):
            # Only admins can reach here
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def get_current_hr_or_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    FastAPI dependency to ensure user is HR manager or admin.
    
    Usage:
        @router.post("/employees")
        async def create_employee(emp: EmployeeCreate, hr: dict = Depends(get_current_hr_or_admin)):
            # Only HR and admins can create employees
    """
    role = current_user.get("role")
    if role not in ["admin", "hr_manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR Manager or Admin access required"
        )
    return current_user


# =============================
# ROLE-BASED AUTHORIZATION
# =============================

class Role:
    """User role definitions."""

    ADMIN = "admin"
    HR_MANAGER = "hr_manager"
    EMPLOYEE = "employee"
    USER = EMPLOYEE
    MANAGER = HR_MANAGER

    WRITE_ACCESS = {ADMIN, HR_MANAGER}

    @classmethod
    def normalize(cls, value: str | None) -> str:
        """Normalize role string to standard format."""
        if value is None:
            return cls.EMPLOYEE

        normalized = value.strip().lower().replace(" ", "_")
        if normalized == "user":
            return cls.EMPLOYEE
        if normalized == "manager":
            return cls.HR_MANAGER
        if normalized == "hr":
            return cls.HR_MANAGER
        if normalized == "hr_manager":
            return cls.HR_MANAGER
        if normalized == cls.ADMIN:
            return cls.ADMIN
        return cls.EMPLOYEE

    @classmethod
    def label(cls, value: str | None) -> str:
        """Get human-readable role label."""
        normalized = cls.normalize(value)
        if normalized == cls.ADMIN:
            return "Admin"
        if normalized == cls.HR_MANAGER:
            return "HR Manager"
        return "Employee"

    @classmethod
    def can_manage_data(cls, value: str | None) -> bool:
        """Check if role has write access to data."""
        return cls.normalize(value) in cls.WRITE_ACCESS


def require_role(required_role: str):
    """
    Decorator for FastAPI endpoints requiring specific role.
    
    Usage:
        @router.delete("/users/{user_id}")
        @require_role("admin")
        async def delete_user(user_id: int):
            pass
    """
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role", "employee")
        if user_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role: {required_role}"
            )
        return current_user
    return role_checker


def require_any_role(*roles: str):
    """
    Decorator for FastAPI endpoints requiring any of multiple roles.
    
    Usage:
        @router.post("/employees")
        @require_any_role("admin", "hr_manager")
        async def create_employee(emp: EmployeeCreate):
            pass
    """
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role", "employee")
        if user_role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required roles: {', '.join(roles)}"
            )
        return current_user
    return role_checker


# =============================
# RATE LIMITING
# =============================

class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self, max_requests: int = 100, time_window: int = 60):
        """
        Initialize rate limiter.
        
        Args:
            max_requests: Maximum requests allowed in time window
            time_window: Time window in seconds
        """
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = defaultdict(list)
    
    def is_allowed(self, client_id: str) -> bool:
        """Check if request is allowed for client."""
        now = datetime.now()
        cutoff = now - timedelta(seconds=self.time_window)
        
        # Remove old requests
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if req_time > cutoff
        ]
        
        # Check if under limit
        if len(self.requests[client_id]) < self.max_requests:
            self.requests[client_id].append(now)
            return True
        
        return False


# Global rate limiters for different endpoints
auth_limiter = RateLimiter(max_requests=10, time_window=60)  # 10/minute for auth
api_limiter = RateLimiter(max_requests=100, time_window=60)  # 100/minute for API


def rate_limit(limiter: RateLimiter):
    """
    Decorator for rate limiting endpoints.
    
    Usage:
        @rate_limit(auth_limiter)
        def login(request, ...):
            pass
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Extract client IP from either keyword or positional request argument.
            request = kwargs.get('request')
            if request is None:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            if request:
                client_ip = request.client.host if request.client else "unknown"
            else:
                # Fallback for testing
                client_ip = "local"
            
            # Check rate limit
            if not limiter.is_allowed(client_ip):
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please try again later."
                )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

    ADMIN = "admin"
    HR_MANAGER = "hr_manager"
    EMPLOYEE = "employee"
    USER = EMPLOYEE
    MANAGER = HR_MANAGER

    WRITE_ACCESS = {ADMIN, HR_MANAGER}

    @classmethod
    def normalize(cls, value: str | None) -> str:
        if value is None:
            return cls.EMPLOYEE

        normalized = value.strip().lower().replace(" ", "_")
        if normalized == "user":
            return cls.EMPLOYEE
        if normalized == "manager":
            return cls.HR_MANAGER
        if normalized == "hr":
            return cls.HR_MANAGER
        if normalized == "hr_manager":
            return cls.HR_MANAGER
        if normalized == cls.ADMIN:
            return cls.ADMIN
        return cls.EMPLOYEE

    @classmethod
    def label(cls, value: str | None) -> str:
        normalized = cls.normalize(value)
        if normalized == cls.ADMIN:
            return "Admin"
        if normalized == cls.HR_MANAGER:
            return "HR Manager"
        return "Employee"

    @classmethod
    def can_manage_data(cls, value: str | None) -> bool:
        return cls.normalize(value) in cls.WRITE_ACCESS
