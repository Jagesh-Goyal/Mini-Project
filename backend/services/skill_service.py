import bleach
from sqlalchemy.orm import Session

from backend.models.employee import Employee, EmployeeSkill
from backend.models.skill import Skill
from backend.repositories import employee_repo, skill_repo


def create_skill(db: Session, name: str, category: str, description: str) -> Skill:
    skill = Skill(
        name=bleach.clean(name, strip=True),
        category=bleach.clean(category, strip=True),
        description=bleach.clean(description, strip=True),
    )
    return skill_repo.create(db, skill)


def build_skill_matrix(db: Session) -> list[dict]:
    employees = db.query(Employee).filter(Employee.is_active.is_(True)).all()
    skills = skill_repo.list_skills(db)
    lookup: dict[tuple[int, int], int] = {}
    for row in db.query(EmployeeSkill).all():
        lookup[(row.employee_id, row.skill_id)] = row.proficiency_level

    matrix: list[dict] = []
    for employee in employees:
        row = {"employee_id": employee.id, "employee_name": employee.name}
        for skill in skills:
            row[skill.name] = lookup.get((employee.id, skill.id), 0)
        matrix.append(row)
    return matrix


def build_heatmap_data(db: Session) -> dict:
    matrix = build_skill_matrix(db)
    if not matrix:
        return {"x": [], "y": [], "values": []}
    x = [key for key in matrix[0].keys() if key not in {"employee_id", "employee_name"}]
    y = [row["employee_name"] for row in matrix]
    values = [[row.get(skill, 0) for skill in x] for row in matrix]
    return {"x": x, "y": y, "values": values}


def assign_employee_skill(db: Session, employee_id: int, skill_id: int, proficiency_level: int):
    return employee_repo.assign_skill(db, employee_id, skill_id, proficiency_level)
