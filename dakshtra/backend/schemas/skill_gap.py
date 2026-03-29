from pydantic import BaseModel


class RoleGapRequest(BaseModel):
    role_name: str


class ScenarioForecastRequest(BaseModel):
    growth_percent: int


class GapResult(BaseModel):
    skill_name: str
    required_level: int
    avg_current_level: float
    gap_percent: float
    risk_level: str
