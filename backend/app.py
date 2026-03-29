import os
import re
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

# database engine
from backend.database import engine, SessionLocal

# models
from backend import model

# router import
from backend.all_api import hash_password, verify_password, router

# security helpers
from backend.security import Role
from backend.logging_config import configure_logging, get_logger

# seed database
from backend.seed import seed_database

from ml.model import ml_models


configure_logging()
logger = get_logger("dakshtra.app")


# create database tables
model.Base.metadata.create_all(bind=engine)


def _slugify_name(value: str) -> str:
    clean_value = re.sub(r"[^a-z0-9]+", ".", value.strip().lower())
    return clean_value.strip(".") or "employee"


def ensure_workforce_schema_compatibility() -> None:
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    with engine.begin() as connection:
        if "employees" in table_names:
            employee_columns = {column["name"] for column in inspector.get_columns("employees")}
            if "employee_code" not in employee_columns:
                connection.execute(text("ALTER TABLE employees ADD COLUMN employee_code VARCHAR(50)"))
            if "email" not in employee_columns:
                connection.execute(text("ALTER TABLE employees ADD COLUMN email VARCHAR(255)"))
            if "join_date" not in employee_columns:
                connection.execute(text("ALTER TABLE employees ADD COLUMN join_date DATETIME"))
            if "manager_name" not in employee_columns:
                connection.execute(text("ALTER TABLE employees ADD COLUMN manager_name VARCHAR(100)"))
            if "performance_score" not in employee_columns:
                connection.execute(text("ALTER TABLE employees ADD COLUMN performance_score INTEGER DEFAULT 70"))
            if "team_name" not in employee_columns:
                connection.execute(text("ALTER TABLE employees ADD COLUMN team_name VARCHAR(100)"))
            if "created_at" not in employee_columns:
                connection.execute(text("ALTER TABLE employees ADD COLUMN created_at DATETIME"))
            if "updated_at" not in employee_columns:
                connection.execute(text("ALTER TABLE employees ADD COLUMN updated_at DATETIME"))

        if "skills" in table_names:
            skill_columns = {column["name"] for column in inspector.get_columns("skills")}
            if "description" not in skill_columns:
                connection.execute(text("ALTER TABLE skills ADD COLUMN description TEXT"))
            if "created_at" not in skill_columns:
                connection.execute(text("ALTER TABLE skills ADD COLUMN created_at DATETIME"))

        if "employee_skills" in table_names:
            employee_skill_columns = {column["name"] for column in inspector.get_columns("employee_skills")}
            if "updated_at" not in employee_skill_columns:
                connection.execute(text("ALTER TABLE employee_skills ADD COLUMN updated_at DATETIME"))

        if "users" in table_names:
            user_columns = {column["name"] for column in inspector.get_columns("users")}
            if "role" not in user_columns:
                connection.execute(
                    text("ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'employee'")
                )
<<<<<<< HEAD
            if "is_active" not in user_columns:
                connection.execute(
                    text("ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1")
                )
            if "last_login" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN last_login DATETIME"))
            if "created_at" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN created_at DATETIME"))
            if "updated_at" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN updated_at DATETIME"))
=======
            if "created_at" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN created_at DATETIME"))
>>>>>>> 3bcda08 (Updated backend files)

    db = SessionLocal()
    try:
        employees = db.query(model.Employee).all()
        for employee in employees:
            if not employee.employee_code:
                employee.employee_code = f"EMP-{employee.id:04d}"
            if not employee.email:
                employee.email = f"{_slugify_name(employee.name)}.{employee.id}@dakshtra.local"
            if employee.performance_score is None:
                employee.performance_score = 70
            if not employee.team_name:
                employee.team_name = employee.department or "General"
            if not employee.manager_name:
                employee.manager_name = f"Head of {employee.department or 'Operations'}"

        skills = db.query(model.Skill).all()
        for skill in skills:
            if not skill.description:
                skill.description = f"{skill.skill_name} capability for the {skill.category} domain."

        users = db.query(model.User).all()
        for user in users:
            user.role = Role.normalize(user.role)

        db.commit()
    finally:
        db.close()


def ensure_default_system_users() -> None:
    db = SessionLocal()
    try:
<<<<<<< HEAD
        default_admin_email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@dakshtra.com")
        default_hr_email = os.getenv("DEFAULT_HR_EMAIL", "hr@dakshtra.com")
        default_employee_email = os.getenv("DEFAULT_EMPLOYEE_EMAIL", "employee@dakshtra.com")

        default_users = [
            (
                "Admin",
                default_admin_email,
                os.getenv("DEFAULT_ADMIN_PASSWORD") or "admin123",
                Role.ADMIN,
            ),
            (
                "HR Manager",
                default_hr_email,
                os.getenv("DEFAULT_HR_PASSWORD") or "hr123456",
                Role.HR_MANAGER,
            ),
            (
                "Employee",
                default_employee_email,
                os.getenv("DEFAULT_EMPLOYEE_PASSWORD") or "employee123",
                Role.EMPLOYEE,
            ),
=======
        default_users = [
            ("Admin", "admin@dakshtra.com", "admin123", Role.ADMIN),
            ("HR Manager", "hr@dakshtra.com", "hrmanager123", Role.HR_MANAGER),
            ("Employee", "employee@dakshtra.com", "employee123", Role.EMPLOYEE),
>>>>>>> 3bcda08 (Updated backend files)
        ]

        for name, email, password, role in default_users:
            existing_user = db.query(model.User).filter(model.User.email == email).first()
            if existing_user is None:
                db.add(
                    model.User(
                        name=name,
                        email=email,
                        password_hash=hash_password(password),
                        role=role,
                    )
                )
<<<<<<< HEAD
            else:
                existing_user.role = Role.normalize(existing_user.role)

                should_repair_default_password = (
                    existing_user.last_login is None
                    and existing_user.email in {default_admin_email, default_hr_email, default_employee_email}
                    and not verify_password(password, existing_user.password_hash)
                )

                if should_repair_default_password:
                    existing_user.password_hash = hash_password(password)
                    logger.warning(
                        "Repaired password for default system user %s. Configure DEFAULT_*_PASSWORD in environment for production.",
                        existing_user.email,
                    )
=======
>>>>>>> 3bcda08 (Updated backend files)

        db.commit()
    finally:
        db.close()

ensure_workforce_schema_compatibility()

try:
    seed_database()
except Exception as e:
    print(f"Database seeding skipped: {e}")

ensure_default_system_users()


# FastAPI app
app = FastAPI(
    title="Dakshtra Workforce API",
    version="1.0.0",
)

# =============================
# Scheduler Setup - Auto Model Retraining
# =============================
from backend.scheduler import initialize_scheduler, shutdown_scheduler

@app.on_event("startup")
def startup_event():
    """Initialize background scheduler on app startup."""
    initialize_scheduler()
    logger.info("Application startup completed")

@app.on_event("shutdown")
def shutdown_event():
    """Gracefully shutdown scheduler on app shutdown."""
    shutdown_scheduler()
    logger.info("Application shutdown completed")

# =============================
# Security Setup
# =============================

# CORS Configuration - Restricted to specific frontend origins
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-CSRF-Token"],
)

# include routes
app.include_router(router)


# root endpoint
@app.get("/")
def root():
    return {
        "status": "success",
        "server": "running",
        "database": "connected"
    }


# ==========================
# ML Forecast API
# ==========================

@app.get("/forecast/{skill_name}")
def forecast_skill_demand(skill_name: str):
    db = SessionLocal()
    try:
        skill = db.query(model.Skill).filter(model.Skill.skill_name.ilike(skill_name)).first()

        if skill is None:
            return {
                "skill": skill_name,
                "predicted_demand_next_month": 0,
                "note": "Skill not found",
            }

        current_supply = (
            db.query(model.EmployeeSkill)
            .filter(model.EmployeeSkill.skill_id == skill.id)
            .count()
        )

        if ml_models.demand_model is None:
            train_result = ml_models.train_models(db)
            if "error" in train_result:
                return {
                    "skill": skill.skill_name,
                    "predicted_demand_next_month": max(current_supply + 1, 1),
                }

        forecast_result = ml_models.forecast_demand(
            skill_name=skill.skill_name,
            months_ahead=1,
            db=db,
        )

        if "error" in forecast_result:
            return {
                "skill": skill.skill_name,
                "predicted_demand_next_month": max(current_supply + 1, 1),
            }

        top_prediction = current_supply
        for department_rows in forecast_result.get("forecasts", {}).values():
            if department_rows:
                top_prediction = max(top_prediction, int(department_rows[0].get("demand", current_supply)))

        return {
            "skill": skill.skill_name,
            "predicted_demand_next_month": int(top_prediction),
        }
    finally:
        db.close()
