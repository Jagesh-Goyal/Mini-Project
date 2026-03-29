from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from backend.models.role import RoleEnum


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    role: RoleEnum = RoleEnum.EMPLOYEE


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: RoleEnum
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True
