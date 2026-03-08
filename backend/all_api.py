import base64
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend.model import Employee, EmployeeSkill, Skill, User
from backend.schemas import (
    AssignSkillSchema,
    EmployeeCreate,
    LoginRequest,
    SignUpRequest,
    SignUpResponse,
    SkillCreate,
    SkillDemandSchema,
    TokenResponse,
)

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


# =============================
# Auth APIs
# =============================

@auth_router.post("/signup", response_model=SignUpResponse, status_code=status.HTTP_201_CREATED)
def signup(data: SignUpRequest, db: Session = Depends(get_db)):
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
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": "user"},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "email": user.email,
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
        "role": current_user.get("role", "user"),
    }


# =============================
# Employee APIs
# =============================

@api_router.post("/employees")
def add_employee(employee: EmployeeCreate, db: Session = Depends(get_db)):

    new_emp = Employee(
        name=employee.name,
        department=employee.department,
        role=employee.role,
        year_exp=employee.year_exp,
    )

    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)

    return new_emp


@api_router.get("/employees")
def get_all_employees(db: Session = Depends(get_db)):
    return db.query(Employee).all()


# =============================
# Skill APIs
# =============================

@api_router.post("/skills")
def add_skill(skill: SkillCreate, db: Session = Depends(get_db)):

    existing = db.query(Skill).filter(Skill.skill_name == skill.skill_name).first()

    if existing:
        return {"error": "Skill already exists"}

    new_skill = Skill(
        skill_name=skill.skill_name,
        category=skill.category,
    )

    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)

    return {
        "message": "Skill added successfully",
        "data": {
            "id": new_skill.id,
            "skill_name": new_skill.skill_name,
        },
    }


@api_router.get("/skills")
def get_all_skills(db: Session = Depends(get_db)):
    return db.query(Skill).all()


# =============================
# Assign Skill
# =============================

@api_router.post("/assign-skill")
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
        proficiency_level=data.proficiency_level,
    )

    db.add(new_mapping)
    db.commit()
    db.refresh(new_mapping)

    return {"message": "Skill assigned successfully"}


# =============================
# Employee Skills
# =============================

@api_router.get("/employee-skills/{employee_id}")
def get_employee_skills(employee_id: int, db: Session = Depends(get_db)):

    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        return {"error": "Employee not found"}

    mappings = db.query(EmployeeSkill).filter(EmployeeSkill.employee_id == employee_id).all()

    skill_data = []

    for mapping in mappings:
        skill = db.query(Skill).filter(Skill.id == mapping.skill_id).first()

        skill_data.append(
            {
                "skill_name": skill.skill_name,
                "proficiency_level": mapping.proficiency_level,
            }
        )

    return {
        "employee_name": employee.name,
        "skills": skill_data,
    }


# =============================
# Skill Distribution
# =============================

@api_router.get("/skill-distribution")
def get_skill_distribution(db: Session = Depends(get_db)):
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
def calculate_skill_gap(data: SkillDemandSchema, db: Session = Depends(get_db)):
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
        "gap": gap,
    }


# =============================
# Recommendation System
# =============================

@api_router.get("/recommendation/{skill_name}")
def get_recommendation(skill_name: str, required_count: int, db: Session = Depends(get_db)):
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
        "recommendation": decision,
    }


# =============================
# Analytics APIs
# =============================

@api_router.get("/analytics/proficiency-distribution")
def get_proficiency_distribution(db: Session = Depends(get_db)):
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
        2: "Elementary",
        3: "Intermediate",
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
def get_skill_category_breakdown(db: Session = Depends(get_db)):
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
def get_experience_distribution(db: Session = Depends(get_db)):
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


router.include_router(auth_router)
router.include_router(api_router)
