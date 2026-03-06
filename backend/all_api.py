from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.model import Employee, Skill, EmployeeSkill
from backend.schemas import EmployeeCreate, SkillCreate, AssignSkillSchema, SkillDemandSchema
from backend.ml_model import forecaster
from typing import Optional


# router object
router = APIRouter()

# database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


#API to add employee
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


#api to add skill
@router.post("/skills")
def add_skill(skill: SkillCreate, db: Session = Depends(get_db)):

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
@router.get("/skills")
def get_all_skills(db: Session = Depends(get_db)):
    skills = db.query(Skill).all()
    return skills


#api to assign skill to employee
#use many to many
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


#api to get skill distribution for 
# analytic
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


#api to add skill gap
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

#api to add recommendation based on analytic
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
        decision = "Hire + Upskill combination recommended"
    else:
        decision = "Immediate hiring required"

    return {
        "skill": skill_name,
        "required": required_count,
        "current": current_count,
        "gap": gap,
        "recommendation": decision
    }


#api to get employee skills
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


#=====================================
# ML MODEL APIs
#=====================================

#api to train ML models with real-time generated data
@router.post("/ml/train")
def train_ml_models(db: Session = Depends(get_db)):
    """
    Generate historical data and train both demand forecasting and turnover prediction models
    """
    try:
        # Generate historical data for past 24 months
        historical_data = forecaster.generate_historical_data(db, months=24)
        
        # Train demand forecasting model
        demand_metrics = forecaster.train_demand_forecasting_model(historical_data)
        
        # Generate employee features and train turnover model
        employee_data = forecaster.generate_employee_features(db)
        turnover_metrics = forecaster.train_turnover_prediction_model(employee_data)
        
        return {
            "status": "success",
            "message": "ML models trained successfully",
            "demand_forecasting": {
                "r2_score": demand_metrics['r2_score'],
                "rmse": demand_metrics['rmse'],
                "training_samples": demand_metrics['training_samples']
            },
            "turnover_prediction": {
                "accuracy": turnover_metrics['accuracy'],
                "training_samples": turnover_metrics['training_samples']
            },
            "dataset_info": {
                "historical_records": len(historical_data),
                "employee_records": len(employee_data)
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


#api to get skill demand forecast
@router.get("/ml/forecast/{skill_name}")
def get_skill_forecast(
    skill_name: str, 
    department: str, 
    months_ahead: int = 6,
    db: Session = Depends(get_db)
):
    """
    Get skill demand forecast for next N months
    """
    try:
        predictions = forecaster.predict_skill_demand(skill_name, department, months_ahead)
        return {
            "skill": skill_name,
            "department": department,
            "forecast": predictions
        }
    except Exception as e:
        return {"error": str(e), "message": "Please train the model first using /ml/train"}


#api to get model feature importance
@router.get("/ml/feature-importance")
def get_model_insights():
    """
    Get feature importance from the demand forecasting model
    """
    try:
        importance = forecaster.get_feature_importance()
        return {
            "feature_importance": importance,
            "top_features": list(importance.keys())[:3]
        }
    except Exception as e:
        return {"error": str(e), "message": "Please train the model first"}


#api to get department-wise skill analytics
@router.get("/analytics/department-skills")
def get_department_skill_analytics(db: Session = Depends(get_db)):
    """
    Get skill distribution grouped by department
    """
    from sqlalchemy import func
    
    results = (
        db.query(
            Employee.department,
            Skill.skill_name,
            func.count(EmployeeSkill.employee_id).label("count"),
            func.avg(EmployeeSkill.proficiency_level).label("avg_proficiency")
        )
        .join(EmployeeSkill, Employee.id == EmployeeSkill.employee_id)
        .join(Skill, Skill.id == EmployeeSkill.skill_id)
        .group_by(Employee.department, Skill.skill_name)
        .all()
    )
    
    # Group by department
    dept_data = {}
    for r in results:
        if r.department not in dept_data:
            dept_data[r.department] = []
        dept_data[r.department].append({
            "skill": r.skill_name,
            "count": r.count,
            "avg_proficiency": round(float(r.avg_proficiency), 2)
        })
    
    return dept_data


#api to get proficiency level distribution
@router.get("/analytics/proficiency-distribution")
def get_proficiency_distribution(db: Session = Depends(get_db)):
    """
    Get distribution of proficiency levels across all skills
    """
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


#api to get skill category breakdown
@router.get("/analytics/skill-categories")
def get_skill_category_breakdown(db: Session = Depends(get_db)):
    """
    Get skill distribution by category
    """
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


#api to get employee experience distribution
@router.get("/analytics/experience-distribution")
def get_experience_distribution(db: Session = Depends(get_db)):
    """
    Get distribution of employees by experience level
    """
    from sqlalchemy import func, case
    
    results = db.query(Employee).all()
    
    # Categorize by experience
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

