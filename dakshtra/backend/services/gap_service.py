from collections import defaultdict

from sqlalchemy.orm import Session

from backend.models.employee import Employee, EmployeeSkill
from backend.models.skill import RoleRequirement, Skill


def _risk_level(gap_percent: float) -> str:
    if gap_percent >= 70:
        return "critical"
    if gap_percent >= 50:
        return "high"
    if gap_percent >= 30:
        return "medium"
    return "low"


def calculate_role_gap(db: Session, role_name: str):
    reqs = db.query(RoleRequirement).filter(RoleRequirement.role_name == role_name).all()
    if not reqs:
        return []

    output = []
    for req in reqs:
        skill = db.query(Skill).filter(Skill.id == req.skill_id).first()
        levels = [x.proficiency_level for x in db.query(EmployeeSkill).filter(EmployeeSkill.skill_id == req.skill_id).all()]
        avg_level = sum(levels) / max(len(levels), 1)
        gap_percent = max(((req.required_level - avg_level) / max(req.required_level, 1)) * 100, 0)
        output.append(
            {
                "skill_name": skill.name if skill else f"skill_{req.skill_id}",
                "required_level": req.required_level,
                "avg_current_level": round(avg_level, 2),
                "gap_percent": round(gap_percent, 2),
                "risk_level": _risk_level(gap_percent),
            }
        )
    return output


def calculate_department_gap(db: Session, department: str):
    employees = db.query(Employee).filter(Employee.department == department, Employee.is_active.is_(True)).all()
    return _aggregate_employee_gaps(db, [e.id for e in employees])


def calculate_team_gap(db: Session, team: str):
    employees = db.query(Employee).filter(Employee.team == team, Employee.is_active.is_(True)).all()
    return _aggregate_employee_gaps(db, [e.id for e in employees])


def calculate_org_gap(db: Session):
    employees = db.query(Employee).filter(Employee.is_active.is_(True)).all()
    return _aggregate_employee_gaps(db, [e.id for e in employees])


def _aggregate_employee_gaps(db: Session, employee_ids: list[int]):
    grouped = defaultdict(list)
    for row in db.query(EmployeeSkill).filter(EmployeeSkill.employee_id.in_(employee_ids)).all() if employee_ids else []:
        grouped[row.skill_id].append(row.proficiency_level)

    rows = []
    for skill in db.query(Skill).all():
        current = grouped.get(skill.id, [])
        avg_level = sum(current) / max(len(current), 1)
        required = 4
        gap_percent = max(((required - avg_level) / required) * 100, 0)
        rows.append(
            {
                "skill_name": skill.name,
                "required_level": required,
                "avg_current_level": round(avg_level, 2),
                "gap_percent": round(gap_percent, 2),
                "risk_level": _risk_level(gap_percent),
            }
        )
    return rows
