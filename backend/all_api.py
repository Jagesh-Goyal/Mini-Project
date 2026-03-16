import csv
import base64
import hashlib
import hmac
import os
import secrets
from io import BytesIO, StringIO
from typing import Any
from datetime import datetime, timedelta, timezone

import pdfplumber
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, status
from fastapi.responses import Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from ml.model import ml_models
from backend.model import Employee, EmployeeSkill, Skill, TrainingHistory, User
from ml.nlp_extractor import extract_skills_from_resume
from backend.schemas import (
    AssignSkillSchema,
    CreateEmployeeFromResumeSchema,
    EmployeeCreate,
    LoginRequest,
    SignUpRequest,
    SignUpResponse,
    SkillCreate,
    SkillDemandSchema,
    SkillUpdate,
    TokenResponse,
    TrainingHistoryCreate,
)
from backend.security import rate_limit, auth_limiter, api_limiter, Role

router = APIRouter()
auth_router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer(auto_error=False)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change_this_jwt_secret_in_production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


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
# Auth Helpers
# =============================

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def hash_password(password: str) -> str:
    iterations = 100000
    salt = secrets.token_bytes(16)
    password_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)

    encoded_salt = base64.b64encode(salt).decode("utf-8")
    encoded_hash = base64.b64encode(password_hash).decode("utf-8")
    return f"{iterations}${encoded_salt}${encoded_hash}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        iterations_str, encoded_salt, encoded_hash = stored_hash.split("$", maxsplit=2)
        iterations = int(iterations_str)
        salt = base64.b64decode(encoded_salt.encode("utf-8"))
        expected_hash = base64.b64decode(encoded_hash.encode("utf-8"))

        current_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
        return hmac.compare_digest(current_hash, expected_hash)
    except (ValueError, TypeError):
        return False


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        subject = payload.get("sub")
        if subject is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


# Protect all business APIs.
api_router = APIRouter(tags=["api"], dependencies=[Depends(get_current_user)])

PROFICIENCY_LABELS = {
    1: "Beginner",
    2: "Intermediate",
    3: "Proficient",
    4: "Advanced",
    5: "Expert",
}

CATEGORY_GROWTH = {
    "AI/ML": 1.35,
    "Cloud": 1.30,
    "DevOps": 1.28,
    "Security": 1.32,
    "Backend": 1.20,
    "Frontend": 1.18,
    "Programming": 1.16,
    "Database": 1.15,
    "Data Science": 1.25,
}

STRATEGIC_SKILLS = {
    "Machine Learning",
    "Artificial Intelligence",
    "Cloud Security",
    "Kubernetes",
    "AWS",
    "Cybersecurity",
}


def require_roles(*allowed_roles: str):
    normalized_roles = {Role.normalize(role) for role in allowed_roles}

    def dependency(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = Role.normalize(current_user.get("role"))
        if user_role not in normalized_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )

        current_user["role"] = user_role
        return current_user

    return dependency


def _proficiency_label(level: int) -> str:
    return PROFICIENCY_LABELS.get(level, "Intermediate")


def _slugify_name(value: str) -> str:
    return "".join(char.lower() if char.isalnum() else "." for char in value).strip(".") or "employee"


def _generate_employee_code(db: Session) -> str:
    next_id = (db.query(func.max(Employee.id)).scalar() or 0) + 1
    return f"EMP-{next_id:04d}"


def _generated_employee_email(name: str, employee_code: str) -> str:
    code_suffix = employee_code.lower().replace("emp-", "")
    return f"{_slugify_name(name)}.{code_suffix}@dakshtra.local"


def _serialize_employee(employee: Employee) -> dict[str, Any]:
    join_date = employee.join_date.isoformat() if employee.join_date else None
    return {
        "id": employee.id,
        "employee_code": employee.employee_code,
        "name": employee.name,
        "email": employee.email,
        "department": employee.department,
        "role": employee.role,
        "year_exp": employee.year_exp,
        "join_date": join_date,
        "manager": employee.manager_name,
        "performance_score": employee.performance_score,
        "team_name": employee.team_name,
    }


def _serialize_skill(skill: Skill) -> dict[str, Any]:
    return {
        "id": skill.id,
        "skill_name": skill.skill_name,
        "category": skill.category,
        "description": skill.description,
    }


def _serialize_training(training: TrainingHistory) -> dict[str, Any]:
    return {
        "id": training.id,
        "training_name": training.training_name,
        "provider": training.provider,
        "status": training.status,
        "focus_skill": training.focus_skill,
        "duration_hours": training.duration_hours,
        "completion_date": training.completion_date.isoformat() if training.completion_date else None,
    }


def _coerce_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    return datetime.combine(value, datetime.min.time()).replace(tzinfo=timezone.utc)


def _employee_ids_for_scope(db: Session, department: str | None = None, team_name: str | None = None) -> list[int]:
    query = db.query(Employee.id)
    if department:
        query = query.filter(func.lower(Employee.department) == department.lower())
    if team_name:
        query = query.filter(func.lower(func.coalesce(Employee.team_name, "")) == team_name.lower())
    return [row.id for row in query.all()]


def _build_skill_heatmap_rows(db: Session, employee_ids: list[int] | None = None) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    skills = db.query(Skill).all()

    for skill in skills:
        available_query = db.query(func.count(func.distinct(EmployeeSkill.employee_id))).filter(
            EmployeeSkill.skill_id == skill.id
        )
        if employee_ids is not None:
            if not employee_ids:
                available_count = 0
            else:
                available_count = available_query.filter(EmployeeSkill.employee_id.in_(employee_ids)).scalar() or 0
        else:
            available_count = available_query.scalar() or 0

        growth_factor = CATEGORY_GROWTH.get(skill.category or "", 1.15)
        if skill.skill_name in STRATEGIC_SKILLS:
            growth_factor += 0.10

        if available_count == 0:
            required_count = 3 if skill.skill_name in STRATEGIC_SKILLS else 2
        else:
            required_count = max(
                available_count + 1,
                int(round(available_count * growth_factor)),
            )
            if skill.skill_name in STRATEGIC_SKILLS:
                required_count += 1

        gap = max(required_count - available_count, 0)
        coverage_ratio = round((available_count / required_count), 3) if required_count > 0 else 1.0

        if coverage_ratio >= 0.85 and gap <= 1:
            status = "GREEN"
            status_label = "Balanced"
        elif coverage_ratio >= 0.60 and gap <= 3:
            status = "YELLOW"
            status_label = "Medium Gap"
        else:
            status = "RED"
            status_label = "Critical Gap"

        rows.append(
            {
                "skill": skill.skill_name,
                "category": skill.category,
                "available": int(available_count),
                "required": int(required_count),
                "gap": int(gap),
                "status": status,
                "status_label": status_label,
                "coverage_ratio": coverage_ratio,
            }
        )

    rows.sort(key=lambda row: (row["gap"], row["required"]), reverse=True)
    return rows


def _risk_level_from_score(score: int) -> str:
    if score >= 70:
        return "HIGH"
    if score >= 40:
        return "MEDIUM"
    return "LOW"


def _severity_from_score(score: int) -> str:
    if score >= 70:
        return "HIGH"
    if score >= 35:
        return "MEDIUM"
    return "LOW"


def _build_gap_overview_scope(label: str, rows: list[dict[str, Any]]) -> dict[str, Any]:
    total_available = sum(row["available"] for row in rows)
    total_required = sum(row["required"] for row in rows)
    total_gap = sum(row["gap"] for row in rows)

    return {
        "scope": label,
        "total_available": total_available,
        "total_required": total_required,
        "total_gap": total_gap,
        "critical_skills": [row for row in rows if row["status"] == "RED"][:5],
        "rows": rows,
    }


def _dataframe_download_response(filename: str, rows: list[dict[str, Any]], export_format: str, title: str) -> Response:
    if export_format == "csv":
        buffer = StringIO()
        writer = csv.DictWriter(buffer, fieldnames=list(rows[0].keys()) if rows else ["message"])
        writer.writeheader()
        if rows:
            writer.writerows(rows)
        else:
            writer.writerow({"message": "No data available"})

        return Response(
            content=buffer.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}.csv"'},
        )

    if export_format == "xlsx":
        import pandas as pd

        dataframe = pd.DataFrame(rows or [{"message": "No data available"}])
        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            dataframe.to_excel(writer, sheet_name="Report", index=False)

        return Response(
            content=output.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}.xlsx"'},
        )

    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas

    output = BytesIO()
    pdf = canvas.Canvas(output, pagesize=A4)
    width, height = A4
    cursor_y = height - 50

    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(40, cursor_y, title)
    cursor_y -= 24

    pdf.setFont("Helvetica", 9)
    for row in rows[:40] or [{"message": "No data available"}]:
        line = " | ".join(f"{key}: {value}" for key, value in row.items())
        pdf.drawString(40, cursor_y, line[:140])
        cursor_y -= 14
        if cursor_y < 50:
            pdf.showPage()
            pdf.setFont("Helvetica", 9)
            cursor_y = height - 50

    pdf.save()
    return Response(
        content=output.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}.pdf"'},
    )


# =============================
# Auth APIs
# =============================

@auth_router.post("/signup", response_model=SignUpResponse, status_code=status.HTTP_201_CREATED)
@rate_limit(auth_limiter)
def signup(request: Request, data: SignUpRequest, db: Session = Depends(get_db)):
    """Rate limited to 10 requests per minute"""
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    new_user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=Role.EMPLOYEE,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Account created successfully",
        "email": new_user.email,
        "name": new_user.name,
    }


@auth_router.post("/login", response_model=TokenResponse)
@rate_limit(auth_limiter)
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    """Rate limited to 10 requests per minute"""
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "email": user.email,
        "name": user.name,
        "role": Role.normalize(user.role),
    }


@auth_router.get("/me")
def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == current_user.get("sub")).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return {
        "email": user.email,
        "name": user.name,
        "role": Role.normalize(current_user.get("role", Role.EMPLOYEE)),
        "role_label": Role.label(current_user.get("role", Role.EMPLOYEE)),
    }


# =============================
# Employee APIs
# =============================

@api_router.post("/employees")
@rate_limit(api_limiter)
def add_employee(
    request: Request,
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.HR_MANAGER)),
):
    employee_code = employee.employee_code or _generate_employee_code(db)
    employee_email = employee.email or _generated_employee_email(employee.name, employee_code)

    existing_employee = db.query(Employee).filter(func.lower(Employee.email) == employee_email.lower()).first()
    if existing_employee:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee email already exists")

    duplicate_code = db.query(Employee).filter(Employee.employee_code == employee_code).first()
    if duplicate_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee code already exists")

    new_emp = Employee(
        employee_code=employee_code,
        name=employee.name,
        email=employee_email,
        department=employee.department,
        role=employee.role,
        year_exp=employee.year_exp,
        join_date=_coerce_datetime(employee.join_date) or datetime.now(timezone.utc),
        manager_name=employee.manager,
        performance_score=employee.performance_score or 70,
        team_name=employee.team_name or employee.department,
    )

    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)

    return _serialize_employee(new_emp)


@api_router.get("/employees")
def get_all_employees(request: Request, db: Session = Depends(get_db)):
    employees = db.query(Employee).order_by(Employee.name.asc()).all()
    return [_serialize_employee(employee) for employee in employees]


@api_router.get("/employees/{employee_id}/profile")
def get_employee_profile(request: Request, employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    mappings = (
        db.query(EmployeeSkill, Skill)
        .join(Skill, Skill.id == EmployeeSkill.skill_id)
        .filter(EmployeeSkill.employee_id == employee_id)
        .order_by(Skill.skill_name.asc())
        .all()
    )

    training_history = (
        db.query(TrainingHistory)
        .filter(TrainingHistory.employee_id == employee_id)
        .order_by(TrainingHistory.completion_date.desc(), TrainingHistory.id.desc())
        .all()
    )

    return {
        "employee": _serialize_employee(employee),
        "skills": [
            {
                "skill_id": skill.id,
                "skill_name": skill.skill_name,
                "category": skill.category,
                "proficiency_level": mapping.proficiency_level,
                "proficiency_label": _proficiency_label(mapping.proficiency_level),
            }
            for mapping, skill in mappings
        ],
        "training_history": [_serialize_training(training) for training in training_history],
    }


@api_router.get("/employees/{employee_id}/training-history")
def get_employee_training_history(request: Request, employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    training_history = (
        db.query(TrainingHistory)
        .filter(TrainingHistory.employee_id == employee_id)
        .order_by(TrainingHistory.completion_date.desc(), TrainingHistory.id.desc())
        .all()
    )
    return [_serialize_training(training) for training in training_history]


@api_router.post("/employees/{employee_id}/training-history")
@rate_limit(api_limiter)
def add_training_history(
    request: Request,
    employee_id: int,
    payload: TrainingHistoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.HR_MANAGER)),
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    training = TrainingHistory(
        employee_id=employee_id,
        training_name=payload.training_name,
        provider=payload.provider,
        status=payload.status,
        focus_skill=payload.focus_skill,
        duration_hours=payload.duration_hours,
        completion_date=_coerce_datetime(payload.completion_date),
    )
    db.add(training)
    db.commit()
    db.refresh(training)
    return _serialize_training(training)


@api_router.put("/employees/{employee_id}")
@rate_limit(api_limiter)
def update_employee(
    request: Request,
    employee_id: int,
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.HR_MANAGER)),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    next_email = employee.email or emp.email or _generated_employee_email(employee.name, emp.employee_code or _generate_employee_code(db))

    existing_email = (
        db.query(Employee)
        .filter(func.lower(Employee.email) == next_email.lower(), Employee.id != employee_id)
        .first()
    )
    if existing_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee email already exists")

    next_employee_code = employee.employee_code or emp.employee_code or _generate_employee_code(db)
    duplicate_code = (
        db.query(Employee)
        .filter(Employee.employee_code == next_employee_code, Employee.id != employee_id)
        .first()
    )
    if duplicate_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee code already exists")

    emp.employee_code = next_employee_code
    emp.name = employee.name
    emp.email = next_email
    emp.department = employee.department
    emp.role = employee.role
    emp.year_exp = employee.year_exp
    emp.join_date = _coerce_datetime(employee.join_date) or emp.join_date
    emp.manager_name = employee.manager
    emp.performance_score = employee.performance_score or emp.performance_score or 70
    emp.team_name = employee.team_name or employee.department
    db.commit()
    db.refresh(emp)
    return _serialize_employee(emp)


@api_router.delete("/employees/{employee_id}")
@rate_limit(api_limiter)
def delete_employee(
    request: Request,
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.HR_MANAGER)),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    db.query(EmployeeSkill).filter(EmployeeSkill.employee_id == employee_id).delete()
    db.query(TrainingHistory).filter(TrainingHistory.employee_id == employee_id).delete()
    db.delete(emp)
    db.commit()
    return {"message": f"Employee {employee_id} deleted successfully"}


# =============================
# Skill APIs
# =============================

@api_router.post("/skills")
@rate_limit(api_limiter)
def add_skill(
    request: Request,
    skill: SkillCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.HR_MANAGER)),
):
    existing = db.query(Skill).filter(func.lower(Skill.skill_name) == skill.skill_name.lower()).first()

    if existing:
        return {"error": "Skill already exists"}

    new_skill = Skill(
        skill_name=skill.skill_name,
        category=skill.category,
        description=skill.description,
    )

    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)

    return {
        "message": "Skill added successfully",
        "data": {
            "id": new_skill.id,
            "skill_name": new_skill.skill_name,
            "category": new_skill.category,
            "description": new_skill.description,
        },
    }


@api_router.get("/skills")
def get_all_skills(request: Request, db: Session = Depends(get_db)):
    skills = db.query(Skill).order_by(Skill.category.asc(), Skill.skill_name.asc()).all()
    return [_serialize_skill(skill) for skill in skills]


@api_router.put("/skills/{skill_id}")
@rate_limit(api_limiter)
def update_skill(
    request: Request,
    skill_id: int,
    payload: SkillUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.HR_MANAGER)),
):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if skill is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")

    existing = (
        db.query(Skill)
        .filter(func.lower(Skill.skill_name) == payload.skill_name.lower(), Skill.id != skill_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Skill already exists")

    skill.skill_name = payload.skill_name
    skill.category = payload.category
    skill.description = payload.description
    db.commit()
    db.refresh(skill)
    return _serialize_skill(skill)


@api_router.delete("/skills/{skill_id}")
@rate_limit(api_limiter)
def delete_skill(
    request: Request,
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.HR_MANAGER)),
):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if skill is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")

    db.query(EmployeeSkill).filter(EmployeeSkill.skill_id == skill_id).delete()
    db.delete(skill)
    db.commit()
    return {"message": f"Skill {skill.skill_name} deleted successfully"}


# =============================
# Assign Skill
# =============================

@api_router.post("/assign-skill")
@rate_limit(api_limiter)
def assign_skill(
    request: Request,
    data: AssignSkillSchema,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.HR_MANAGER)),
):
    employee = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not employee:
        return {"error": "Employee not found"}

    skill = db.query(Skill).filter(Skill.id == data.skill_id).first()
    if not skill:
        return {"error": "Skill not found"}

    mapping = (
        db.query(EmployeeSkill)
        .filter(EmployeeSkill.employee_id == data.employee_id, EmployeeSkill.skill_id == data.skill_id)
        .first()
    )

    if mapping is None:
        mapping = EmployeeSkill(
            employee_id=data.employee_id,
            skill_id=data.skill_id,
            proficiency_level=data.proficiency_level,
        )
        db.add(mapping)
    else:
        mapping.proficiency_level = data.proficiency_level

    db.commit()
    db.refresh(mapping)

    return {
        "message": "Skill assigned successfully",
        "skill_name": skill.skill_name,
        "employee_name": employee.name,
        "proficiency_level": mapping.proficiency_level,
        "proficiency_label": _proficiency_label(mapping.proficiency_level),
    }


@api_router.get("/employee-skills/{employee_id}")
def get_employee_skills(request: Request, employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        return {"error": "Employee not found"}

    mappings = (
        db.query(EmployeeSkill, Skill)
        .join(Skill, Skill.id == EmployeeSkill.skill_id)
        .filter(EmployeeSkill.employee_id == employee_id)
        .all()
    )

    skill_data = [
        {
            "skill_id": skill.id,
            "skill_name": skill.skill_name,
            "category": skill.category,
            "proficiency_level": mapping.proficiency_level,
            "proficiency_label": _proficiency_label(mapping.proficiency_level),
        }
        for mapping, skill in mappings
    ]

    return {
        "employee_name": employee.name,
        "skills": skill_data,
    }


# =============================
# Skill Distribution
# =============================

@api_router.get("/skill-distribution")
def get_skill_distribution(request: Request, db: Session = Depends(get_db)):
    results = (
        db.query(
            Skill.skill_name,
            func.count(EmployeeSkill.employee_id).label("employee_count"),
        )
        .join(EmployeeSkill, Skill.id == EmployeeSkill.skill_id)
        .group_by(Skill.skill_name)
        .all()
    )

    return [
        {
            "skill_name": row.skill_name,
            "employee_count": row.employee_count,
        }
        for row in results
    ]


# =============================
# Skill Gap Analysis
# =============================

@api_router.post("/skill-gap")
def calculate_skill_gap(request: Request, data: SkillDemandSchema, db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.skill_name == data.skill_name).first()

    if not skill:
        return {"error": "Skill not found"}

    employee_ids = _employee_ids_for_scope(db, department=data.department, team_name=data.team_name)

    current_query = db.query(func.count(func.distinct(EmployeeSkill.employee_id))).filter(
        EmployeeSkill.skill_id == skill.id
    )
    if data.department or data.team_name:
        current_count = current_query.filter(EmployeeSkill.employee_id.in_(employee_ids)).scalar() if employee_ids else 0
    else:
        current_count = current_query.scalar()

    gap = data.required_count - current_count

    return {
        "skill_name": data.skill_name,
        "required": data.required_count,
        "current": current_count,
        "gap": gap,
        "department": data.department,
        "team_name": data.team_name,
        "scope": data.team_name or data.department or "Organization",
    }


# =============================
# Recommendation System
# =============================

@api_router.get("/recommendation/{skill_name}")
@rate_limit(api_limiter)
def get_recommendation(request: Request, skill_name: str, required_count: int, db: Session = Depends(get_db)):
    """Rate limited to 60 requests per minute"""
    skill = db.query(Skill).filter(Skill.skill_name == skill_name).first()

    if not skill:
        return {"error": "Skill not found"}

    current_count = (
        db.query(func.count(func.distinct(EmployeeSkill.employee_id)))
        .filter(EmployeeSkill.skill_id == skill.id)
        .scalar()
    ) or 0

    gap = required_count - current_count

    holders = (
        db.query(Employee, EmployeeSkill)
        .join(EmployeeSkill, Employee.id == EmployeeSkill.employee_id)
        .filter(EmployeeSkill.skill_id == skill.id)
        .order_by(EmployeeSkill.proficiency_level.desc(), Employee.performance_score.desc())
        .all()
    )
    internal_transfer_candidates = [
        {
            "employee_id": employee.id,
            "employee_name": employee.name,
            "department": employee.department,
            "team_name": employee.team_name,
            "proficiency_label": _proficiency_label(mapping.proficiency_level),
        }
        for employee, mapping in holders
        if mapping.proficiency_level >= 3
    ][:5]

    holder_ids = {employee.id for employee, _ in holders}
    upskill_candidates = [
        {
            "employee_id": employee.id,
            "employee_name": employee.name,
            "department": employee.department,
            "team_name": employee.team_name,
            "performance_score": employee.performance_score,
        }
        for employee in db.query(Employee)
        .order_by(Employee.performance_score.desc(), Employee.year_exp.desc())
        .all()
        if employee.id not in holder_ids
    ][:6]

    transfer_count = min(max(gap, 0), len(internal_transfer_candidates), 2)
    upskill_count = min(max(gap - transfer_count, 0), len(upskill_candidates), 4)
    hire_count = max(gap - transfer_count - upskill_count, 0)

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
        "recommendation": decision,
        "hire_count": hire_count,
        "upskill_count": upskill_count,
        "transfer_count": transfer_count,
        "internal_transfer_candidates": internal_transfer_candidates,
        "upskill_candidates": upskill_candidates,
        "recommended_actions": [
            f"Hire {hire_count} employees" if hire_count else None,
            f"Upskill {upskill_count} current employees" if upskill_count else None,
            f"Move {transfer_count} internal experts" if transfer_count else None,
        ],
    }


# =============================
# Resume Parsing APIs
# =============================

@api_router.post("/upload-resume")
@rate_limit(api_limiter)
async def upload_resume(request: Request, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File name is missing")

    lower_name = file.filename.lower()
    if not (lower_name.endswith(".pdf") or lower_name.endswith(".txt")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and TXT resumes are supported",
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    if lower_name.endswith(".pdf"):
        try:
            with pdfplumber.open(BytesIO(file_bytes)) as pdf:
                extracted_text = "\n".join((page.extract_text() or "") for page in pdf.pages)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to parse PDF resume",
            ) from exc
    else:
        try:
            extracted_text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            extracted_text = file_bytes.decode("latin-1", errors="ignore")

    if not extracted_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No readable text found in resume",
        )

    parsed = extract_skills_from_resume(extracted_text, db)

    return {
        "status": "success",
        "message": "Resume processed successfully",
        "name": parsed.get("name", "Unknown"),
        "experience_years": parsed.get("experience_years", 0),
        "extracted_skills": parsed.get("extracted_skills", []),
        "mapped_skills": parsed.get("mapped_skills", []),
    }


@api_router.post("/create-employee-from-resume")
@rate_limit(api_limiter)
def create_employee_from_resume(
    request: Request,
    data: CreateEmployeeFromResumeSchema,
    db: Session = Depends(get_db),
):
    employee_code = data.employee_code or _generate_employee_code(db)
    email = data.email or _generated_employee_email(data.name, employee_code)

    new_employee = Employee(
        employee_code=employee_code,
        name=data.name,
        email=email,
        department=data.department,
        role=data.role,
        year_exp=data.experience_years,
        join_date=_coerce_datetime(data.join_date) or datetime.now(timezone.utc),
        manager_name=data.manager,
        performance_score=data.performance_score,
        team_name=data.team_name or data.department,
    )
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    assigned_count = 0
    selected_skill_ids = sorted(set(data.skill_ids))

    if selected_skill_ids:
        valid_skill_ids = {
            skill.id
            for skill in db.query(Skill).filter(Skill.id.in_(selected_skill_ids)).all()
        }

        for skill_id in selected_skill_ids:
            if skill_id not in valid_skill_ids:
                continue

            db.add(
                EmployeeSkill(
                    employee_id=new_employee.id,
                    skill_id=skill_id,
                    proficiency_level=data.proficiency_level,
                )
            )
            assigned_count += 1

        db.commit()

    return {
        "status": "success",
        "message": "Employee created successfully",
        "employee_id": new_employee.id,
        "employee_code": new_employee.employee_code,
        "email": new_employee.email,
        "assigned_skills": assigned_count,
    }


# =============================
# Job Description Parser API
# =============================

class JDParseRequest(BaseModel):
    jd_text: str = Field(min_length=20, max_length=50000)


@api_router.post("/parse-jd")
@rate_limit(api_limiter)
def parse_job_description(request: Request, data: JDParseRequest, db: Session = Depends(get_db)):
    """
    Extract required skills from a job description text and return
    the skills found, how many employees currently hold them, and the gap.
    """
    from ml.nlp_extractor import NLPSkillExtractor

    extractor = NLPSkillExtractor(db)
    extracted_skills = extractor.extract_skills_from_text(data.jd_text)
    matched_skills   = extractor.match_skills_to_database(extracted_skills, db)

    # Build gap analysis per matched skill
    skill_analysis = []
    for skill_name, skill_id in matched_skills:
        current_count = (
            db.query(EmployeeSkill)
            .filter(EmployeeSkill.skill_id == skill_id)
            .count()
        )
        skill_analysis.append({
            "skill_name":    skill_name,
            "skill_id":      skill_id,
            "current_count": current_count,
            "in_database":   True,
        })

    # Skills extracted but not in DB yet
    matched_names = {s for _, s in [(m[1], m[0]) for m in matched_skills]}
    for skill_name in extracted_skills:
        if skill_name not in matched_names:
            skill_analysis.append({
                "skill_name":    skill_name,
                "skill_id":      None,
                "current_count": 0,
                "in_database":   False,
            })

    return {
        "status":              "success",
        "total_skills_found":  len(extracted_skills),
        "total_matched_in_db": len(matched_skills),
        "skill_analysis":      skill_analysis,
    }


# =============================
# ML APIs
# =============================

@api_router.post("/ml/train")
@rate_limit(api_limiter)
def train_ml_models(request: Request, db: Session = Depends(get_db)):
    result = ml_models.train_models(db)
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result["error"])
    return result


@api_router.get("/ml/forecast/{skill_name}")
@rate_limit(api_limiter)
def forecast_ml_skill(
    request: Request,
    skill_name: str,
    months_ahead: int = 3,
    department: str | None = None,
    scenario: str = "balanced",
    db: Session = Depends(get_db),
):
    if months_ahead not in {3, 6, 12}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="months_ahead must be one of: 3, 6, 12",
        )

    scenario_key = scenario.lower().strip()
    scenario_multiplier = {
        "conservative": 0.90,
        "balanced": 1.00,
        "aggressive": 1.15,
    }
    if scenario_key not in scenario_multiplier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="scenario must be one of: conservative, balanced, aggressive",
        )

    skill_obj = db.query(Skill).filter(func.lower(Skill.skill_name) == skill_name.lower()).first()
    if skill_obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")

    if ml_models.demand_model is None:
        train_result = ml_models.train_models(db)
        if "error" in train_result:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=train_result["error"])

    forecast_result = ml_models.forecast_demand(
        skill_name=skill_obj.skill_name,
        months_ahead=months_ahead,
        department=department,
        db=db,
    )

    if "error" in forecast_result:
        retrain_result = ml_models.train_models(db)
        if "error" in retrain_result:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=forecast_result["error"])

        forecast_result = ml_models.forecast_demand(
            skill_name=skill_obj.skill_name,
            months_ahead=months_ahead,
            department=department,
            db=db,
        )

    if "error" in forecast_result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=forecast_result["error"])

    adjusted_forecasts: dict[str, list[dict[str, Any]]] = {}
    multiplier = scenario_multiplier[scenario_key]

    for dept, predictions in forecast_result.get("forecasts", {}).items():
        adjusted_predictions: list[dict[str, Any]] = []

        for row in predictions:
            adjusted_demand = max(0, int(round(row["demand"] * multiplier)))
            adjusted_gap = max(0, adjusted_demand - row["supply"])

            adjusted_predictions.append(
                {
                    "month": row["month"],
                    "date": row["date"],
                    "demand": adjusted_demand,
                    "supply": row["supply"],
                    "gap": adjusted_gap,
                }
            )

        adjusted_forecasts[dept] = adjusted_predictions

    return {
        "skill": forecast_result.get("skill", skill_obj.skill_name),
        "months_ahead": forecast_result.get("months_ahead", months_ahead),
        "scenario": scenario_key,
        "forecasts": adjusted_forecasts,
    }


@api_router.get("/ml/turnover-risk/{employee_id}")
@rate_limit(api_limiter)
def get_turnover_risk(request: Request, employee_id: int, db: Session = Depends(get_db)):
    if ml_models.turnover_model is None:
        train_result = ml_models.train_models(db)
        if "error" in train_result:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=train_result["error"])

    result = ml_models.predict_turnover_risk(employee_id, db)
    error_message = result.get("error")

    if error_message:
        if "not found" in error_message.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_message)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_message)

    return result


# =============================
# Analytics APIs
# =============================

@api_router.get("/analytics/skill-heatmap")
@rate_limit(api_limiter)
def get_skill_heatmap(request: Request, db: Session = Depends(get_db)):
    rows = _build_skill_heatmap_rows(db)

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "legend": {
            "GREEN": "Balanced",
            "YELLOW": "Medium Gap",
            "RED": "Critical Gap",
        },
        "rows": rows,
    }


@api_router.get("/analytics/skill-gap-overview")
@rate_limit(api_limiter)
def get_skill_gap_overview(request: Request, db: Session = Depends(get_db)):
    organization_rows = _build_skill_heatmap_rows(db)
    employees = db.query(Employee).all()

    departments = []
    for department in sorted({employee.department or "Unknown" for employee in employees}):
        rows = _build_skill_heatmap_rows(db, _employee_ids_for_scope(db, department=department))
        departments.append(_build_gap_overview_scope(department, rows))

    teams = []
    for team_name in sorted({employee.team_name or employee.department or "General" for employee in employees}):
        rows = _build_skill_heatmap_rows(db, _employee_ids_for_scope(db, team_name=team_name))
        teams.append(_build_gap_overview_scope(team_name, rows))

    departments.sort(key=lambda item: item["total_gap"], reverse=True)
    teams.sort(key=lambda item: item["total_gap"], reverse=True)

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "organization": _build_gap_overview_scope("Organization", organization_rows),
        "departments": departments,
        "teams": teams,
    }


@api_router.get("/analytics/workforce-risk")
@rate_limit(api_limiter)
def get_workforce_risk(request: Request, db: Session = Depends(get_db)):
    employees = db.query(Employee).all()
    if not employees:
        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "overall_risk": "LOW",
            "top_risk_summary": "No employee data available",
            "teams": [],
        }

    departments = sorted({employee.department or "Unknown" for employee in employees})
    team_results: list[dict[str, Any]] = []

    for department in departments:
        department_employees = [
            employee for employee in employees if (employee.department or "Unknown") == department
        ]
        employee_ids = [employee.id for employee in department_employees]

        if not employee_ids:
            continue

        skill_rows = (
            db.query(
                Skill.skill_name,
                func.count(func.distinct(EmployeeSkill.employee_id)).label("employee_count"),
            )
            .join(EmployeeSkill, Skill.id == EmployeeSkill.skill_id)
            .join(Employee, Employee.id == EmployeeSkill.employee_id)
            .filter(Employee.id.in_(employee_ids))
            .group_by(Skill.skill_name)
            .all()
        )

        skill_counts = {
            row.skill_name: int(row.employee_count)
            for row in skill_rows
        }
        unique_skill_count = len(skill_counts)

        total_assignments = (
            db.query(func.count(EmployeeSkill.id))
            .filter(EmployeeSkill.employee_id.in_(employee_ids))
            .scalar()
        ) or 0

        employee_count = len(employee_ids)
        avg_skills_per_employee = total_assignments / employee_count if employee_count else 0

        single_dependency_skills = sorted(
            [skill_name for skill_name, count in skill_counts.items() if count == 1]
        )
        scarce_skills = sorted(
            [
                skill_name
                for skill_name, count in skill_counts.items()
                if count <= max(1, employee_count // 6)
            ]
        )

        backup_skill_count = sum(1 for count in skill_counts.values() if count >= 2)
        backup_coverage = (
            round(backup_skill_count / unique_skill_count, 3)
            if unique_skill_count > 0
            else 0.0
        )

        dependency_ratio = (
            len(single_dependency_skills) / unique_skill_count
            if unique_skill_count > 0
            else 1.0
        )
        depth_penalty = max(0.0, 3.0 - avg_skills_per_employee) * 8

        risk_score = min(
            100,
            int(
                round(
                    ((1 - backup_coverage) * 35)
                    + (dependency_ratio * 40)
                    + min(25, len(scarce_skills) * 4)
                    + depth_penalty
                )
            ),
        )

        risk_level = _risk_level_from_score(risk_score)

        issues: list[dict[str, Any]] = []

        if scarce_skills:
            scarcity_score = min(100, 30 + len(scarce_skills) * 10)
            issues.append(
                {
                    "type": "critical_skill_shortage",
                    "severity": _severity_from_score(scarcity_score),
                    "description": f"{len(scarce_skills)} critical skills have low team coverage",
                    "impacted_skills": scarce_skills[:6],
                }
            )

        if single_dependency_skills:
            dependency_score = min(100, 20 + len(single_dependency_skills) * 8)
            issues.append(
                {
                    "type": "single_skill_dependency",
                    "severity": _severity_from_score(dependency_score),
                    "description": "Several skills depend on only one employee",
                    "impacted_skills": single_dependency_skills[:6],
                }
            )

        if backup_coverage < 0.50:
            backup_score = int((1 - backup_coverage) * 100)
            issues.append(
                {
                    "type": "lack_of_backup_employees",
                    "severity": _severity_from_score(backup_score),
                    "description": "Backup coverage is below the recommended threshold",
                    "impacted_skills": single_dependency_skills[:6],
                }
            )

        summary = (
            f"{department} has {risk_level.lower()} risk with "
            f"{int(round(backup_coverage * 100))}% backup coverage"
        )

        team_results.append(
            {
                "department": department,
                "team_label": f"{department} Team",
                "risk_level": risk_level,
                "risk_score": risk_score,
                "summary": summary,
                "employee_count": employee_count,
                "unique_skill_count": unique_skill_count,
                "backup_coverage": backup_coverage,
                "issues": issues,
            }
        )

    team_results.sort(key=lambda team: team["risk_score"], reverse=True)

    overall_risk = team_results[0]["risk_level"] if team_results else "LOW"
    top_risk_summary = (
        f"{team_results[0]['team_label']} Risk = {team_results[0]['risk_level']}"
        if team_results
        else "No risk data available"
    )

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "overall_risk": overall_risk,
        "top_risk_summary": top_risk_summary,
        "teams": team_results,
    }


@api_router.get("/analytics/skill-graph")
@rate_limit(api_limiter)
def get_skill_graph(request: Request, db: Session = Depends(get_db)):
    employees = db.query(Employee).all()
    skills = db.query(Skill).all()
    mappings = db.query(EmployeeSkill).all()

    nodes = [
        {
            "id": f"employee-{employee.id}",
            "label": employee.name,
            "type": "employee",
            "department": employee.department,
            "role": employee.role,
        }
        for employee in employees
    ]
    nodes.extend(
        [
            {
                "id": f"skill-{skill.id}",
                "label": skill.skill_name,
                "type": "skill",
                "category": skill.category,
            }
            for skill in skills
        ]
    )

    edges = [
        {
            "source": f"employee-{mapping.employee_id}",
            "target": f"skill-{mapping.skill_id}",
            "weight": mapping.proficiency_level,
        }
        for mapping in mappings
    ]

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "nodes": nodes,
        "edges": edges,
    }

@api_router.get("/analytics/proficiency-distribution")
@rate_limit(api_limiter)
def get_proficiency_distribution(request: Request, db: Session = Depends(get_db)):
    """Rate limited to 60 requests per minute"""
    results = (
        db.query(
            EmployeeSkill.proficiency_level,
            func.count(EmployeeSkill.id).label("count"),
        )
        .group_by(EmployeeSkill.proficiency_level)
        .order_by(EmployeeSkill.proficiency_level)
        .all()
    )

    levels = {
        1: "Beginner",
        2: "Intermediate",
        3: "Proficient",
        4: "Advanced",
        5: "Expert",
    }

    return [
        {
            "level": row.proficiency_level,
            "level_name": levels.get(row.proficiency_level, "Unknown"),
            "count": row.count,
        }
        for row in results
    ]


@api_router.get("/analytics/skill-categories")
@rate_limit(api_limiter)
def get_skill_category_breakdown(request: Request, db: Session = Depends(get_db)):
    """Rate limited to 60 requests per minute"""
    results = (
        db.query(
            Skill.category,
            func.count(EmployeeSkill.employee_id).label("total_assignments"),
        )
        .join(EmployeeSkill, Skill.id == EmployeeSkill.skill_id)
        .group_by(Skill.category)
        .all()
    )

    return [
        {
            "category": row.category,
            "total_assignments": row.total_assignments,
        }
        for row in results
    ]


@api_router.get("/analytics/experience-distribution")
@rate_limit(api_limiter)
def get_experience_distribution(request: Request, db: Session = Depends(get_db)):
    """Rate limited to 60 requests per minute"""
    results = db.query(Employee).all()

    exp_buckets = {
        "0-2 years": 0,
        "3-5 years": 0,
        "6-10 years": 0,
        "10+ years": 0,
    }

    for employee in results:
        if employee.year_exp <= 2:
            exp_buckets["0-2 years"] += 1
        elif employee.year_exp <= 5:
            exp_buckets["3-5 years"] += 1
        elif employee.year_exp <= 10:
            exp_buckets["6-10 years"] += 1
        else:
            exp_buckets["10+ years"] += 1

    return [{"experience_range": key, "count": value} for key, value in exp_buckets.items()]


@api_router.get("/analytics/upskilling-recommendations")
@rate_limit(api_limiter)
def get_upskilling_recommendations(request: Request, db: Session = Depends(get_db)):
    heatmap_rows = _build_skill_heatmap_rows(db)
    high_gap_skills = [row for row in heatmap_rows if row["gap"] > 0][:6]

    employee_skill_rows = (
        db.query(EmployeeSkill, Skill)
        .join(Skill, Skill.id == EmployeeSkill.skill_id)
        .all()
    )
    skills_by_employee: dict[int, list[str]] = {}
    for mapping, skill in employee_skill_rows:
        skills_by_employee.setdefault(mapping.employee_id, []).append(skill.skill_name)

    recommendations = []
    employees = db.query(Employee).order_by(Employee.performance_score.desc(), Employee.year_exp.desc()).all()
    for employee in employees:
        current_skills = skills_by_employee.get(employee.id, [])
        recommended_skills = [
            row["skill"]
            for row in high_gap_skills
            if row["skill"] not in current_skills
        ][:3]

        if not recommended_skills:
            continue

        priority = "HIGH" if (employee.performance_score or 0) >= 85 else "MEDIUM"
        recommendations.append(
            {
                "employee_id": employee.id,
                "employee_name": employee.name,
                "department": employee.department,
                "current_skills": current_skills[:6],
                "recommended_skills": recommended_skills,
                "priority": priority,
                "rationale": (
                    f"{employee.name} has strong performance and can help close high-gap skills for "
                    f"{employee.department}."
                ),
            }
        )

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "high_gap_skills": [
            {
                "skill": row["skill"],
                "gap": row["gap"],
                "status_label": row["status_label"],
            }
            for row in high_gap_skills
        ],
        "recommendations": recommendations[:10],
    }


@api_router.get("/reports/skill-gap")
@rate_limit(api_limiter)
def export_skill_gap_report(
    request: Request,
    export_format: str = Query("csv", pattern="^(csv|xlsx|pdf)$"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.HR_MANAGER)),
):
    rows = _build_skill_heatmap_rows(db)
    return _dataframe_download_response("skill-gap-report", rows, export_format, "Skill Gap Report")


@api_router.get("/reports/employee-skills")
@rate_limit(api_limiter)
def export_employee_skill_report(
    request: Request,
    export_format: str = Query("csv", pattern="^(csv|xlsx|pdf)$"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.HR_MANAGER)),
):
    rows = []
    assignments = (
        db.query(Employee, Skill, EmployeeSkill)
        .join(EmployeeSkill, Employee.id == EmployeeSkill.employee_id)
        .join(Skill, Skill.id == EmployeeSkill.skill_id)
        .order_by(Employee.name.asc(), Skill.skill_name.asc())
        .all()
    )
    for employee, skill, mapping in assignments:
        rows.append(
            {
                "employee_code": employee.employee_code,
                "employee_name": employee.name,
                "email": employee.email,
                "department": employee.department,
                "team_name": employee.team_name,
                "role": employee.role,
                "skill": skill.skill_name,
                "category": skill.category,
                "proficiency": _proficiency_label(mapping.proficiency_level),
                "performance_score": employee.performance_score,
            }
        )

    return _dataframe_download_response("employee-skill-report", rows, export_format, "Employee Skill Report")


@api_router.get("/reports/forecast")
@rate_limit(api_limiter)
def export_forecast_report(
    request: Request,
    skill_name: str,
    months_ahead: int = Query(6, ge=3, le=12),
    scenario: str = Query("balanced"),
    export_format: str = Query("csv", pattern="^(csv|xlsx|pdf)$"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.HR_MANAGER)),
):
    skill_obj = db.query(Skill).filter(func.lower(Skill.skill_name) == skill_name.lower()).first()
    if skill_obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")

    if ml_models.demand_model is None:
        train_result = ml_models.train_models(db)
        if "error" in train_result:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=train_result["error"])

    scenario_multiplier = {
        "conservative": 0.90,
        "balanced": 1.00,
        "aggressive": 1.15,
    }
    scenario_key = scenario.lower().strip()
    if scenario_key not in scenario_multiplier:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid scenario")

    forecast_result = ml_models.forecast_demand(
        skill_name=skill_obj.skill_name,
        months_ahead=months_ahead,
        db=db,
    )
    if "error" in forecast_result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=forecast_result["error"])

    rows = []
    for department, predictions in forecast_result.get("forecasts", {}).items():
        for row in predictions:
            adjusted_demand = max(0, int(round(row["demand"] * scenario_multiplier[scenario_key])))
            rows.append(
                {
                    "skill": skill_obj.skill_name,
                    "department": department,
                    "date": row["date"],
                    "scenario": scenario_key,
                    "demand": adjusted_demand,
                    "supply": row["supply"],
                    "gap": max(adjusted_demand - row["supply"], 0),
                }
            )

    return _dataframe_download_response("forecast-report", rows, export_format, "Forecast Report")


router.include_router(auth_router)
router.include_router(api_router)
