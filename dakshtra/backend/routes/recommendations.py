from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.role import RoleEnum
from backend.security.rbac import require_roles
from backend.services.gap_service import calculate_org_gap
from backend.services.recommendation_service import employee_recommendations

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("/employee/{employee_id}", dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER, RoleEnum.TEAM_LEAD, RoleEnum.EMPLOYEE))])
def employee_plan(employee_id: int, db: Session = Depends(get_db)):
    gaps = calculate_org_gap(db)
    return employee_recommendations(gaps)


@router.get("/hiring", dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER))])
def hiring_recommendations(db: Session = Depends(get_db)):
    gaps = calculate_org_gap(db)
    return [item for item in employee_recommendations(gaps) if item["action"] == "hire"]


@router.get("/training", dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER, RoleEnum.TEAM_LEAD))])
def training_recommendations(db: Session = Depends(get_db)):
    gaps = calculate_org_gap(db)
    return [item for item in employee_recommendations(gaps) if item["action"] in {"upskill", "hire"}]
