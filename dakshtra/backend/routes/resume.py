from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.middleware.rate_limit import limiter
from backend.models.employee import EmployeeSkill
from backend.models.role import RoleEnum
from backend.models.skill import Skill
from backend.security.csrf import validate_csrf_token
from backend.security.rbac import require_roles
from backend.services.nlp_service import extract_skills, extract_text_from_pdf

router = APIRouter(prefix="/api/resume", tags=["resume"])


@router.post("/parse", dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER)), Depends(validate_csrf_token)])
@limiter.limit("10/minute")
async def parse_resume(request: Request, file: UploadFile = File(...), employee_id: int | None = None, db: Session = Depends(get_db)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    text = extract_text_from_pdf(await file.read())
    detected = extract_skills(text)

    if employee_id and detected:
        for item in detected:
            skill = db.query(Skill).filter(Skill.name.ilike(item["skill"])).first()
            if skill:
                db.add(EmployeeSkill(employee_id=employee_id, skill_id=skill.id, proficiency_level=3))
        db.commit()

    return {"skills": detected}
