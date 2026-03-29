# Dakshtra

AI-Based Workforce Planning and Skill Gap Intelligence Platform built for college evaluation.

## Features
- Secure JWT auth in httpOnly cookies with refresh flow
- RBAC for ADMIN, HR_MANAGER, TEAM_LEAD, EMPLOYEE
- Employee management with skill assignment
- Skill matrix and heatmap APIs
- Skill gap analytics by org, team, and role
- Forecasting with scikit-learn Linear Regression
- Resume parsing from PDF via pdfplumber + spaCy
- Recommendations for hiring and upskilling
- Reporting endpoints for PDF summary and CSV forecast export
- React dashboard with charts and full page flow

## Tech Stack
- Frontend: React 18, TypeScript, TailwindCSS, React Router v6, Recharts, Axios
- Backend: FastAPI, SQLAlchemy, SQLite (PostgreSQL-ready), FastAPI-JWT-Auth, passlib bcrypt, slowapi, bleach
- ML/NLP: scikit-learn, spaCy, pdfplumber
- Testing: pytest, vitest

## Project Structure
- `backend/` layered architecture: routes -> services -> repositories
- `frontend/` modular components, pages, and API layer

## Setup
### Backend
1. Create virtual env and activate
2. Install dependencies
3. Copy `.env.example` to `.env` and fill values
4. Run:

```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
1. Open `frontend`
2. Install dependencies
3. Run:

```bash
npm run dev
```

## Run Tests
### Backend
```bash
pytest backend/tests -q
```

### Frontend
```bash
cd frontend
npm run test
```

## API Endpoint Reference
| Module | Endpoint |
|---|---|
| Auth | POST /api/auth/register |
| Auth | POST /api/auth/login |
| Auth | POST /api/auth/logout |
| Auth | POST /api/auth/refresh |
| Auth | POST /api/auth/forgot-password |
| Auth | POST /api/auth/reset-password |
| Employees | GET/POST /api/employees |
| Employees | GET/PUT/DELETE /api/employees/{id} |
| Skills | GET/POST /api/skills |
| Skills | GET /api/skills/matrix |
| Skills | GET /api/skills/heatmap |
| Gap | GET /api/gap/org |
| Gap | GET /api/gap/department/{dept} |
| Gap | GET /api/gap/team/{team_id} |
| Gap | POST /api/gap/role |
| Forecast | GET /api/forecast/skills |
| Forecast | POST /api/forecast/scenario |
| Resume | POST /api/resume/parse |
| Recommendations | GET /api/recommendations/* |
| Reports | GET /api/reports/workforce-summary |
| Reports | GET /api/reports/skill-gap |
| Reports | GET /api/reports/forecast |

## Screenshots
- Add dashboard screenshot here
- Add employees screenshot here
- Add reports screenshot here

## Team Members
- Member 1
- Member 2
- Member 3
