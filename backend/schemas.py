# Pydantic schemas for request body validation

from datetime import date, datetime
import re
import bleach

from pydantic import BaseModel, Field, field_validator


EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _sanitize_text(value: str) -> str:
    cleaned = bleach.clean(value, tags=[], attributes={}, strip=True)
    return cleaned.strip()


class EmployeeBase(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str | None = Field(default=None, max_length=255)
    department: str = Field(min_length=2, max_length=100)
    role: str = Field(min_length=2, max_length=100)
    year_exp: int = Field(ge=0, le=70)
    employee_code: str | None = Field(default=None, max_length=50)
    join_date: date | None = None
    manager: str | None = Field(default=None, max_length=100)
    performance_score: int = Field(default=70, ge=0, le=100)
    team_name: str | None = Field(default=None, max_length=100)

    @field_validator("email")
    @classmethod
    def validate_employee_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        clean_value = value.strip().lower()
        if not EMAIL_REGEX.match(clean_value):
            raise ValueError("Please enter a valid email address")
        return clean_value

    @field_validator("employee_code")
    @classmethod
    def normalize_employee_code(cls, value: str | None) -> str | None:
        if value is None:
            return None
        clean_value = value.strip().upper()
        return clean_value or None

    @field_validator("name", "department", "role")
    @classmethod
    def sanitize_required_text(cls, value: str) -> str:
        clean_value = _sanitize_text(value)
        if not clean_value:
            raise ValueError("Field cannot be empty")
        return clean_value

    @field_validator("manager", "team_name")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        clean_value = value.strip()
        return clean_value or None


class EmployeeCreate(EmployeeBase):
    """Employee creation with validation."""


class EmployeeProfileSkill(BaseModel):
    skill_id: int
    skill_name: str
    category: str
    proficiency_level: int
    proficiency_label: str


class TrainingHistoryCreate(BaseModel):
    training_name: str = Field(min_length=2, max_length=150)
    provider: str | None = Field(default=None, max_length=150)
    status: str = Field(default="Planned", min_length=2, max_length=50)
    focus_skill: str | None = Field(default=None, max_length=100)
    duration_hours: int | None = Field(default=None, ge=1, le=1000)
    completion_date: date | None = None

    @field_validator("provider", "focus_skill")
    @classmethod
    def normalize_nullable_field(cls, value: str | None) -> str | None:
        if value is None:
            return None
        clean_value = value.strip()
        return clean_value or None

    @field_validator("training_name", "status")
    @classmethod
    def sanitize_training_text(cls, value: str) -> str:
        clean_value = _sanitize_text(value)
        if not clean_value:
            raise ValueError("Field cannot be empty")
        return clean_value

class TrainingHistoryResponse(BaseModel):
    id: int
    training_name: str
    provider: str | None
    status: str
    focus_skill: str | None
    duration_hours: int | None
    completion_date: datetime | None


class EmployeeProfileResponse(BaseModel):
    employee: EmployeeCreate | dict
    skills: list[EmployeeProfileSkill]
    training_history: list[TrainingHistoryResponse]


class SkillCreate(BaseModel):
    """Skill creation with validation."""

    skill_name: str = Field(min_length=2, max_length=100)
    category: str = Field(min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=1000)

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        clean_value = value.strip()
        return clean_value or None

    @field_validator("skill_name", "category")
    @classmethod
    def sanitize_skill_text(cls, value: str) -> str:
        clean_value = _sanitize_text(value)
        if not clean_value:
            raise ValueError("Field cannot be empty")
        return clean_value


class SkillUpdate(SkillCreate):
    pass


class AssignSkillSchema(BaseModel):
    """Skill assignment with validation."""

    employee_id: int = Field(gt=0)
    skill_id: int = Field(gt=0)
    proficiency_level: int = Field(ge=1, le=5)


class CreateEmployeeFromResumeSchema(BaseModel):
    """Employee creation from resume extraction data."""

    name: str = Field(min_length=2, max_length=100)
    email: str | None = Field(default=None, max_length=255)
    department: str = Field(min_length=2, max_length=100)
    role: str = Field(min_length=2, max_length=100)
    experience_years: int = Field(ge=0, le=70)
    employee_code: str | None = Field(default=None, max_length=50)
    join_date: date | None = None
    manager: str | None = Field(default=None, max_length=100)
    performance_score: int = Field(default=70, ge=0, le=100)
    team_name: str | None = Field(default=None, max_length=100)
    skill_ids: list[int] = Field(default=[])
    proficiency_level: int = Field(ge=1, le=5, default=3)

    @field_validator("email")
    @classmethod
    def validate_resume_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        clean_value = value.strip().lower()
        if not EMAIL_REGEX.match(clean_value):
            raise ValueError("Please enter a valid email address")
        return clean_value


class SkillDemandSchema(BaseModel):
    """Skill demand analysis."""

    skill_name: str = Field(min_length=2, max_length=100)
    required_count: int = Field(ge=0, le=10000)
    department: str | None = Field(default=None, max_length=100)
    team_name: str | None = Field(default=None, max_length=100)

    @field_validator("skill_name")
    @classmethod
    def sanitize_skill_name(cls, value: str) -> str:
        clean_value = _sanitize_text(value)
        if not clean_value:
            raise ValueError("Skill name cannot be empty")
        return clean_value


class SignUpRequest(BaseModel):
    """User signup with validation."""

    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        clean_value = value.strip().lower()
        if not EMAIL_REGEX.match(clean_value):
            raise ValueError("Please enter a valid email address")
        return clean_value

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, value: str) -> str:
        clean_value = _sanitize_text(value)
        if len(clean_value) < 2:
            raise ValueError("Name must be at least 2 characters")
        return clean_value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value.strip()) < 8:
            raise ValueError("Password must be at least 8 characters")
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
    def validate_login_email(cls, value: str) -> str:
        clean_value = value.strip().lower()
        if not EMAIL_REGEX.match(clean_value):
            raise ValueError("Please enter a valid email address")
        return clean_value


class SignUpResponse(BaseModel):
    message: str
    email: str
    name: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    email: str
    name: str
    role: str
    csrf_token: str


class TokenRefreshRequest(BaseModel):
    """Refresh access token using refresh token."""
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    """New access token from refresh."""
    access_token: str
    token_type: str
    expires_in: int


class UserProfileResponse(BaseModel):
    """User profile information."""
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    last_login: datetime | None
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    """Update user profile."""
    name: str | None = Field(default=None, min_length=2, max_length=100)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    
    @field_validator("password")
    @classmethod
    def validate_new_password(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if len(value.strip()) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in value):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in value):
            raise ValueError("Password must contain at least one digit")
        return value


class UserListResponse(BaseModel):
    """List of users for admin."""
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    last_login: datetime | None
    created_at: datetime
    
    class Config:
        from_attributes = True
