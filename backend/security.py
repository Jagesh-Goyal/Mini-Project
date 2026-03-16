"""
Security utilities for the Dakshtra application.

Features:
- Rate limiting (100 requests/minute per IP)
- Role-based authorization (admin, hr_manager, employee)
- Input validation helpers
"""

from collections import defaultdict
from datetime import datetime, timedelta
from typing import Callable
from functools import wraps

from fastapi import Request


# =============================
# Simple Rate Limiting Implementation
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
                from fastapi import HTTPException, status
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please try again later."
                )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


# =============================
# Role-Based Authorization
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
