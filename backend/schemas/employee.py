from pydantic import BaseModel, EmailStr, Field


class EmployeeBase(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    department: str = Field(min_length=2, max_length=100)
    team: str = Field(min_length=2, max_length=100)
    job_title: str = Field(min_length=2, max_length=120)
    years_experience: float = Field(ge=0, le=50)


class EmployeeCreate(EmployeeBase):
    user_id: int | None = None


class EmployeeUpdate(BaseModel):
    name: str | None = None
    department: str | None = None
    team: str | None = None
    job_title: str | None = None
    years_experience: float | None = Field(default=None, ge=0, le=50)
    is_active: bool | None = None


class EmployeeOut(EmployeeBase):
    id: int
    is_active: bool

    model_config = {"from_attributes": True}


class EmployeeSkillAssign(BaseModel):
    skill_id: int
    proficiency_level: int = Field(ge=1, le=5)
