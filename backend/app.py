import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

# database engine
from backend.database import engine, SessionLocal

# models
from backend import model

# router import
from backend.all_api import hash_password, router

# security helpers
from backend.security import Role

# seed database
from backend.seed import seed_database

from ml.model import ml_models


# create database tables
model.Base.metadata.create_all(bind=engine)


def ensure_users_schema_compatibility() -> None:
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    if "users" not in table_names:
        return

    user_columns = {column["name"] for column in inspector.get_columns("users")}

    with engine.begin() as connection:
        if "role" not in user_columns:
            connection.execute(
                text("ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user'")
            )

        if "created_at" not in user_columns:
            connection.execute(
                text("ALTER TABLE users ADD COLUMN created_at DATETIME")
            )


def ensure_default_admin_user() -> None:
    db = SessionLocal()
    try:
        existing_admin = db.query(model.User).filter(model.User.email == "admin@dakshtra.com").first()
        if existing_admin is None:
            db.add(
                model.User(
                    name="Admin",
                    email="admin@dakshtra.com",
                    password_hash=hash_password("admin123"),
                    role=Role.ADMIN,
                )
            )
            db.commit()
    finally:
        db.close()

# seed database with sample data
try:
    seed_database()
except Exception as e:
    print(f"Database seeding skipped: {e}")

ensure_users_schema_compatibility()
ensure_default_admin_user()


# FastAPI app
app = FastAPI(
    title="Dakshtra Workforce API",
    version="1.0.0",
)

# =============================
# Security Setup
# =============================

# CORS Configuration - Restricted to specific frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
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
