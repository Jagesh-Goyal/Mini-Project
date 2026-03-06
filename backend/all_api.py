from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.model import Employee, Skill, EmployeeSkill
from backend.schemas import EmployeeCreate, SkillCreate, AssignSkillSchema, SkillDemandSchema

router = APIRouter()



# =============================
# Database Dependency
# =============================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =============================
# Employee APIs
# =============================

@router.post("/employees")
def add_employee(employee: EmployeeCreate, db: Session = Depends(get_db)):

    new_emp = Employee(
        name=employee.name,
        department=employee.department,
        role=employee.role,
        year_exp=employee.year_exp
    )

    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)

    return new_emp


@router.get("/employees")
def get_all_employees(db: Session = Depends(get_db)):
    return db.query(Employee).all()


# =============================
# Skill APIs
# =============================

@router.get("/skills")
def get_all_skills(db: Session = Depends(get_db)):
    return db.query(Skill).all()


# =============================
# Assign Skill
# =============================

@router.post("/assign-skill")
def assign_skill(data: AssignSkillSchema, db: Session = Depends(get_db)):

    employee = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not employee:
        return {"error": "Employee not found"}

    skill = db.query(Skill).filter(Skill.id == data.skill_id).first()
    if not skill:
        return {"error": "Skill not found"}

    new_mapping = EmployeeSkill(
        employee_id=data.employee_id,
        skill_id=data.skill_id,
        proficiency_level=data.proficiency_level
    )

    db.add(new_mapping)
    db.commit()
    db.refresh(new_mapping)

    return {"message": "Skill assigned successfully"}


# =============================
# Employee Skills
# =============================

@router.get("/employee-skills/{employee_id}")
def get_employee_skills(employee_id: int, db: Session = Depends(get_db)):

    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        return {"error": "Employee not found"}

    mappings = db.query(EmployeeSkill).filter(EmployeeSkill.employee_id == employee_id).all()

    skill_data = []

    for m in mappings:
        skill = db.query(Skill).filter(Skill.id == m.skill_id).first()

        skill_data.append({
            "skill_name": skill.skill_name,
            "proficiency_level": m.proficiency_level
        })

    return {
        "employee_name": employee.name,
        "skills": skill_data
    }


# =============================
# Skill Distribution
# =============================

@router.get("/skill-distribution")
def get_skill_distribution(db: Session = Depends(get_db)):

    from sqlalchemy import func

    results = (
        db.query(
            Skill.skill_name,
            func.count(EmployeeSkill.employee_id).label("employee_count")
        )
        .join(EmployeeSkill, Skill.id == EmployeeSkill.skill_id)
        .group_by(Skill.skill_name)
        .all()
    )

    return [
        {
            "skill_name": r.skill_name,
            "employee_count": r.employee_count
        }
        for r in results
    ]


# =============================
# Skill Gap Analysis
# =============================

@router.post("/skill-gap")
def calculate_skill_gap(data: SkillDemandSchema, db: Session = Depends(get_db)):

    from sqlalchemy import func

    skill = db.query(Skill).filter(Skill.skill_name == data.skill_name).first()

    if not skill:
        return {"error": "Skill not found"}

    current_count = (
        db.query(func.count(EmployeeSkill.employee_id))
        .filter(EmployeeSkill.skill_id == skill.id)
        .scalar()
    )

    gap = data.required_count - current_count

    return {
        "skill_name": data.skill_name,
        "required": data.required_count,
        "current": current_count,
        "gap": gap
    }


# =============================
# Recommendation System
# =============================

@router.get("/recommendation/{skill_name}")
def get_recommendation(skill_name: str, required_count: int, db: Session = Depends(get_db)):

    from sqlalchemy import func

    skill = db.query(Skill).filter(Skill.skill_name == skill_name).first()

    if not skill:
        return {"error": "Skill not found"}

    current_count = (
        db.query(func.count(EmployeeSkill.employee_id))
        .filter(EmployeeSkill.skill_id == skill.id)
        .scalar()
    )

    gap = required_count - current_count

    if gap <= 0:
        decision = "No action required"
    elif gap <= 2:
        decision = "Upskill existing employees"
    elif gap <= 5:
        decision = "Hire + Upskill recommended"
    else:
        decision = "Immediate hiring required"

    return {
        "skill": skill_name,
        "required": required_count,
        "current": current_count,
        "gap": gap,
        "recommendation": decision
    }


# =============================
# Analytics APIs
# =============================

@router.get("/analytics/proficiency-distribution")
def get_proficiency_distribution(db: Session = Depends(get_db)):
    from sqlalchemy import func
    
    results = (
        db.query(
            EmployeeSkill.proficiency_level,
            func.count(EmployeeSkill.id).label("count")
        )
        .group_by(EmployeeSkill.proficiency_level)
        .order_by(EmployeeSkill.proficiency_level)
        .all()
    )
    
    levels = {
        1: "Beginner",
        2: "Elementary",
        3: "Intermediate",
        4: "Advanced",
        5: "Expert"
    }
    
    return [
        {
            "level": r.proficiency_level,
            "level_name": levels.get(r.proficiency_level, "Unknown"),
            "count": r.count
        }
        for r in results
    ]


@router.get("/analytics/skill-categories")
def get_skill_category_breakdown(db: Session = Depends(get_db)):
    from sqlalchemy import func
    
    results = (
        db.query(
            Skill.category,
            func.count(EmployeeSkill.employee_id).label("total_assignments")
        )
        .join(EmployeeSkill, Skill.id == EmployeeSkill.skill_id)
        .group_by(Skill.category)
        .all()
    )
    
    return [
        {
            "category": r.category,
            "total_assignments": r.total_assignments
        }
        for r in results
    ]


@router.get("/analytics/experience-distribution")
def get_experience_distribution(db: Session = Depends(get_db)):
    results = db.query(Employee).all()
    
    exp_buckets = {
        "0-2 years": 0,
        "3-5 years": 0,
        "6-10 years": 0,
        "10+ years": 0
    }
    
    for emp in results:
        if emp.year_exp <= 2:
            exp_buckets["0-2 years"] += 1
        elif emp.year_exp <= 5:
            exp_buckets["3-5 years"] += 1
        elif emp.year_exp <= 10:
            exp_buckets["6-10 years"] += 1
        else:
            exp_buckets["10+ years"] += 1
    
    return [
        {"experience_range": k, "count": v}
        for k, v in exp_buckets.items()
    ]

@router.post("/skills")
def add_skill(skill: SkillCreate, db: Session = Depends(get_db)):

    skill_name = skill.skill_name

    existing = db.query(Skill).filter(Skill.skill_name == skill_name).first()

    if existing:
        return {"error": "Skill already exists"}

    new_skill = Skill(
        skill_name=skill.skill_name,
        category=skill.category
    )

    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)

    return {
        "message": "Skill added successfully",
        "data": {
            "id": new_skill.id,
            "skill_name": new_skill.skill_name
        }
    }