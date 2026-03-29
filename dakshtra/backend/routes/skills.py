from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.employee import Employee, EmployeeSkill
from backend.models.role import RoleEnum
from backend.models.skill import Skill
from backend.schemas.skill import SkillCreate, SkillOut
from backend.security.csrf import validate_csrf_token
from backend.security.rbac import require_roles
from backend.services.skill_service import SkillService

router = APIRouter(prefix="/api/skills", tags=["skills"])


@router.get("", response_model=list[SkillOut], dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER, RoleEnum.TEAM_LEAD, RoleEnum.EMPLOYEE))])
def list_skills(db: Session = Depends(get_db)):
    return SkillService(db).list_skills()


@router.post("", response_model=SkillOut, dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER)), Depends(validate_csrf_token)])
def create_skill(payload: SkillCreate, db: Session = Depends(get_db)):
    return SkillService(db).create_skill(payload.name, payload.category, payload.description)


@router.get("/matrix", dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER, RoleEnum.TEAM_LEAD))])
def skill_matrix(db: Session = Depends(get_db)):
    employees = db.query(Employee).filter(Employee.is_active.is_(True)).all()
    skills = db.query(Skill).all()
    assignments = db.query(EmployeeSkill).all()

    level_map = {(x.employee_id, x.skill_id): x.proficiency_level for x in assignments}
    rows = []
    for employee in employees:
        row = {"employee_id": employee.id, "employee_name": employee.name}
        for skill in skills:
            row[skill.name] = level_map.get((employee.id, skill.id), 0)
        rows.append(row)
    return rows


@router.get("/heatmap", dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER, RoleEnum.TEAM_LEAD))])
def heatmap_data(db: Session = Depends(get_db)):
    matrix = skill_matrix(db)
    points = []
    for row in matrix:
        employee = row["employee_name"]
        for key, value in row.items():
            if key in {"employee_id", "employee_name"}:
                continue
            points.append({"employee": employee, "skill": key, "score": value})
    return points
