from datetime import datetime

from pydantic import BaseModel


class SkillCreate(BaseModel):
    name: str
    category: str
    description: str = ""


class SkillOut(BaseModel):
    id: int
    name: str
    category: str
    description: str
    created_at: datetime

    class Config:
        orm_mode = True
