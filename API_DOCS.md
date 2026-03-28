# Dakshtra API Documentation

## Overview

**Base URL**: `http://localhost:8000` (local development)  
**Authentication**: JWT Bearer token + CSRF token protection (for state-modifying requests)  
**Response Format**: JSON

## Quick Start

### 1. Get Interactive API Docs

FastAPI automatically generates interactive documentation:

- **Swagger UI** (recommended): http://localhost:8000/docs
- **ReDoc** (alternative): http://localhost:8000/redoc

### 2. Authentication Flow

```bash
# 1. Signup
curl -X POST "http://localhost:8000/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'

# 2. Login (returns JWT + CSRF token)
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'

# Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "csrf_token": "abc123def456..."
}

# 3. Use token for subsequent requests
curl -X GET "http://localhost:8000/employees" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." \
  -H "X-CSRF-Token: abc123def456..."
```

---

## Core API Endpoints

### Authentication

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/login` | Authenticate and get JWT + CSRF token |
| GET | `/auth/me` | Get current user profile |

### Employee Management

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/employees` | Create new employee |
| GET | `/employees` | List all employees (paginated) |
| GET | `/employees/{id}/profile` | Get employee details with skills |
| GET | `/employees/{id}/training-history` | Get employee training records |
| POST | `/employees/{id}/training-history` | Add training record |
| PUT | `/employees/{id}` | Update employee info |
| DELETE | `/employees/{id}` | Delete employee |

**Pagination Parameters**:
- `skip`: Number of records to skip (default: 0)
- `limit`: Max records to return (default: 50, max: 500)

Example:
```bash
GET /employees?skip=0&limit=25
```

### Skill Management

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/skills` | Create new skill |
| GET | `/skills` | List all skills (paginated) |
| PUT | `/skills/{id}` | Update skill |
| DELETE | `/skills/{id}` | Delete skill |
| POST | `/assign-skill` | Assign skill to employee |
| GET | `/employee-skills/{id}` | Get employee's skills |

### Skill Planning & Gaps

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/skill-gap` | Analyze skill gaps |
| GET | `/recommendation/{skill_name}` | Get hiring/upskilling recommendations |

Example - Skill Gap Analysis:
```json
POST /skill-gap
{
  "skill_name": "Kubernetes",
  "required_count": 5,
  "current_count": 2,
  "department": "DevOps"
}
```

### ML & Forecasting

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/ml/train` | Train/retrain ML models |
| GET | `/ml/evaluate` | Get model performance metrics |
| GET | `/ml/forecast/{skill_name}` | Forecast demand for skill |
| GET | `/ml/turnover-risk/{employee_id}` | Predict turnover risk |

Example - Forecast with Scenarios:
```bash
GET /ml/forecast/Kubernetes?months_ahead=6&scenario=aggressive
```

Available scenarios: `conservative`, `balanced`, `aggressive`

### Analytics

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/analytics/skill-heatmap` | Skill distribution across workforce |
| GET | `/analytics/workforce-risk` | Risk assessment by department |
| GET | `/analytics/hiring-trends` | Historical hiring trends (12 months) |
| GET | `/analytics/skill-graph` | Network graph of employee-skill relationships |
| GET | `/analytics/proficiency-distribution` | Distribution of skill levels |

### NLP & Parsing

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/upload-resume` | Parse resume and extract skills |
| POST | `/parse-jd` | Parse job description and extract required skills |
| POST | `/create-employee-from-resume` | Create employee and assign skills from resume |

Example - Resume Parsing:
```bash
curl -X POST "http://localhost:8000/upload-resume" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -F "file=@resume.pdf"
```

### AI Advisor

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/advisor/query` | Ask workforce planning questions |

Example - Advisor Query:
```json
POST /advisor/query
{
  "query": "What should we prioritize for hiring this quarter?",
  "scenario": "balanced",
  "department": null,
  "use_llm": false
}
```

**Response includes**:
- `mode`: "llm" or "fallback" (depending on LLM availability)
- `answer`: Natural language response
- `action_cards`: Structured recommendations
- `kpi_snapshot`: Current org metrics

### Reports & Export

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/reports/skill-gap` | Export skill gap analysis (CSV/XLSX/PDF) |
| GET | `/reports/employee-skills` | Export employee skill matrix |
| GET | `/reports/forecast` | Export forecast predictions |

Example - Export Reports:
```bash
GET /reports/skill-gap?format=csv&department=Engineering
GET /reports/forecast?format=xlsx&scenario=balanced&months_ahead=6
```

---

## Common Workflows

### Workflow 1: Identify Skills Gaps

```
1. Upload or parse job description:
   POST /parse-jd → {skill_requirements}

2. Get current workforce skills:
   GET /analytics/skill-heatmap

3. Analyze gap:
   POST /skill-gap → {gap, urgency_score, priority_level}

4. Get recommendations:
   GET /recommendation/{skill} → {hire_count, upskill_count, transfer_count, rationale}

5. Ask advisor for strategy:
   POST /advisor/query ("Should we hire or upskill for X?") → {answer, action_cards}
```

### Workflow 2: Plan Hiring

```
1. Forecast demand:
   GET /ml/forecast/{skill}?scenario=aggressive

2. Get recommendations:
   GET /recommendation/{skill}

3. Trigger job posting:
   POST /integrations/job-posting/trigger

4. Create job role:
   POST /job-roles → {role_name, required_skills, target_headcount}

5. Monitor via dashboard:
   GET /analytics/hiring-trends
```

### Workflow 3: Predict Turnover Risk

```
1. Train models:
   POST /ml/train

2. Get employee risk:
   GET /ml/turnover-risk/{employee_id}

3. Identify at-risk employees:
   Loop through employees, identify risk_level == "HIGH"

4. Plan retention/backfill:
   POST /advisor/query ("We're losing X,  how do we backfill?")
```

---

## Error Handling

### Standard Error Response

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (invalid params) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not found |
| 422 | Validation error |
| 500 | Server error |

---

## Rate Limiting

- **User rate limit**: 100 requests/minute per user
- **Global rate limit**: 1000 requests/minute
- Response headers include: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

If rate limited, API returns `429 Too Many Requests`.

---

## Authentication & Security

### JWT Token

- Issued on login, valid for 60 minutes (configurable)
- Include in every request: `Authorization: Bearer {token}`
- Refresh by logging in again

### CSRF Token

- Issued on login
- Required header for POST/PUT/DELETE: `X-CSRF-Token: {token}`
- Protects against cross-site request forgery

### CORS

- Requests from `http://localhost:5173` and `http://127.0.0.1:5173` allowed
- Production: configure `ALLOWED_ORIGINS` env var

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `sqlite:///./dakshtra.db` | Database connection string |
| `JWT_SECRET_KEY` | Random | Secret for JWT signing |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 60 | JWT token lifetime |
| `OPENAI_API_KEY` | (empty) | OpenAI API key for LLM advisor |
| `OPENAI_MODEL` | `gpt-4o-mini` | LLM model to use |
| `JOB_POSTING_API_URL` | (empty) | External job posting service URL |
| `JOB_POSTING_API_KEY` | (empty) | API key for job posting service |
| `ENABLE_MODEL_RETRAINING` | `true` | Auto-retrain ML models daily |
| `RETRAIN_SCHEDULE_HOUR` | 2 | Hour (UTC) to retrain models |

---

## Examples

### Create Employee
```json
POST /employees
{
  "name": "Sarah Johnson",
  "email": "sarah@company.com",
  "department": "Engineering",
  "role": "Senior Developer",
  "year_exp": 7
}
```

### Assign Skill
```json
POST /assign-skill
{
  "employee_id": 1,
  "skill_id": 5,
  "proficiency_level": 4
}
```

### Create Job Role
```json
POST /job-roles
{
  "role_name": "Cloud Security Engineer",
  "department": "Security",
  "required_skills": ["AWS", "Cloud Security", "Kubernetes"],
  "target_headcount": 3,
  "planning_horizon_months": 6,
  "is_active": true
}
```

### Query Advisor
```json
POST /advisor/query
{
  "query": "We  need to fill 4 Kubernetes roles. Should we hire, upskill, or transfer people?",
  "scenario": "balanced",
  "use_llm": false
}
```

---

## Troubleshooting

### "Unauthorized" Error
- Check token is valid: `GET /auth/me`
- Re-login if token expired: `POST /auth/login`
- Ensure `Authorization` header is present

### "CSRF Token validation failed"
- Include `X-CSRF-Token` header for POST/PUT/DELETE
- Token issued at login

### Model endpoints return 202/no data
- Train models first: `POST /ml/train`
- Models need 24+ hours of data to predict accurately

### Pagination returns empty even though records exist
- Increase `limit` or check `has_more` flag
- Verify no filters were applied unintentionally

---

## Performance Tips

- Use pagination (`skip`/`limit`) for large datasets
- Cache analytics endpoints (they don't change frequently)
- Run model training during off-peak hours
- Use bulk endpoints ( when creating many records) if available

---

## Support

- **Interactive Docs**: http://localhost:8000/docs
- **OpenAPI Spec**: http://localhost:8000/openapi.json
- **Status Health Check**: http://localhost:8000/

---

*Last updated: March 2026*
