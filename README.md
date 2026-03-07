# Dakshtra Mini Project

This is a full-stack skill management app built with FastAPI + React.
It lets you track employees, assign skills, see basic analytics, and check skill gaps.

The project is intentionally simple and practical. No auth backend yet, no microservices, no extra deployment layer.

## What It Does

- Add employees with department, role, and years of experience.
- Add skills by category.
- Assign skills to employees with a proficiency level.
- View analytics charts in the dashboard.
- Run skill gap checks and recommendations.
- Get a basic forecast from a demo linear regression endpoint.

## Tech Stack

Backend:
- FastAPI
- SQLAlchemy
- SQLite
- Uvicorn
- NumPy + scikit-learn (simple forecast endpoint)

Frontend:
- React + TypeScript
- Vite
- Tailwind CSS
- Recharts
- Zustand
- Axios

## Project Structure

```text
Mini-Project/
|-- backend/
|   |-- app.py
|   |-- all_api.py
|   |-- database.py
|   |-- model.py
|   |-- schemas.py
|   `-- seed.py
|-- frontend/
|   |-- src/
|   |-- package.json
|   |-- index.html
|   |-- tsconfig.json
|   `-- vite.config.ts
|-- requirements.txt
`-- README.md
```

## Run Locally

Prerequisites:
- Python 3.11+
- Node.js 18+

### 1) Backend setup

From project root:

```powershell
python -m venv env
.\env\Scripts\Activate.ps1
pip install -r requirements.txt
```

Start API server:

```powershell
.\env\Scripts\python.exe -m uvicorn backend.app:app --reload --host 127.0.0.1 --port 8000
```

Backend URLs:
- API root: `http://127.0.0.1:8000/`
- Swagger docs: `http://127.0.0.1:8000/docs`

### 2) Frontend setup

In a new terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL:
- `http://localhost:5173/`

## Demo Login

The login page uses localStorage (mock auth) for now.

- Email: `admin@dakshtra.com`
- Password: `admin123`

## API Endpoints (Current)

Employee:
- `POST /employees`
- `GET /employees`
- `GET /employee-skills/{employee_id}`

Skill:
- `POST /skills`
- `GET /skills`
- `POST /assign-skill`

Analysis:
- `GET /skill-distribution`
- `POST /skill-gap`
- `GET /recommendation/{skill_name}?required_count=<int>`
- `GET /analytics/proficiency-distribution`
- `GET /analytics/skill-categories`
- `GET /analytics/experience-distribution`

Forecast:
- `GET /forecast/{skill_name}`

## Useful Commands

Frontend build check:

```powershell
cd frontend
npm run build
```

## Notes

- Seed data is auto-loaded in `backend/app.py` when the app starts.
- Seed runs once and skips if employees already exist.
- SQLite path is relative to the working directory (`sqlite:///./dakshtra.db`).
  If you run the backend from different folders, you may create different DB files.
- If you get `localhost` 404 on frontend, make sure dev server is started inside `frontend/` with plain `npm run dev`.

## Team

- **Jagesh Goyal** - Backend Developer
  - Built the FastAPI server and REST API endpoints
  - Set up database models and SQLAlchemy ORM
  - Created analytics and recommendation logic
  
- **Dev** - Backend Developer
  - Developed core API routes for employees and skills
  - Implemented skill gap analysis algorithms
  - Set up database seeding and testing scripts

- **Jagriti Gupta** - Frontend Developer
  - Built React components and page layouts
  - Designed UI/UX
  - Created dashboard charts and data visualization

## Next Improvements

- Replace mock login with backend auth (JWT).
- Add tests for API routes and store actions.
- Add pagination and search on employees/skills tables.
- Add proper migration tooling (Alembic).