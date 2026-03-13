# Pydantic schemas for request body validation

import re

from pydantic import BaseModel, Field, field_validator


EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# =============================
# Employee Schemas
# =============================

class EmployeeCreate(BaseModel):
    """Employee creation with validation."""

    name: str = Field(min_length=2, max_length=100)
    department: str = Field(min_length=2, max_length=100)
    role: str = Field(min_length=2, max_length=100)
    year_exp: int = Field(ge=0, le=70)


# =============================
# Skill Schemas
# =============================

class SkillCreate(BaseModel):
    """Skill creation with validation."""

    skill_name: str = Field(min_length=2, max_length=100)
    category: str = Field(min_length=2, max_length=100)


class AssignSkillSchema(BaseModel):
    """Skill assignment with validation."""

    employee_id: int = Field(gt=0)
    skill_id: int = Field(gt=0)
    proficiency_level: int = Field(ge=1, le=5)


class CreateEmployeeFromResumeSchema(BaseModel):
    """Employee creation from resume extraction data."""

    name: str = Field(min_length=2, max_length=100)
    department: str = Field(min_length=2, max_length=100)
    role: str = Field(min_length=2, max_length=100)
    experience_years: int = Field(ge=0, le=70)
    skill_ids: list[int] = Field(default=[])
    proficiency_level: int = Field(ge=1, le=5, default=3)


class SkillDemandSchema(BaseModel):
    """Skill demand analysis."""

    skill_name: str = Field(min_length=2, max_length=100)
    required_count: int = Field(ge=0, le=10000)


# =============================
# Authentication Schemas
# =============================

class SignUpRequest(BaseModel):
    """User signup with validation."""

    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        """Validate email format."""
        clean_value = value.strip().lower()
        if not EMAIL_REGEX.match(clean_value):
            raise ValueError("Please enter a valid email address")
        return clean_value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        """Validate password strength."""
        if len(value.strip()) < 8:
            raise ValueError("Password must be at least 8 characters")
        # Check for at least one uppercase, one lowercase, one digit
        if not any(c.isupper() for c in value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in value):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in value):
            raise ValueError("Password must contain at least one digit")
        return value


class LoginRequest(BaseModel):
    """User login."""

    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        """Validate email format."""
        clean_value = value.strip().lower()
        if not EMAIL_REGEX.match(clean_value):
            raise ValueError("Please enter a valid email address")
        return clean_value


class SignUpResponse(BaseModel):
    """Signup response."""

    message: str
    email: str
    name: str


class TokenResponse(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str
    expires_in: int
    email: str