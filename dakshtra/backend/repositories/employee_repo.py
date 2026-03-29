from sqlalchemy import or_
from sqlalchemy.orm import Session

from backend.models.employee import Employee, EmployeeSkill


class EmployeeRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_paginated(self, skip: int, limit: int, search: str | None = None):
        query = self.db.query(Employee).filter(Employee.is_active.is_(True))
        if search:
            query = query.filter(or_(Employee.name.ilike(f"%{search}%"), Employee.email.ilike(f"%{search}%")))
        return query.offset(skip).limit(limit).all()

    def get(self, employee_id: int) -> Employee | None:
        return self.db.query(Employee).filter(Employee.id == employee_id).first()

    def create(self, employee: Employee) -> Employee:
        self.db.add(employee)
        self.db.commit()
        self.db.refresh(employee)
        return employee

    def save(self, employee: Employee) -> Employee:
        self.db.commit()
        self.db.refresh(employee)
        return employee

    def add_skill(self, assignment: EmployeeSkill) -> EmployeeSkill:
        self.db.add(assignment)
        self.db.commit()
        self.db.refresh(assignment)
        return assignment
