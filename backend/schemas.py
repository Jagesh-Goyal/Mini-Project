# Pydantic schemas for request body validation

from pydantic import BaseModel

# schema for employee data
class EmployeeCreate(BaseModel):
    name: str
    department: str
    role: str
    year_exp: int


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
    required_count: int