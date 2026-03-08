# Pydantic schemas for request body validation

import re

from pydantic import BaseModel, Field, field_validator


EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# schema for employee data
class EmployeeCreate(BaseModel):
    name: str
    department: str
    role: str
    year_exp: int = Field(ge=0)


# schema for skill creation
class SkillCreate(BaseModel):
    skill_name: str
    category: str


# schema for assigning skill to employee
class AssignSkillSchema(BaseModel):
    employee_id: int
    skill_id: int
    proficiency_level: int


# schema for skill demand input
class SkillDemandSchema(BaseModel):
    skill_name: str
    required_count: int = Field(ge=0)


class SignUpRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        clean_value = value.strip()
        if len(clean_value) < 2:
            raise ValueError("Name must be at least 2 characters")
        return clean_value

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
        return value


# schema for login request
class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        clean_value = value.strip().lower()
        if not EMAIL_REGEX.match(clean_value):
            raise ValueError("Please enter a valid email address")
        return clean_value


class SignUpResponse(BaseModel):
    message: str
    email: str
    name: str


# schema for token response
class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    email: str