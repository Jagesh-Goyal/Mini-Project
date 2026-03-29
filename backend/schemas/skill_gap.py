from pydantic import BaseModel


class GapItem(BaseModel):
    skill: str
    required_level: float
    avg_current_level: float
    gap_percent: float
    risk_level: str


class GapResponse(BaseModel):
    context: str
    gap_percentage: float
    critical_skills_missing: list[str]
    risk_level: str
    items: list[GapItem]
