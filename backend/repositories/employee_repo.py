from sqlalchemy import or_
from sqlalchemy.orm import Session

from backend.models.employee import Employee, EmployeeSkill


def list_employees(db: Session, skip: int = 0, limit: int = 20, search: str | None = None) -> list[Employee]:
    query = db.query(Employee).filter(Employee.is_active.is_(True))
    if search:
        wildcard = f"%{search.strip()}%"
        query = query.filter(or_(Employee.name.ilike(wildcard), Employee.email.ilike(wildcard)))
    return query.offset(skip).limit(limit).all()


def get_by_id(db: Session, employee_id: int) -> Employee | None:
    return db.query(Employee).filter(Employee.id == employee_id, Employee.is_active.is_(True)).first()


def create(db: Session, employee: Employee) -> Employee:
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


def update(db: Session, employee: Employee, updates: dict) -> Employee:
    for key, value in updates.items():
        setattr(employee, key, value)
    db.commit()
    db.refresh(employee)
    return employee


def soft_delete(db: Session, employee: Employee) -> None:
    employee.is_active = False
    db.commit()


def assign_skill(db: Session, employee_id: int, skill_id: int, proficiency_level: int) -> EmployeeSkill:
    row = db.query(EmployeeSkill).filter(EmployeeSkill.employee_id == employee_id, EmployeeSkill.skill_id == skill_id).first()
    if row:
        row.proficiency_level = proficiency_level
    else:
        row = EmployeeSkill(employee_id=employee_id, skill_id=skill_id, proficiency_level=proficiency_level)
        db.add(row)
    db.commit()
    db.refresh(row)
    return row
