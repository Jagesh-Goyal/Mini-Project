# AI-Based Workforce Planning & Skill Gap Intelligence Platform

Dakshtra is a full-stack project that helps teams understand current skills, identify upcoming gaps, and take better hiring or upskilling decisions.

The app is built with FastAPI (backend) and React + TypeScript (frontend), and now includes JWT-based authentication, automated tests, and CI/CD checks.

## 1. Introduction

Organizations often struggle to align workforce capability with changing business goals. Decisions become reactive because there is no single view of current skills and future demand.

This project provides an AI-supported workforce intelligence workflow where skill data is captured, analyzed, and converted into actionable recommendations.

## 2. Problem Statement

- No real-time visibility of workforce skills.
- Hiring decisions are mostly reactive.
- Training plans are generic, not data-driven.
- Workforce planning is hard to justify with evidence.

## 3. Proposed Solution

The system:
- Ingests employee and skill data.
- Builds organization-level skill visibility.
- Provides demand forecast and gap analysis endpoints.
- Recommends upskilling or hiring actions.
- Exposes this through a web dashboard.

## 4. Key Objectives

- Anticipate upcoming workforce needs.
- Reduce hiring risk.
- Optimize training investment.
- Support strategic workforce planning with data.

## 5. Key Features

- Employee and skill management.
- Skill assignment with proficiency levels.
- Skill distribution analytics.
- Proficiency, category, and experience analytics.
- Skill gap analysis and recommendation engine.
- Basic forecast endpoint for future demand.
- JWT authentication for protected business APIs.

## 6. End-to-End Flow

`Employee Data -> Skill Mapping -> Analytics -> Gap Analysis -> Recommendation -> Dashboard`

## 7. Current Implementation Scope

Implemented now:
- FastAPI + SQLAlchemy + SQLite backend.
- React + TypeScript + Zustand frontend.
- Login with JWT (`/auth/login`) and token validation (`/auth/me`).
- Protected API routes (employees, skills, analytics, gap/recommendation).
- Automated tests for backend routes and frontend store actions.

Planned/extendable:
- Advanced NLP skill extraction.
- Scenario-based forecasting.
- Personalized learning path generation.

## 8. Tech Stack

Backend:
- FastAPI
- SQLAlchemy
- SQLite
- NumPy + scikit-learn
- python-jose (JWT)
- pytest

Frontend:
- React + TypeScript
- Vite
- Zustand
- Axios
- Recharts
- Tailwind CSS
- Vitest

## 9. Project Structure

```text
Mini-Project/
|-- backend/
|   |-- app.py
|   |-- all_api.py
|   |-- database.py
|   |-- model.py
|   |-- schemas.py
|   |-- seed.py
|   `-- tests/
|       |-- conftest.py
|       `-- test_api_routes.py
|-- frontend/
|   |-- src/
|   |   `-- store/useStore.test.ts
|   |-- package.json
|   |-- vite.config.ts
|   `-- vitest.config.ts
|-- .github/workflows/ci.yml
|-- requirements.txt
`-- README.md
```

## 10. Run Locally

Prerequisites:
- Python 3.11+
- Node.js 18+

Backend setup (from project root):

```powershell
python -m venv env
.\env\Scripts\Activate.ps1
pip install -r requirements.txt
.\env\Scripts\python.exe -m uvicorn backend.app:app --reload --host 127.0.0.1 --port 8000
```

Frontend setup (new terminal):

```powershell
cd frontend
npm install
npm run dev
```

URLs:
- Backend: `http://127.0.0.1:8000/`
- API docs: `http://127.0.0.1:8000/docs`
- Frontend: `http://localhost:5173/`

## 11. Authentication

JWT auth endpoints:
- `POST /auth/login`
- `GET /auth/me`

Demo credentials:
- Email: `admin@dakshtra.com`
- Password: `admin123`

After login, frontend stores the bearer token and sends it with protected API requests.

## 12. Main API Endpoints

Protected business endpoints:
- `POST /employees`
- `GET /employees`
- `GET /employee-skills/{employee_id}`
- `POST /skills`
- `GET /skills`
- `POST /assign-skill`
- `GET /skill-distribution`
- `POST /skill-gap`
- `GET /recommendation/{skill_name}?required_count=<int>`
- `GET /analytics/proficiency-distribution`
- `GET /analytics/skill-categories`
- `GET /analytics/experience-distribution`

Forecast endpoint:
- `GET /forecast/{skill_name}`

## 13. Testing

Backend route tests:

```powershell
.\env\Scripts\python.exe -m pytest backend/tests -q
```

Frontend store tests:

```powershell
cd frontend
npm run test
```

Frontend production build check:

```powershell
cd frontend
npm run build
```

## 14. CI/CD Practices

This project follows CI/CD practices using GitHub Actions.

Workflow file:
- `.github/workflows/ci.yml`

On every push and pull request to `main`, pipeline runs:
- Backend dependency install + backend API tests (`pytest`).
- Frontend dependency install + frontend tests (`vitest`).
- Frontend production build (`npm run build`).

This helps catch regressions early and keeps `main` deploy-ready.

## 15. Team

- **Jagesh Goyal** - Backend Developer
  - Built FastAPI services and business endpoints.
  - Set up ORM models and core analytics APIs.

- **Dev** - Backend Developer
  - Implemented API route logic and skill gap flows.
  - Worked on database seeding and backend test setup.

- **Jagriti Gupta** - Frontend Developer
  - Built React pages and layout components.
  - Implemented dashboard visuals and UI interactions.

## 16. Next Improvements

- Add refresh token flow and role-based authorization.
- Add API integration tests for negative/edge cases.
- Add pagination and filtering for large employee/skill datasets.
- Add Alembic migrations for schema versioning.
