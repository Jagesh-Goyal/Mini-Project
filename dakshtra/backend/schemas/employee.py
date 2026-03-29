from datetime import datetime

from pydantic import BaseModel, EmailStr


class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    department: str
    team: str = "General"
    job_title: str
    years_experience: int = 0


class EmployeeUpdate(BaseModel):
    name: str | None = None
    department: str | None = None
    team: str | None = None
    job_title: str | None = None
    years_experience: int | None = None
    is_active: bool | None = None


class AssignSkill(BaseModel):
    skill_id: int
    proficiency_level: int


class EmployeeOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    department: str
    team: str
    job_title: str
    years_experience: int
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True
