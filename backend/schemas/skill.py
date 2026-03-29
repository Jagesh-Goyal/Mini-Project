from pydantic import BaseModel, Field


class SkillCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    category: str = Field(min_length=2, max_length=100)
    description: str = Field(default="", max_length=1000)


class SkillOut(BaseModel):
    id: int
    name: str
    category: str
    description: str

    model_config = {"from_attributes": True}
