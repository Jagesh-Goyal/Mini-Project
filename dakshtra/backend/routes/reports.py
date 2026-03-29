import io

import pandas as pd
from fastapi import APIRouter, Depends
from fastapi.responses import Response, StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.employee import Employee
from backend.models.role import RoleEnum
from backend.security.rbac import require_roles
from backend.services.forecast_service import forecast_next_6_months
from backend.services.gap_service import calculate_org_gap

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/workforce-summary", dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER))])
def workforce_summary(db: Session = Depends(get_db)):
    employees = db.query(Employee).filter(Employee.is_active.is_(True)).count()
    gaps = calculate_org_gap(db)
    payload = {"total_employees": employees, "avg_gap_percent": round(sum(x["gap_percent"] for x in gaps) / max(len(gaps), 1), 2)}

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    pdf.drawString(72, 780, "Dakshtra Workforce Summary")
    pdf.drawString(72, 760, f"Total Employees: {payload['total_employees']}")
    pdf.drawString(72, 740, f"Avg Gap %: {payload['avg_gap_percent']}")
    pdf.save()
    buffer.seek(0)

    return StreamingResponse(buffer, media_type="application/pdf", headers={"X-Report-Json": str(payload)})


@router.get("/skill-gap", dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER, RoleEnum.TEAM_LEAD))])
def skill_gap_report(db: Session = Depends(get_db)):
    return calculate_org_gap(db)


@router.get("/forecast", dependencies=[Depends(require_roles(RoleEnum.ADMIN, RoleEnum.HR_MANAGER, RoleEnum.TEAM_LEAD))])
def forecast_report(skill: str = "Cloud"):
    rows = forecast_next_6_months(skill)
    csv_text = pd.DataFrame(rows).to_csv(index=False)
    return Response(content=csv_text, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=forecast.csv"})
