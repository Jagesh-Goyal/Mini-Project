from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.role import RoleEnum
from backend.schemas.skill_gap import RoleGapRequest
from backend.security.csrf import validate_csrf_token
from backend.security.rbac import require_roles
from backend.services.gap_service import calculate_department_gap, calculate_org_gap, calculate_role_gap, calculate_team_gap

router = APIRouter(prefix="/api/gap", tags=["gap"])


@router.get("/department/{department}", dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER, RoleEnum.TEAM_LEAD))])
def gap_by_department(department: str, db: Session = Depends(get_db)):
    return calculate_department_gap(db, department)


@router.get("/team/{team_id}", dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER, RoleEnum.TEAM_LEAD))])
def gap_by_team(team_id: str, db: Session = Depends(get_db)):
    return calculate_team_gap(db, team_id)


@router.get("/org", dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER, RoleEnum.TEAM_LEAD))])
def gap_org(db: Session = Depends(get_db)):
    return calculate_org_gap(db)


@router.post("/role", dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER, RoleEnum.TEAM_LEAD)), Depends(validate_csrf_token)])
def gap_role(payload: RoleGapRequest, db: Session = Depends(get_db)):
    return calculate_role_gap(db, payload.role_name)
