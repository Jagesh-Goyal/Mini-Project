import bleach
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.employee import Employee, EmployeeSkill
from backend.models.role import RoleEnum
from backend.repositories.employee_repo import EmployeeRepository
from backend.schemas.employee import AssignSkill, EmployeeCreate, EmployeeOut, EmployeeUpdate
from backend.security.csrf import validate_csrf_token
from backend.security.rbac import require_roles

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("", response_model=list[EmployeeOut], dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER, RoleEnum.TEAM_LEAD))])
def list_employees(skip: int = 0, limit: int = 20, search: str | None = Query(default=None), db: Session = Depends(get_db)):
    return EmployeeRepository(db).list_paginated(skip, limit, search)


@router.post("", response_model=EmployeeOut, dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER)), Depends(validate_csrf_token)])
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    repo = EmployeeRepository(db)
    emp = Employee(
        name=bleach.clean(payload.name, strip=True),
        email=bleach.clean(payload.email, strip=True).lower(),
        department=bleach.clean(payload.department, strip=True),
        team=bleach.clean(payload.team, strip=True),
        job_title=bleach.clean(payload.job_title, strip=True),
        years_experience=payload.years_experience,
    )
    return repo.create(emp)


@router.get("/{employee_id}", response_model=EmployeeOut, dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER, RoleEnum.TEAM_LEAD, RoleEnum.EMPLOYEE))])
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    row = EmployeeRepository(db).get(employee_id)
    if not row:
        raise HTTPException(status_code=404, detail="Employee not found")
    return row


@router.put("/{employee_id}", response_model=EmployeeOut, dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER)), Depends(validate_csrf_token)])
def update_employee(employee_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db)):
    repo = EmployeeRepository(db)
    row = repo.get(employee_id)
    if not row:
        raise HTTPException(status_code=404, detail="Employee not found")

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(row, key, value)
    return repo.save(row)


@router.delete("/{employee_id}", dependencies=[Depends(require_roles(RoleEnum.ADMIN)), Depends(validate_csrf_token)])
def soft_delete(employee_id: int, db: Session = Depends(get_db)):
    repo = EmployeeRepository(db)
    row = repo.get(employee_id)
    if not row:
        raise HTTPException(status_code=404, detail="Employee not found")
    row.is_active = False
    repo.save(row)
    return {"message": "Employee deactivated"}


@router.get("/{employee_id}/skills", dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER, RoleEnum.TEAM_LEAD, RoleEnum.EMPLOYEE))])
def employee_skills(employee_id: int, db: Session = Depends(get_db)):
    skills = db.query(EmployeeSkill).filter(EmployeeSkill.employee_id == employee_id).all()
    return [{"skill_id": s.skill_id, "proficiency_level": s.proficiency_level} for s in skills]


@router.post("/{employee_id}/skills", dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER)), Depends(validate_csrf_token)])
def assign_skill(employee_id: int, payload: AssignSkill, db: Session = Depends(get_db)):
    assignment = EmployeeSkill(employee_id=employee_id, skill_id=payload.skill_id, proficiency_level=payload.proficiency_level)
    EmployeeRepository(db).add_skill(assignment)
    return {"message": "Skill assigned"}
