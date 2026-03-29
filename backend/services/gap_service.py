from collections import defaultdict

from sqlalchemy.orm import Session

from backend.models.employee import Employee, EmployeeSkill
from backend.models.role import RoleRequirement
from backend.models.skill import Skill


def _risk_from_gap(gap_percent: float) -> str:
    if gap_percent > 70:
        return "critical"
    if gap_percent > 50:
        return "high"
    if gap_percent > 30:
        return "medium"
    return "low"


def calculate_gap(required_level: float, avg_current_level: float) -> float:
    if required_level <= 0:
        return 0
    gap_score = max(required_level - avg_current_level, 0)
    return round((gap_score / required_level) * 100, 2)


def role_gap_analysis(db: Session, role_name: str) -> dict:
    requirements = db.query(RoleRequirement).filter(RoleRequirement.role_name == role_name).all()
    if not requirements:
        return {"context": role_name, "gap_percentage": 0, "critical_skills_missing": [], "risk_level": "low", "items": []}

    current_levels = defaultdict(list)
    for row in db.query(EmployeeSkill).all():
        current_levels[row.skill_id].append(row.proficiency_level)

    items = []
    critical_skills = []
    gaps = []
    for req in requirements:
        avg = sum(current_levels[req.skill_id]) / len(current_levels[req.skill_id]) if current_levels[req.skill_id] else 0
        skill = db.query(Skill).filter(Skill.id == req.skill_id).first()
        gap_percent = calculate_gap(req.required_level, avg)
        risk = _risk_from_gap(gap_percent)
        if risk in {"critical", "high"} and skill:
            critical_skills.append(skill.name)
        gaps.append(gap_percent)
        items.append(
            {
                "skill": skill.name if skill else str(req.skill_id),
                "required_level": req.required_level,
                "avg_current_level": round(avg, 2),
                "gap_percent": gap_percent,
                "risk_level": risk,
            }
        )

    org_gap = round(sum(gaps) / len(gaps), 2) if gaps else 0
    return {
        "context": role_name,
        "gap_percentage": org_gap,
        "critical_skills_missing": critical_skills,
        "risk_level": _risk_from_gap(org_gap),
        "items": items,
    }


def org_gap_analysis(db: Session) -> dict:
    roles = [row[0] for row in db.query(RoleRequirement.role_name).distinct().all()]
    all_items = []
    critical = []
    gaps = []
    for role in roles:
        report = role_gap_analysis(db, role)
        all_items.extend(report["items"])
        critical.extend(report["critical_skills_missing"])
        gaps.append(report["gap_percentage"])
    avg_gap = round(sum(gaps) / len(gaps), 2) if gaps else 0
    return {
        "context": "organization",
        "gap_percentage": avg_gap,
        "critical_skills_missing": sorted(set(critical)),
        "risk_level": _risk_from_gap(avg_gap),
        "items": all_items,
    }


def department_gap_analysis(db: Session, department: str) -> dict:
    employees = db.query(Employee).filter(Employee.department == department, Employee.is_active.is_(True)).all()
    if not employees:
        return {"context": department, "gap_percentage": 0, "critical_skills_missing": [], "risk_level": "low", "items": []}
    return org_gap_analysis(db) | {"context": department}
