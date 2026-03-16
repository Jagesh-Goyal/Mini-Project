# Pydantic schemas for request body validation

from datetime import date, datetime
import re

from pydantic import BaseModel, Field, field_validator


EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


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
    token_type: str
    expires_in: int
    email: str
    name: str
    role: str