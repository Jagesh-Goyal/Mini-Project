<div align="center">

# 🚀 Dakshtra

### AI-Based Workforce Planning & Skill Gap Intelligence Platform

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/CI/CD-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

**A full-stack workforce intelligence platform that combines ML forecasting, NLP resume parsing, and interactive analytics to help organizations make data-driven upskilling and hiring decisions.**

---

[Features](#-features) · [Tech Stack](#-tech-stack) · [Quick Start](#-quick-start) · [API Reference](#-api-reference) · [Testing](#-testing) · [Team](#-team)

</div>

---

## 📋 Table of Contents

- [Introduction](#-introduction)
- [Problem Statement](#-problem-statement)
- [Proposed Solution](#-proposed-solution)
- [Features](#-features)
- [Architecture & Flow](#-architecture--flow)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Authentication](#-authentication)
- [Frontend Pages](#-frontend-pages)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Real-World Example](#-real-world-example)
- [Team](#-team)

---

## 💡 Introduction

Organizations often struggle to align current workforce skills with fast-changing business needs. **Dakshtra** provides a practical platform to:

- 📊 Capture and analyze employee/skill data
- 📈 Forecast future skill demand using ML models
- 📄 Extract skills from resumes via NLP
- 🎯 Identify skill gaps and generate actionable recommendations
- ⚡ Support planning decisions with real-time analytics

---

## ❓ Problem Statement

| Challenge | Impact |
|:---|:---|
| No real-time visibility into workforce skills | Blind spots in team composition |
| Reactive hiring decisions | Delayed project delivery |
| Training not aligned with actual demand | Wasted budget on irrelevant courses |
| Weak planning accuracy for future skills | Inability to anticipate market changes |
| Manual resume screening | Slow onboarding, missed talent |

---

## 🎯 Proposed Solution

Dakshtra solves these problems with a unified platform:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DAKSHTRA PLATFORM                            │
├──────────────┬──────────────┬──────────────┬────────────────────────┤
│  🔐 Auth     │  👥 CRUD     │  🤖 ML/AI    │  📊 Analytics        │
│  JWT Login   │  Employees   │  Forecasting │  Skill Heatmap         │
│  Signup      │  Skills      │  Turnover    │  Workforce Risk        │
│  Role Guard  │  Assignments │  NLP Resume  │  Skill Graph           │
└──────────────┴──────────────┴──────────────┴────────────────────────┘
```

---

## ✨ Features

### 🔐 Authentication & Security
- User signup & login with **JWT tokens**
- Protected API routes with Bearer authentication
- Password hashing with PBKDF2 + salt
- Default admin account auto-created on startup

### 👥 Workforce Management
- Add, list, and manage **employees**
- Add, list, and manage **skills** with categories
- Assign skills to employees with **proficiency levels** (1–5)
- View per-employee skill profiles

### 📊 Analytics & Dashboards
| Feature | Endpoint | Description |
|:---|:---|:---|
| Skill Distribution | `/skill-distribution` | How skills are spread across the org |
| Proficiency Stats | `/analytics/proficiency-distribution` | Proficiency level breakdown |
| Skill Categories | `/analytics/skill-categories` | Category-wise skill count |
| Experience Stats | `/analytics/experience-distribution` | Experience level distribution |
| 🔥 Skill Heatmap | `/analytics/skill-heatmap` | Department × Skill intensity matrix |
| ⚠️ Workforce Risk | `/analytics/workforce-risk` | At-risk employees & departments |
| 🕸️ Skill Graph | `/analytics/skill-graph` | Interconnected skill relationships |

### 🤖 ML & Forecasting
| Feature | Endpoint | Description |
|:---|:---|:---|
| Train Models | `POST /ml/train` | Train demand + turnover models on live data |
| Demand Forecast | `GET /ml/forecast/{skill}` | Predict future demand (optimistic / neutral / pessimistic) |
| Turnover Risk | `GET /ml/turnover-risk/{id}` | Per-employee attrition probability |

### 📄 Resume Intelligence
| Feature | Endpoint | Description |
|:---|:---|:---|
| Upload Resume | `POST /upload-resume` | Parse PDF → extract skills via NLP |
| Auto-Create | `POST /create-employee-from-resume` | One-click employee creation from resume |

### 🎯 Gap Analysis & Recommendations
- Analyze **skill gaps** between current supply and required demand
- Auto-generate **recommendations**: upskill existing staff, hire new talent, or both

---

## 🏗️ Architecture & Flow

```
                              ┌─────────────────┐
                              │   React + Vite   │
                              │    Frontend      │
                              └────────┬────────┘
                                       │ HTTP/REST
                              ┌────────▼────────┐
                              │   FastAPI        │
                              │   Backend        │
                              └──┬────┬────┬────┘
                                 │    │    │
                    ┌────────────┘    │    └────────────┐
                    ▼                 ▼                  ▼
             ┌─────────┐     ┌──────────────┐    ┌───────────┐
             │ SQLite   │     │ scikit-learn │    │ pdfplumber│
             │ Database │     │ ML Models    │    │ NLP Parse │
             └─────────┘     └──────────────┘    └───────────┘
```

### End-to-End Data Flow

```
🔐 Auth  ──→  👥 Employee/Skill Data  ──→  📋 Skill Mapping
                        │                          │
                        ▼                          ▼
                 📊 Analytics  ◀──────────▶  🎯 Gap Analysis
                        │                          │
                        ▼                          ▼
                 🤖 ML Forecast             💡 Recommendations
                        │
                        ▼
                 ⚠️ Turnover Risk

📄 Resume Upload  ──→  🧠 NLP Extraction  ──→  👤 Auto-Create Employee
```

---

## 🛠️ Tech Stack

<table>
<tr>
<td align="center" width="33%">

### Backend
| Technology | Purpose |
|:---|:---|
| **FastAPI** | Web framework |
| **SQLAlchemy** | ORM |
| **SQLite** | Database |
| **python-jose** | JWT tokens |
| **Uvicorn** | ASGI server |
| **scikit-learn** | ML models |
| **pdfplumber** | PDF parsing |
| **python-multipart** | File uploads |

</td>
<td align="center" width="33%">

### Frontend
| Technology | Purpose |
|:---|:---|
| **React 18** | UI library |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **Zustand** | State management |
| **Recharts** | Charts & graphs |
| **Axios** | HTTP client |
| **Tailwind CSS** | Styling |
| **React Router** | Routing |

</td>
<td align="center" width="33%">

### DevOps & Testing
| Technology | Purpose |
|:---|:---|
| **GitHub Actions** | CI/CD |
| **pytest** | Backend tests |
| **vitest** | Frontend tests |
| **Vite Build** | Prod validation |

</td>
</tr>
</table>

---

## 📁 Project Structure

```
Dakshtra/
├── 📂 backend/
│   ├── app.py                  # FastAPI app bootstrap & startup
│   ├── all_api.py              # All protected API routes (20+ endpoints)
│   ├── database.py             # SQLAlchemy engine & session
│   ├── model.py                # ORM models (Employee, Skill, etc.)
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── security.py             # JWT auth & password hashing
│   ├── ml_model.py             # ML training, forecast, turnover risk
│   ├── nlp_skill_extractor.py  # NLP resume skill extraction
│   ├── seed.py                 # Base seed data
│   ├── seed_advance.py         # Advanced seed data
│   └── 📂 tests/
│       ├── conftest.py         # Test fixtures & client setup
│       └── test_api_routes.py  # Integration tests (8 test cases)
│
├── 📂 frontend/
│   ├── 📂 src/
│   │   ├── App.tsx             # Root component with routing
│   │   ├── 📂 components/      # ResumeUpload, Sidebar, ProtectedRoute
│   │   ├── 📂 pages/           # Dashboard, Employees, Skills, Heatmap,
│   │   │                       # SkillGap, Forecast, WorkforceRisk,
│   │   │                       # ResumeParser, Login, Signup
│   │   ├── 📂 store/           # Zustand auth store
│   │   ├── 📂 lib/             # API client (api.ts)
│   │   └── 📂 types/           # TypeScript interfaces
│   ├── package.json
│   ├── vite.config.ts
│   └── vitest.config.ts
│
├── 📂 .github/workflows/
│   └── ci.yml                  # CI/CD pipeline
├── requirements.txt            # Python dependencies
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites

| Requirement | Version |
|:---|:---|
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/dakshtra.git
cd dakshtra
```

### 2️⃣ Start the Backend

```powershell
# Create & activate virtual environment
python -m venv env
.\env\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run the server
.\env\Scripts\python.exe -m uvicorn backend.app:app --reload --host 127.0.0.1 --port 8000
```

> 🌐 **API**: http://127.0.0.1:8000
> 📖 **Swagger Docs**: http://127.0.0.1:8000/docs

### 3️⃣ Start the Frontend

```powershell
cd frontend
npm install
npm run dev
```

> 🖥️ **App**: http://localhost:5173

### 4️⃣ One-Click Run (Recommended for Presentation)

No need to type multiple commands every time.

1. Double-click `start.bat` from project root.
2. It auto-starts backend + frontend and opens browser/docs.
3. To stop everything, run `stop.bat`.

> If this is your first run, install dependencies once using normal setup above.

---

## 🔐 Authentication

A default admin account is **auto-created** on first startup:

| Field | Value |
|:---|:---|
| Email | `admin@dakshtra.com` |
| Password | `admin123` |

**Auth flow:**
1. Signup at `/signup` or use the default admin
2. Login at `/login` to get a JWT token
3. All business APIs require the token as `Authorization: Bearer <token>`

---

## 🖥️ Frontend Pages

| Route | Page | Description |
|:---|:---|:---|
| `/` | 📊 Dashboard | Overview with key workforce metrics |
| `/employees` | 👥 Employees | Add, view, manage employees |
| `/skills` | 🎯 Skills | Add, view, manage skills |
| `/heatmap` | 🔥 Skill Heatmap | Department × Skill intensity matrix |
| `/gap` | 📉 Skill Gap | Analyze gaps between supply & demand |
| `/forecast` | 📈 Forecast | ML-powered demand prediction with scenarios |
| `/risk` | ⚠️ Workforce Risk | At-risk employees & departments |
| `/resume-parser` | 📄 Resume Parser | Upload PDF, extract skills, create employee |

---

## 📡 API Reference

### 🔐 Authentication
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/auth/signup` | Register a new user |
| `POST` | `/auth/login` | Login and receive JWT |
| `GET` | `/auth/me` | Get current user profile |

### 👥 Workforce CRUD
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/employees` | Add a new employee |
| `GET` | `/employees` | List all employees |
| `POST` | `/skills` | Add a new skill |
| `GET` | `/skills` | List all skills |
| `POST` | `/assign-skill` | Assign skill to employee |
| `GET` | `/employee-skills/{id}` | Get employee's skill profile |

### 📊 Analytics
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/skill-distribution` | Skill distribution across org |
| `GET` | `/analytics/proficiency-distribution` | Proficiency level breakdown |
| `GET` | `/analytics/skill-categories` | Skill category stats |
| `GET` | `/analytics/experience-distribution` | Experience distribution |
| `GET` | `/analytics/skill-heatmap` | Department × Skill heatmap |
| `GET` | `/analytics/workforce-risk` | Workforce risk analysis |
| `GET` | `/analytics/skill-graph` | Skill relationship graph |

### 🎯 Gap Analysis
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/skill-gap` | Analyze skill gaps |
| `GET` | `/recommendation/{skill}` | Get upskill/hire recommendation |

### 🤖 Machine Learning
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/ml/train` | Train ML models on current data |
| `GET` | `/ml/forecast/{skill}?months_ahead=&scenario=` | Forecast skill demand |
| `GET` | `/ml/turnover-risk/{id}` | Predict employee turnover risk |

### 📄 Resume Intelligence
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/upload-resume` | Upload and parse a PDF resume |
| `POST` | `/create-employee-from-resume` | Create employee from parsed resume |

> 📖 **Full interactive docs available at** http://127.0.0.1:8000/docs **when the server is running.**

---

## 🧪 Testing

### Backend Tests
```powershell
.\env\Scripts\python.exe -m pytest backend/tests -q
```
> ✅ 8 tests covering auth, CRUD, analytics, ML, and resume workflows

### Frontend Tests
```powershell
cd frontend
npm run test
```
> ✅ 6 tests covering component rendering and API integration

### Frontend Production Build
```powershell
cd frontend
npm run build
```

---

## 🔄 CI/CD Pipeline

The project uses **GitHub Actions** for CI/CD validation and deployment gating.

**Workflow file:** `.github/workflows/ci.yml`  
**Workflow name:** `CI/CD Pipeline`

```
┌──────────────────┐    ┌──────────────────┐
│  backend-tests   │    │ frontend-checks  │
│                  │    │                  │
│  ✓ Install deps  │    │  ✓ npm ci        │
│  ✓ compileall    │    │  ✓ Run vitest    │
│  ✓ Run pytest    │    │  ✓ Vite build    │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
          ┌──────────────────┐
          │   deploy-ready   │
          │                  │
          │  ✓ All checks    │
          │    passed!       │
          └──────────────────┘
```

| Trigger | Condition |
|:---|:---|
| `push` | On `main` branch |
| `pull_request` | Targeting `main` branch |
| `workflow_dispatch` | Manual trigger |

### ✅ Job Details

| Job | What it validates |
|:---|:---|
| `backend-tests` | Python dependency install, syntax compile check on `backend/` + `ml/`, and `pytest` execution |
| `frontend-checks` | Node dependency install via `npm ci`, `vitest` run, and production build via Vite |
| `deploy-ready` | Runs only on `push` to `main` after both checks pass |

---

## 💼 Real-World Example

> **Scenario:** Your org needs 10 Python developers, but currently has only 6.

| Step | What Dakshtra Does |
|:---|:---|
| 1. Gap Detection | Calculates gap = **4 developers needed** |
| 2. Recommendation | Suggests: **upskill 2 existing + hire 2 new** |
| 3. ML Forecast | Predicts demand will grow to **14 in 6 months** (optimistic) |
| 4. Turnover Risk | Flags **2 existing Python devs** as high turnover risk |
| 5. Action Plan | Recommends starting hiring **now** to stay ahead |

---

## 👥 Team

| Name | Role |
|:---|:---|
| **Jagesh Goyal** | Backend Developer |
| **Dev** | Backend Developer |
| **Jagriti Gupta** | Frontend Developer |

---

<div align="center">

### ⭐ If you found this project useful, give it a star!

**Built with ❤️ for smarter workforce planning**

</div>
