from fastapi import APIRouter, Depends

from backend.models.role import RoleEnum
from backend.schemas.skill_gap import ScenarioForecastRequest
from backend.security.csrf import validate_csrf_token
from backend.security.rbac import require_roles
from backend.services.forecast_service import forecast_next_6_months, scenario_forecast

router = APIRouter(prefix="/api/forecast", tags=["forecast"])


@router.get("/skills", dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER, RoleEnum.TEAM_LEAD))])
def forecast_skills(skill: str = "Cloud"):
    return forecast_next_6_months(skill)


@router.post("/scenario", dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER, RoleEnum.TEAM_LEAD)), Depends(validate_csrf_token)])
def forecast_scenario(payload: ScenarioForecastRequest):
    return scenario_forecast(payload.growth_percent)
