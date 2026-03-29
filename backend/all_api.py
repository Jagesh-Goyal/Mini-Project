import csv
import base64
import hashlib
import hmac
import json
import logging
import os
import secrets
from io import BytesIO, StringIO
from typing import Any
from datetime import datetime, timedelta, timezone

import pdfplumber
import requests
import bcrypt
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, status
from fastapi.responses import Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from ml.model import ml_models
<<<<<<< HEAD
from backend.model import (
    Employee,
    EmployeeSkill,
    JobRole,
    PredictionSnapshot,
    RecommendationLog,
    Skill,
    TrainingHistory,
    User,
)
=======
from backend.model import Employee, EmployeeSkill, Skill, TrainingHistory, User
>>>>>>> 3bcda08 (Updated backend files)
from ml.nlp_extractor import extract_skills_from_resume
from backend.security import (
    rate_limit,
    auth_limiter,
    api_limiter,
    Role,
    hash_password,
    verify_password,
    token_manager,
    get_current_user,
    get_current_admin,
    get_current_hr_or_admin,
    require_role,
    require_any_role,
)
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
<<<<<<< HEAD
    TokenRefreshRequest,
    TokenRefreshResponse,
    UserProfileResponse,
    UserUpdateRequest,
=======
>>>>>>> 3bcda08 (Updated backend files)
    TrainingHistoryCreate,
)

router = APIRouter()
auth_router = APIRouter(prefix="/auth", tags=["auth"])

# Environment variables
CSRF_HEADER_NAME = "X-CSRF-Token"
ENFORCE_CSRF = os.getenv("ENFORCE_CSRF", "true").lower() == "true"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

JOB_POSTING_API_URL = os.getenv("JOB_POSTING_API_URL")
JOB_POSTING_API_KEY = os.getenv("JOB_POSTING_API_KEY")

logger = logging.getLogger("dakshtra.api")


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
# Auth Helpers (CSRF Token Verification)
# =============================

def verify_csrf_token(
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> None:
    if not ENFORCE_CSRF:
        return

    if request.method in {"GET", "HEAD", "OPTIONS"}:
        return

    expected_token = current_user.get("csrf")
    provided_token = request.headers.get(CSRF_HEADER_NAME)

    if not expected_token or not provided_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Missing CSRF token",
        )

    if not hmac.compare_digest(str(expected_token), str(provided_token)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid CSRF token",
        )


# Protect all business APIs.
api_router = APIRouter(tags=["api"], dependencies=[Depends(get_current_user), Depends(verify_csrf_token)])

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

PROFICIENCY_LABELS = {
    1: "Beginner",
    2: "Intermediate",
    3: "Proficient",
    4: "Advanced",
    5: "Expert",
}

<<<<<<< HEAD
=======
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


>>>>>>> 3bcda08 (Updated backend files)
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


<<<<<<< HEAD
def _calculate_gap_score(skill_name: str, required_count: int, current_count: int) -> dict[str, Any]:
    gap = max(required_count - current_count, 0)
    coverage_ratio = round((current_count / required_count), 3) if required_count > 0 else 1.0
    shortage_ratio = (gap / required_count) if required_count > 0 else (1.0 if gap > 0 else 0.0)
    strategic_boost = 12 if skill_name in STRATEGIC_SKILLS else 0

    urgency_score = min(
        100,
        int(round((shortage_ratio * 65) + (gap * 6) + strategic_boost)),
    )
    priority = _risk_level_from_score(urgency_score)

    if gap <= 0:
        recommendation_hint = "No immediate action needed"
    elif gap <= 2:
        recommendation_hint = "Prefer targeted upskilling and internal movement"
    elif gap <= 5:
        recommendation_hint = "Combine hiring with upskilling for faster closure"
    else:
        recommendation_hint = "Prioritize hiring to reduce execution risk"

    return {
        "coverage_ratio": coverage_ratio,
        "shortage_ratio": round(shortage_ratio, 3),
        "urgency_score": urgency_score,
        "priority": priority,
        "recommendation_hint": recommendation_hint,
    }


def _recommendation_decision_breakdown(
    skill_name: str,
    gap: int,
    transfer_pool: int,
    upskill_pool: int,
) -> dict[str, Any]:
    if gap <= 0:
        return {
            "scores": {
                "hire_pressure": 0,
                "upskill_fit": 0,
                "transfer_readiness": 0,
            },
            "rationale": ["Current supply already meets required demand"],
        }

    strategic_boost = 15 if skill_name in STRATEGIC_SKILLS else 0
    hire_pressure = min(100, int((gap * 14) + strategic_boost))
    upskill_fit = min(100, int(round((upskill_pool / max(gap, 1)) * 75)))
    transfer_readiness = min(100, int(round((transfer_pool / max(gap, 1)) * 100)))

    rationale = []
    if hire_pressure >= 70:
        rationale.append("Demand pressure is high and requires immediate capacity expansion")
    if upskill_fit >= 60:
        rationale.append("Internal employees can close part of the gap through focused upskilling")
    if transfer_readiness >= 60:
        rationale.append("Existing high-proficiency talent can be internally redeployed")
    if not rationale:
        rationale.append("Balanced strategy is recommended due to moderate gap and limited internal coverage")

    return {
        "scores": {
            "hire_pressure": hire_pressure,
            "upskill_fit": upskill_fit,
            "transfer_readiness": transfer_readiness,
        },
        "rationale": rationale,
    }


def _build_hiring_trend_rows(employees: list[Employee], months: int = 12) -> list[dict[str, Any]]:
    now = datetime.now(timezone.utc)
    month_buckets: dict[str, int] = {}

    for offset in range(months - 1, -1, -1):
        serial_month = (now.year * 12 + now.month - 1) - offset
        year = serial_month // 12
        month = (serial_month % 12) + 1
        key = f"{year:04d}-{month:02d}"
        month_buckets[key] = 0

    for employee in employees:
        if employee.join_date is None:
            continue
        join_key = employee.join_date.strftime("%Y-%m")
        if join_key in month_buckets:
            month_buckets[join_key] += 1

    running_total = 0
    rows: list[dict[str, Any]] = []
    for month_key, hires in month_buckets.items():
        running_total += hires
        rows.append({
            "month": month_key,
            "hires": hires,
            "running_total": running_total,
        })

    return rows


def _build_workforce_snapshot(db: Session, department: str | None = None, scenario: str = "balanced") -> dict[str, Any]:
    employees_query = db.query(Employee)
    if department:
        employees_query = employees_query.filter(func.lower(Employee.department) == department.lower())

    employees = employees_query.all()
    employee_ids = [employee.id for employee in employees]

    if department:
        heatmap_rows = _build_skill_heatmap_rows(db, employee_ids)
    else:
        heatmap_rows = _build_skill_heatmap_rows(db)

    critical_gaps = [row for row in heatmap_rows if row["status"] == "RED"][:5]
    medium_gaps = [row for row in heatmap_rows if row["status"] == "YELLOW"][:5]

    role_distribution = (
        db.query(Employee.role, func.count(Employee.id).label("count"))
        .group_by(Employee.role)
        .order_by(func.count(Employee.id).desc())
        .all()
    )

    return {
        "department": department,
        "scenario": scenario,
        "employees": len(employees),
        "critical_gap_count": len([row for row in heatmap_rows if row["status"] == "RED"]),
        "medium_gap_count": len([row for row in heatmap_rows if row["status"] == "YELLOW"]),
        "top_critical_gaps": [
            {
                "skill": row["skill"],
                "gap": row["gap"],
                "required": row["required"],
                "available": row["available"],
            }
            for row in critical_gaps
        ],
        "top_medium_gaps": [
            {
                "skill": row["skill"],
                "gap": row["gap"],
                "required": row["required"],
                "available": row["available"],
            }
            for row in medium_gaps
        ],
        "top_roles": [
            {
                "role": row.role,
                "count": int(row.count),
            }
            for row in role_distribution[:5]
        ],
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def _call_openai_advisor(query: str, snapshot: dict[str, Any]) -> str | None:
    if not OPENAI_API_KEY:
        return None

    system_prompt = (
        "You are an enterprise workforce planning advisor. "
        "Answer with practical and concise HR actions using provided snapshot only."
    )
    user_prompt = (
        f"Question: {query}\n\n"
        f"Workforce Snapshot JSON:\n{json.dumps(snapshot, ensure_ascii=False)}\n\n"
        "Respond in 4-6 bullet points with clear actions, risk rationale, and measurable next steps."
    )

    try:
        response = requests.post(
            f"{OPENAI_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": OPENAI_MODEL,
                "temperature": 0.2,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            },
            timeout=12,
        )
        response.raise_for_status()
        data = response.json()
        choices = data.get("choices", [])
        if not choices:
            return None
        return choices[0].get("message", {}).get("content")
    except Exception:
        return None


def _fallback_advisor_response(query: str, snapshot: dict[str, Any]) -> dict[str, Any]:
    """
    Enhanced fallback advisor with HR-domain-specific logic.
    Provides data-driven recommendations when LLM is unavailable.
    """
    normalized_query = query.lower()
    top_gaps = snapshot.get("top_critical_gaps", [])
    top_gap_text = ", ".join(f"{item['skill']} ({item['gap']})" for item in top_gaps[:3]) or "No critical gaps"
    
    emp_count = snapshot.get("employees", 0)
    critical_gaps = snapshot.get("critical_gap_count", 0)
    medium_gaps = snapshot.get("medium_gap_count", 0)

    answer = ""
    priority = "LOW"
    recommendations = []

    # Pattern matching for various HR questions
    if any(word in normalized_query for word in ["gap", "shortage", "vacancy", "filled"]):
        answer = (
            f"Current skill gaps: {critical_gaps} critical, {medium_gaps} medium. "
            f"Top constraints: {top_gap_text}. "
            "Recommended action: Address critical gaps within 30 days using transfer + upskilling + hiring blend."
        )
        priority = "HIGH" if critical_gaps > 0 else "MEDIUM"

    elif any(word in normalized_query for word in ["hire", "hiring", "recruit", "recruitment"]):
        answer = (
            f"Hiring priority should focus on: {top_gap_text}. "
            f"Start with skills having gap ≥ 3 ({critical_gaps} roles). "
            "Timeline: 2-3 weeks recruitment + 4-week onboarding = 6-7 weeks to productivity. "
            "Pair hiring with internal transfers for faster gap closure."
        )
        priority = "HIGH" if critical_gaps > 0 else "MEDIUM"
        recommendations = ["Post jobs for critical skills immediately", "Screen internal talent for transfer"]

    elif any(word in normalized_query for word in ["upskill", "training", "learn", "development", "reskill"]):
        answer = (
            f"Upskilling targets: {top_gap_text}. "
            "Select high performers (score > 75) from related roles for 6-8 week intensive training. "
            "ROI: Most ready in 60 days vs 180+ for external hires. "
            "Pair 2-3 upskills with targeted hiring for fastest gap closure."
        )
        priority = "HIGH" if medium_gaps > 0 else "MEDIUM"
        recommendations = ["Identify high-performer candidates", "Design 6-8 week training curriculum"]

    elif any(word in normalized_query for word in ["risk", "attrition", "turnover", "dependency", "vulnerable"]):
        answer = (
            f"Risk concentration: {top_gap_text} (often single-expert-dependent). "
            f"Workforce: {emp_count} employees, {critical_gaps} critical roles with <2 qualified staff. "
            "Mitigation: Cross-train backup for each critical skill within 90 days. "
            "Monitor monthly attrition and update talent mapping quarterly."
        )
        priority = "MEDIUM"
        recommendations = ["Document critical role owners", "Start cross-training backup candidates"]

    elif any(word in normalized_query for word in ["transfer", "move", "realloc", "internal"]):
        answer = (
            f"Internal mobility opportunities: Analyze {emp_count} employees for skill transferability. "
            f"Target gaps: {top_gap_text}. "
            "Approach: Map overlapping skills, identify adjacent-role candidates, offer 2-4 week transition training. "
            "Benefit: Faster deployment (2-3 weeks) vs external hiring (6-7 weeks)."
        )
        priority = "MEDIUM"
        recommendations = ["Identify adjacent-role candidates with 60%+ skill overlap"]

    elif any(word in normalized_query for word in ["budget", "cost", "spend", "investment"]):
        answer = (
            f"Workforce investment ROI: {emp_count} employees need {critical_gaps} critical roles filled. "
            "Cost-benefit: Average hire costs $50K (salary + onboard), internal transfer $5K (training), upskill $3K. "
            "Recommended allocation: 40% hiring + 35% upskilling + 25% transfers for optimal blend."
        )
        priority = "MEDIUM"

    elif any(word in normalized_query for word in ["forecast", "predict", "planning", "pipeline"]):
        answer = (
            f"6-month workforce forecast: {emp_count} current employees, {critical_gaps} critical skills to secure. "
            f"Growth/replacement needs: Top gaps are {top_gap_text}. "
            "Plan: Hire for critical roles in months 1-2, upskill months 2-4, transfers ongoing. "
            "Monitor: Revisit forecast quarterly based on business changes."
        )
        priority = "MEDIUM"

    elif any(word in normalized_query for word in ["performance", "quality", "metric", "kpi"]):
        answer = (
            f"Workforce KPIs: {emp_count} employees, {critical_gaps} critical gaps (target: 0). "
            "Track: Gap closure rate, time-to-productivity by source (hire/upskill/transfer), attrition rate. "
            "Next review: Check progress every 30 days, align with business quarterly targets."
        )
        priority = "MEDIUM"

    elif any(word in normalized_query for word in ["department", "team", "division"]):
        dept = snapshot.get("department", "organization")
        answer = (
            f"{dept} workforce: ~{emp_count} employees with {critical_gaps} critical skill gaps. "
            f"Priority skills: {top_gap_text}. "
            "Action: Conduct department-level skill audit, identify hotspots, coordinate with other teams for transfers."
        )
        priority = "MEDIUM"

    else:
        answer = (
            f"Current state: {emp_count} employees, {critical_gaps} critical gaps, {medium_gaps} medium gaps. "
            f"Top constraints: {top_gap_text}. "
            "Recommended strategy: Use balanced 3-part approach - internal transfers (fastest), upskilling (ROI), hiring (scaling). "
            "Next steps: Prioritize skills by business impact, launch actions in parallel, track weekly progress."
        )
        priority = "MEDIUM"
        recommendations = ["Review top 3 skill gaps in detail", "Assign owners for each gap"]

    # Build action cards with structured recommendations
    action_cards = []
    for item in top_gaps[:3]:
        gap_size = item["gap"]
        if gap_size >= 3:
            action_priority = "HIGH"
            action_steps = "1. Post job globally (2-3 weeks). 2. Fast-track interviews (1 week). 3. Parallel upskilling internal candidate."
        elif gap_size >= 2:
            action_priority = "MEDIUM"
            action_steps = "1. Identify transfer candidate from adjacent skill. 2. 3-week transition training. 3. Post backup hire if transfer unavailable."
        else:
            action_priority = "LOW"
            action_steps = "1. Schedule upskilling for high performer. 2. 6-week training program. 3. Monitor capability monthly."

        action_cards.append(
            {
                "title": f"Address {item['skill']} gap ({gap_size} headcount)",
                "priority": action_priority,
                "gap": gap_size,
                "action": action_steps,
            }
        )

    if not action_cards:
        action_cards.append(
            {
                "title": "Maintain readiness",
                "priority": "LOW",
                "action": "No critical gaps. Continue monthly monitoring, quarterly role calibration, annual strategic reviews.",
            }
        )

    # Context-aware follow-up questions
    follow_ups = []
    if critical_gaps > 0:
        follow_ups.append("Which skill should we prioritize first for hiring/upskilling?")
    if medium_gaps > 0:
        follow_ups.append("Can we move internal talent to cover medium-gap roles?")
    follow_ups.append("What's the business timeline for closing these gaps?")
    if emp_count < 20:
        follow_ups.append("Should we consider contractor/freelance support for short-term gaps?")

    follow_up_questions = follow_ups[:4] if follow_ups else [
        "What's the priority: speed vs cost-efficiency?",
        "Are there seasonal workforce needs we should plan for?",
    ]

    return {
        "answer": answer,
        "action_cards": action_cards,
        "follow_up_questions": follow_up_questions,
        "recommendations": recommendations,
    }


def _publish_job_posting_signal(
    *,
    skill_name: str,
    required_count: int,
    current_count: int,
    gap: int,
    department: str | None = None,
    source: str = "recommendation_engine",
) -> dict[str, Any]:
    """
    Publish job posting signal to external job-posting service with retry logic.
    
    Args:
        skill_name: Technical skill required
        required_count: Number of positions needed
        current_count: Current workforce capacity
        gap: Gap to fill (required - current)
        department: Department context
        source: Signal source (recommendation_engine or manual_trigger)
    
    Returns:
        Integration result with status and metadata
    """
    if gap <= 0:
        return {"status": "skipped", "reason": "no_gap", "message": "No gap identified"}

    if not JOB_POSTING_API_URL:
        return {
            "status": "disabled",
            "reason": "JOB_POSTING_API_URL not configured",
            "message": "Job posting integration not configured. Set JOB_POSTING_API_URL in environment.",
        }

    payload = {
        "source": source,
        "skill_name": skill_name,
        "department": department,
        "required_count": required_count,
        "current_count": current_count,
        "gap": gap,
        "priority": "HIGH" if gap >= 3 else "MEDIUM",
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Dakshtra/1.0",
    }
    if JOB_POSTING_API_KEY:
        headers["Authorization"] = f"Bearer {JOB_POSTING_API_KEY}"

    # Retry logic: exponential backoff
    max_retries = 3
    retry_delay = 1  # seconds
    last_error = None

    for attempt in range(max_retries):
        try:
            logger.info(
                f"Publishing job posting signal (attempt {attempt + 1}/{max_retries}): "
                f"skill={skill_name}, gap={gap}, department={department}"
            )
            
            response = requests.post(
                JOB_POSTING_API_URL,
                json=payload,
                headers=headers,
                timeout=10,
            )
            
            if response.ok:
                logger.info(
                    f"Job posting signal published successfully: "
                    f"skill={skill_name}, status_code={response.status_code}"
                )
                return {
                    "status": "published",
                    "http_status": response.status_code,
                    "message": "Job posting signal sent successfully",
                    "attempt": attempt + 1,
                }
            elif response.status_code >= 500:
                # Server error - retry
                last_error = f"Server error {response.status_code}: {response.text[:200]}"
                logger.warning(f"Server error, will retry: {last_error}")
                if attempt < max_retries - 1:
                    import time
                    time.sleep(retry_delay * (2 ** attempt))  # Exponential backoff
                    continue
            else:
                # Client error - don't retry
                logger.error(
                    f"Client error {response.status_code}: {response.text[:200]}"
                )
                return {
                    "status": "failed",
                    "http_status": response.status_code,
                    "message": f"HTTP {response.status_code}: {response.text[:200]}",
                    "attempt": attempt + 1,
                }
                
        except requests.Timeout:
            last_error = "Request timeout"
            logger.warning(f"Request timeout (attempt {attempt + 1}/{max_retries})")
            if attempt < max_retries - 1:
                import time
                time.sleep(retry_delay * (2 ** attempt))
                continue
                
        except requests.ConnectionError as e:
            last_error = f"Connection error: {str(e)[:100]}"
            logger.warning(f"Connection error (attempt {attempt + 1}/{max_retries}): {last_error}")
            if attempt < max_retries - 1:
                import time
                time.sleep(retry_delay * (2 ** attempt))
                continue
                
        except Exception as exc:
            last_error = str(exc)[:100]
            logger.error(f"Unexpected error publishing job posting signal: {last_error}")
            return {
                "status": "failed",
                "error": last_error,
                "message": f"Unexpected error: {last_error}",
                "attempt": attempt + 1,
            }

    # All retries exhausted
    logger.error(
        f"Job posting signal failed after {max_retries} attempts: {last_error}"
    )
    return {
        "status": "failed",
        "error": last_error,
        "message": f"Failed after {max_retries} retries: {last_error}",
        "retries_exhausted": True,
    }


=======
>>>>>>> 3bcda08 (Updated backend files)
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
    """
    Register a new user account.
    Rate limited to 10 requests per minute.
    
    Security:
    - Password: bcrypt hashed with 12 rounds
    - Default role: employee
    - Account activation required before login (future)
    """
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        if not existing_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This account has been deactivated. Contact admin.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    new_user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=Role.EMPLOYEE,
<<<<<<< HEAD
        is_active=True,
=======
>>>>>>> 3bcda08 (Updated backend files)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info(f"New user registered: {new_user.email} ({new_user.role})")

    return {
        "message": "Account created successfully. Please login with your credentials.",
        "email": new_user.email,
        "name": new_user.name,
    }


@auth_router.post("/login", response_model=TokenResponse)
@rate_limit(auth_limiter)
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    """
    Login user and return JWT tokens.
    Rate limited to 10 requests per minute.
    
    Returns:
    - access_token: Short-lived token for API requests (60 min default)
    - refresh_token: Long-lived token to obtain new access tokens (7 days default)
    - csrf_token: CSRF protection token for state-changing requests
    """
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password_hash):
        logger.warning(f"Failed login attempt for email: {data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        logger.warning(f"Login attempt for deactivated account: {data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account has been deactivated",
        )

    # Update last login timestamp
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    csrf_token = secrets.token_urlsafe(24)

    # Create access token (short-lived)
    access_token = token_manager.create_access_token(
        data={"sub": user.email, "role": user.role, "csrf": csrf_token}
    )

    # Create refresh token (long-lived)
    refresh_token = token_manager.create_refresh_token(
        data={"sub": user.email, "role": user.role}
    )

    logger.info(f"User logged in: {user.email} ({user.role})")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": token_manager.access_token_expire_minutes * 60,
        "email": user.email,
        "name": user.name,
        "role": Role.normalize(user.role),
        "csrf_token": csrf_token,
    }


@auth_router.post("/refresh", response_model=TokenRefreshResponse)
@rate_limit(auth_limiter)
def refresh_access_token(data: TokenRefreshRequest):
    """
    Exchange a refresh token for a new access token.
    Rate limited to 10 requests per minute.
    
    Args:
        refresh_token: Valid refresh token from login
        
    Returns:
        New access_token with updated expiration
    """
    payload = token_manager.verify_token(data.refresh_token, token_type="refresh")
    
    # Create new access token
    access_token = token_manager.create_access_token(
        data={
            "sub": payload.get("sub"),
            "role": payload.get("role"),
        }
    )

    logger.info(f"Token refreshed for user: {payload.get('sub')}")

    return {
        "access_token": access_token,
        "token_type": "bearer",
<<<<<<< HEAD
        "expires_in": token_manager.access_token_expire_minutes * 60,
=======
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "email": user.email,
        "name": user.name,
        "role": Role.normalize(user.role),
>>>>>>> 3bcda08 (Updated backend files)
    }


@auth_router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get current authenticated user's profile.
    Requires: Valid JWT access token in Authorization header
    """
    user = db.query(User).filter(User.email == current_user.get("sub")).first()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or inactive",
        )

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": Role.normalize(user.role),
        "is_active": user.is_active,
        "last_login": user.last_login,
        "created_at": user.created_at,
    }


@auth_router.post("/verify-token", status_code=status.HTTP_204_NO_CONTENT)
def verify_token(current_user: dict = Depends(get_current_user)):
    """
    Verify that the provided access token is valid.
    Returns 204 No Content if valid, 401 if invalid.
    """
    return None


# =============================
# Admin User Management (Optional - requires admin)
# =============================

@auth_router.post("/admin/create-user", status_code=status.HTTP_201_CREATED)
def create_user_as_admin(
    data: SignUpRequest,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Admin endpoint: Create a new user with specified role.
    Requires: Admin role
    
    Admin can create users with any role (admin, hr_manager, employee).
    """
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    # Parse role from email pattern or use default
    email_parts = data.email.split("@")[0].lower()
    if "admin" in email_parts:
        assigned_role = Role.ADMIN
    elif "hr" in email_parts or "manager" in email_parts:
        assigned_role = Role.HR_MANAGER
    else:
        assigned_role = Role.EMPLOYEE

    new_user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=assigned_role,
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info(f"Admin {admin['sub']} created user: {new_user.email} ({assigned_role})")

    return {
        "message": f"User created successfully with role: {Role.label(assigned_role)}",
        "email": new_user.email,
        "name": new_user.name,
        "role": Role.normalize(assigned_role),
    }


@auth_router.patch("/profile", response_model=UserProfileResponse)
def update_profile(
    data: UserUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update current user's profile (name and/or password).
    Requires: Valid JWT access token
    """
    user = db.query(User).filter(User.email == current_user.get("sub")).first()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if data.name:
        user.name = data.name

    if data.password:
        user.password_hash = hash_password(data.password)
        logger.info(f"User {user.email} updated their password")

    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    logger.info(f"User profile updated: {user.email}")

    return {
        "id": user.id,
        "name": user.name,
<<<<<<< HEAD
        "email": user.email,
        "role": Role.normalize(user.role),
        "is_active": user.is_active,
        "last_login": user.last_login,
        "created_at": user.created_at,
=======
        "role": Role.normalize(current_user.get("role", Role.EMPLOYEE)),
        "role_label": Role.label(current_user.get("role", Role.EMPLOYEE)),
>>>>>>> 3bcda08 (Updated backend files)
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
<<<<<<< HEAD
def get_all_employees(
    request: Request,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=500, description="Maximum number of records to return"),
):
    total_count = db.query(Employee).count()
    employees = (
        db.query(Employee)
        .order_by(Employee.name.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {
        "data": [_serialize_employee(employee) for employee in employees],
        "total": total_count,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total_count,
    }
=======
def get_all_employees(request: Request, db: Session = Depends(get_db)):
    employees = db.query(Employee).order_by(Employee.name.asc()).all()
    return [_serialize_employee(employee) for employee in employees]
>>>>>>> 3bcda08 (Updated backend files)


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
<<<<<<< HEAD
def get_all_skills(
    request: Request,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=500, description="Maximum number of records to return"),
):
    total_count = db.query(Skill).count()
    skills = (
        db.query(Skill)
        .order_by(Skill.category.asc(), Skill.skill_name.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {
        "data": [_serialize_skill(skill) for skill in skills],
        "total": total_count,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total_count,
    }
=======
def get_all_skills(request: Request, db: Session = Depends(get_db)):
    skills = db.query(Skill).order_by(Skill.category.asc(), Skill.skill_name.asc()).all()
    return [_serialize_skill(skill) for skill in skills]
>>>>>>> 3bcda08 (Updated backend files)


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
<<<<<<< HEAD


class JobRolePayload(BaseModel):
    role_name: str = Field(min_length=2, max_length=120)
    department: str = Field(min_length=2, max_length=100)
    required_skills: list[str] = Field(default_factory=list)
    target_headcount: int = Field(default=0, ge=0, le=100000)
    planning_horizon_months: int = Field(default=6, ge=1, le=36)
    is_active: bool = True


@api_router.get("/job-roles")
def get_job_roles(request: Request, db: Session = Depends(get_db)):
    roles = db.query(JobRole).order_by(JobRole.department.asc(), JobRole.role_name.asc()).all()
    return [
        {
            "id": role.id,
            "role_name": role.role_name,
            "department": role.department,
            "required_skills": json.loads(role.required_skills_json or "[]"),
            "target_headcount": role.target_headcount,
            "planning_horizon_months": role.planning_horizon_months,
            "is_active": role.is_active,
            "updated_at": role.updated_at.isoformat() if role.updated_at else None,
        }
        for role in roles
    ]


@api_router.post("/job-roles")
@rate_limit(api_limiter)
def create_job_role(
    request: Request,
    payload: JobRolePayload,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.HR_MANAGER)),
):
    existing = db.query(JobRole).filter(func.lower(JobRole.role_name) == payload.role_name.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Job role already exists")

    role = JobRole(
        role_name=payload.role_name,
        department=payload.department,
        required_skills_json=json.dumps(sorted(set(payload.required_skills))),
        target_headcount=payload.target_headcount,
        planning_horizon_months=payload.planning_horizon_months,
        is_active=payload.is_active,
    )
    db.add(role)
    db.commit()
    db.refresh(role)

    return {
        "id": role.id,
        "role_name": role.role_name,
        "department": role.department,
        "required_skills": json.loads(role.required_skills_json or "[]"),
        "target_headcount": role.target_headcount,
        "planning_horizon_months": role.planning_horizon_months,
        "is_active": role.is_active,
    }


@api_router.put("/job-roles/{role_id}")
@rate_limit(api_limiter)
def update_job_role(
    request: Request,
    role_id: int,
    payload: JobRolePayload,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.HR_MANAGER)),
):
    role = db.query(JobRole).filter(JobRole.id == role_id).first()
    if role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job role not found")

    duplicate = (
        db.query(JobRole)
        .filter(func.lower(JobRole.role_name) == payload.role_name.lower(), JobRole.id != role_id)
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Job role already exists")

    role.role_name = payload.role_name
    role.department = payload.department
    role.required_skills_json = json.dumps(sorted(set(payload.required_skills)))
    role.target_headcount = payload.target_headcount
    role.planning_horizon_months = payload.planning_horizon_months
    role.is_active = payload.is_active
    db.commit()
    db.refresh(role)

    return {
        "id": role.id,
        "role_name": role.role_name,
        "department": role.department,
        "required_skills": json.loads(role.required_skills_json or "[]"),
        "target_headcount": role.target_headcount,
        "planning_horizon_months": role.planning_horizon_months,
        "is_active": role.is_active,
    }
=======
>>>>>>> 3bcda08 (Updated backend files)


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
    scoring = _calculate_gap_score(data.skill_name, data.required_count, current_count)

    return {
        "skill_name": data.skill_name,
        "required": data.required_count,
        "current": current_count,
        "gap": gap,
        "department": data.department,
        "team_name": data.team_name,
        "scope": data.team_name or data.department or "Organization",
<<<<<<< HEAD
        "coverage_ratio": scoring["coverage_ratio"],
        "shortage_ratio": scoring["shortage_ratio"],
        "urgency_score": scoring["urgency_score"],
        "priority": scoring["priority"],
        "recommendation_hint": scoring["recommendation_hint"],
=======
>>>>>>> 3bcda08 (Updated backend files)
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
<<<<<<< HEAD
    decision_breakdown = _recommendation_decision_breakdown(
        skill_name=skill_name,
        gap=max(gap, 0),
        transfer_pool=len(internal_transfer_candidates),
        upskill_pool=len(upskill_candidates),
    )
=======
>>>>>>> 3bcda08 (Updated backend files)

    if gap <= 0:
        decision = "No action required"
    elif gap <= 2:
        decision = "Upskill existing employees"
    elif gap <= 5:
        decision = "Hire + Upskill recommended"
    else:
        decision = "Immediate hiring required"

    recommended_actions = [
        f"Hire {hire_count} employees" if hire_count else None,
        f"Upskill {upskill_count} current employees" if upskill_count else None,
        f"Move {transfer_count} internal experts" if transfer_count else None,
    ]
    recommended_actions = [action for action in recommended_actions if action is not None]
    external_job_posting = _publish_job_posting_signal(
        skill_name=skill_name,
        required_count=required_count,
        current_count=current_count,
        gap=max(gap, 0),
        source="recommendation_engine",
    )

    db.add(
        RecommendationLog(
            skill_id=skill.id,
            department=None,
            team_name=None,
            required_count=required_count,
            current_count=current_count,
            gap=max(gap, 0),
            hire_count=hire_count,
            upskill_count=upskill_count,
            transfer_count=transfer_count,
            decision=decision,
            rationale_json=json.dumps(decision_breakdown["rationale"]),
        )
    )
    db.commit()

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
<<<<<<< HEAD
        "recommended_actions": recommended_actions,
        "decision_scores": decision_breakdown["scores"],
        "decision_rationale": decision_breakdown["rationale"],
        "external_job_posting": external_job_posting,
=======
        "recommended_actions": [
            f"Hire {hire_count} employees" if hire_count else None,
            f"Upskill {upskill_count} current employees" if upskill_count else None,
            f"Move {transfer_count} internal experts" if transfer_count else None,
        ],
>>>>>>> 3bcda08 (Updated backend files)
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
        "skill_intelligence": parsed.get("skill_intelligence", []),
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


class WorkforceAdvisorRequest(BaseModel):
    query: str = Field(min_length=4, max_length=2000)
    department: str | None = Field(default=None, max_length=100)
    scenario: str = Field(default="balanced", pattern="^(conservative|balanced|aggressive)$")
    use_llm: bool = True


class JobPostingSignalRequest(BaseModel):
    skill_name: str = Field(min_length=2, max_length=120)
    required_count: int = Field(ge=0, le=100000)
    current_count: int = Field(ge=0, le=100000)
    department: str | None = Field(default=None, max_length=100)


@api_router.post("/parse-jd")
@rate_limit(api_limiter)
def parse_job_description(request: Request, data: JDParseRequest, db: Session = Depends(get_db)):
    """
    Extract required skills from a job description text and return
    the skills found, how many employees currently hold them, and the gap.
    """
    from ml.nlp_extractor import NLPSkillExtractor

    extractor = NLPSkillExtractor(db)
    skill_signals = extractor.extract_skill_signals(data.jd_text)
    extracted_skills = sorted(skill_signals.keys())
    matched_skills   = extractor.match_skills_to_database(extracted_skills, db)

    # Build gap analysis per matched skill
    skill_analysis = []
    for skill_name, skill_id in matched_skills:
        signal = skill_signals.get(skill_name, {})
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
            "confidence_score": signal.get("confidence_score", 0.5),
            "evidence": signal.get("evidence", [])[:2],
        })

    # Skills extracted but not in DB yet
    matched_names = {matched_skill_name for matched_skill_name, _ in matched_skills}
    for skill_name in extracted_skills:
        if skill_name not in matched_names:
            signal = skill_signals.get(skill_name, {})
            skill_analysis.append({
                "skill_name":    skill_name,
                "skill_id":      None,
                "current_count": 0,
                "in_database":   False,
                "confidence_score": signal.get("confidence_score", 0.5),
                "evidence": signal.get("evidence", [])[:2],
            })

    return {
        "status":              "success",
        "total_skills_found":  len(extracted_skills),
        "total_matched_in_db": len(matched_skills),
        "skill_analysis":      skill_analysis,
        "skill_intelligence": [
            {
                "skill_name": skill_name,
                "confidence_score": payload.get("confidence_score", 0.5),
                "mentions": payload.get("mentions", 1),
                "aliases_detected": payload.get("aliases_detected", []),
            }
            for skill_name, payload in sorted(
                skill_signals.items(),
                key=lambda item: item[1].get("confidence_score", 0),
                reverse=True,
            )
        ],
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


@api_router.get("/ml/evaluate")
@rate_limit(api_limiter)
def evaluate_ml_models(request: Request, db: Session = Depends(get_db)):
    report = ml_models.get_latest_training_report()

    if report is None:
        train_result = ml_models.train_models(db)
        if "error" in train_result:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=train_result["error"])
        report = ml_models.get_latest_training_report() or train_result

    return {
        "status": "success",
        "model_ready": ml_models.demand_model is not None and ml_models.turnover_model is not None,
        "report": report,
    }


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
    created_snapshots = 0
    training_report = ml_models.get_latest_training_report() or {}
    model_version = training_report.get("trained_at")

    for dept, predictions in forecast_result.get("forecasts", {}).items():
        adjusted_predictions: list[dict[str, Any]] = []

        for row in predictions:
            adjusted_demand = max(0, int(round(row["demand"] * multiplier)))
            adjusted_gap = max(0, adjusted_demand - row["supply"])
            confidence = max(0.4, min(0.95, 1 - ((adjusted_gap / max(adjusted_demand, 1)) * 0.6)))

            db.add(
                PredictionSnapshot(
                    skill_id=skill_obj.id,
                    department=dept,
                    scenario=scenario_key,
                    horizon_month=row["month"],
                    forecast_date=datetime.strptime(row["date"], "%Y-%m-%d").replace(tzinfo=timezone.utc),
                    predicted_demand=adjusted_demand,
                    predicted_supply=row["supply"],
                    predicted_gap=adjusted_gap,
                    model_version=model_version,
                    confidence=round(confidence, 2),
                )
            )
            created_snapshots += 1

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

    if created_snapshots:
        db.commit()

    return {
        "skill": forecast_result.get("skill", skill_obj.skill_name),
        "months_ahead": forecast_result.get("months_ahead", months_ahead),
        "scenario": scenario_key,
        "forecasts": adjusted_forecasts,
        "snapshot_count": created_snapshots,
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


@api_router.get("/analytics/hiring-trends")
@rate_limit(api_limiter)
def get_hiring_trends(
    request: Request,
    months: int = Query(12, ge=3, le=24),
    db: Session = Depends(get_db),
):
    employees = db.query(Employee).all()
    trends = _build_hiring_trend_rows(employees, months=months)

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "months": months,
        "total_hires": sum(row["hires"] for row in trends),
        "trends": trends,
    }


@api_router.post("/advisor/query")
@rate_limit(api_limiter)
def query_workforce_advisor(
    request: Request,
    payload: WorkforceAdvisorRequest,
    db: Session = Depends(get_db),
):
    snapshot = _build_workforce_snapshot(
        db,
        department=payload.department,
        scenario=payload.scenario,
    )

    fallback = _fallback_advisor_response(payload.query, snapshot)
    llm_answer = _call_openai_advisor(payload.query, snapshot) if payload.use_llm else None
    mode = "llm" if llm_answer else "fallback"

    return {
        "mode": mode,
        "query": payload.query,
        "department": payload.department,
        "scenario": payload.scenario,
        "answer": llm_answer or fallback["answer"],
        "action_cards": fallback["action_cards"],
        "follow_up_questions": fallback["follow_up_questions"],
        "kpis": {
            "employees": snapshot["employees"],
            "critical_gap_count": snapshot["critical_gap_count"],
            "medium_gap_count": snapshot["medium_gap_count"],
        },
        "snapshot_generated_at": snapshot["generated_at"],
    }


@api_router.post("/integrations/job-posting/trigger")
@rate_limit(api_limiter)
def trigger_job_posting_signal(
    request: Request,
    payload: JobPostingSignalRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.HR_MANAGER)),
):
    gap = max(payload.required_count - payload.current_count, 0)
    result = _publish_job_posting_signal(
        skill_name=payload.skill_name,
        required_count=payload.required_count,
        current_count=payload.current_count,
        gap=gap,
        department=payload.department,
        source="manual_trigger",
    )

    return {
        "status": "success",
        "gap": gap,
        "integration_result": result,
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
