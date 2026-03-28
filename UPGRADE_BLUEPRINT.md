# AI-Based Workforce Planning & Skill Gap Intelligence Platform — Upgrade Blueprint

This document upgrades the **existing** system (not a rebuild) into a production-grade, hackathon-winning implementation.

---

## 1) Current System Baseline

Already available in this repo:
- Workforce master data: employees, skills, assignments, training history
- Core analytics: skill heatmap, gap analysis, risk analysis, recommendations
- ML endpoints: training, forecast, turnover risk
- Resume/JD parsing and report export (CSV/XLSX/PDF)
- React dashboard with multiple modules

Current flow:
`HR data -> skill mapping -> analytics + forecasts -> dashboard + reports`

---

## 2) Gap Identification

### AI depth gaps
- Regex NLP only; low explainability and confidence transparency
- Forecast quality not previously exposed with MAE/RMSE/R²/F1 governance
- Recommendation logic existed but lacked explicit decision scoring/rationale

### Architecture gaps
- No conversational advisor layer for natural-language HR queries
- No persistent prediction/recommendation audit trail for governance
- Job-role planning schema was missing

### Scalability gaps
- Limited model monitoring and no model performance endpoint
- No historical prediction snapshot table for drift audits

### Real-world usability gaps
- HR users need “ask in plain English” capability
- Dashboard lacked hiring trend view for leadership planning
- JD parsing needed confidence visibility for trust

### Differentiation gaps
- Many teams have static dashboards; fewer have explainable AI + conversational advisor + audit logs

---

## 3) Feature Upgrades (Detailed)

## A. AI Skill Intelligence Engine

### Implemented upgrade
- `ml/nlp_extractor.py` now includes:
  - Confidence scoring per skill
  - Evidence snippets from source text
  - Alias-aware skill matching + token-overlap fallback
  - Rich `skill_intelligence` output

### Parsing flow (input -> processing -> output)
1. Input: resume/JD text
2. Processing:
   - Regex/alias detection
   - Mention counting
   - Confidence calibration
   - DB mapping with normalized keys and overlap scoring
3. Output:
   - `extracted_skills`
   - `mapped_skills` with confidence/evidence
   - `skill_intelligence` ranked list

### API outputs upgraded
- `/upload-resume` returns `skill_intelligence`
- `/parse-jd` returns confidence and evidence per skill

---

## B. Skill Gap Analyzer (Advanced)

### Implemented upgrade
`POST /skill-gap` now returns:
- coverage ratio
- shortage ratio
- urgency score (0-100)
- priority level (LOW/MEDIUM/HIGH)
- recommendation hint

### Scoring logic
Let:
- `gap = max(required - current, 0)`
- `shortage_ratio = gap / required`
- `strategic_boost = 12` for strategic skills

Urgency score:
`urgency = min(100, round((shortage_ratio * 65) + (gap * 6) + strategic_boost))`

---

## C. Demand Forecasting System

### Implemented upgrade
- `ml/model.py` now computes holdout metrics:
  - Demand: MAE, RMSE, R²
  - Turnover: Accuracy, Precision, Recall, F1
- New endpoint: `GET /ml/evaluate`
- Forecast results persisted to DB (`prediction_snapshots`) for audit/history

### Data usage
- Existing employee/skill/supply + synthetic temporal augmentation
- Department and skill encoders
- Scenario multipliers (`conservative`, `balanced`, `aggressive`)

---

## D. AI Workforce Advisor (Killer Feature)

### Implemented upgrade
New endpoint: `POST /advisor/query`
- Works in two modes:
  - `llm` mode (if API key configured)
  - `fallback` mode (deterministic advisor; always available)
- Returns:
  - natural-language answer
  - action cards with priority
  - follow-up questions
  - KPI snapshot (employees, critical/medium gaps)

### LLM integration
- Optional OpenAI-compatible call using env vars:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
  - `OPENAI_BASE_URL`

### Frontend
- New page: `/advisor` in React with conversational workflow

---

## E. Recommendation Engine

### Implemented upgrade
`GET /recommendation/{skill_name}` now includes:
- `decision_scores`:
  - hire_pressure
  - upskill_fit
  - transfer_readiness
- `decision_rationale`: human-readable explanation bullets
- Recommendation events are persisted to `recommendation_logs`

### Decision logic (high-level)
- Estimate transfer/upskill pools from internal candidates
- Allocate transfer/upskill first within guardrails
- Remaining deficit -> hiring
- Score and rationale generated for explainability

---

## F. Advanced Dashboard

### Implemented upgrade
- New analytics endpoint: `GET /analytics/hiring-trends`
- Dashboard now displays hiring trend panel (last 12 months)
- Recommendation page now shows decision scores/rationale
- JD parser UI now shows NLP confidence
- New full advisor UI page integrated in navigation

### Visualization stack
- Existing: Recharts + custom cards/tables
- Optional enterprise enhancement: Power BI embedding for executive scorecards

---

## 4) System Architecture (Detailed)

## Components
- Frontend: React + TypeScript (Vite)
- Backend: FastAPI + SQLAlchemy
- Database: SQLite (dev), PostgreSQL-ready via `DATABASE_URL`
- AI Layer:
  - NLP skill intelligence engine
  - Forecasting + turnover ML models
  - Conversational advisor (LLM + fallback)
- Cloud target: AWS/Azure containerized deployment

## Data flow
1. HR uploads resume/JD or edits employee/skill data
2. NLP service extracts skills + confidence/evidence
3. Skill graph/heatmap/gap/risk analytics computed
4. Forecast service predicts demand and stores snapshots
5. Recommendation engine outputs hire/upskill/transfer with rationale
6. Advisor service answers strategic HR queries via API
7. Dashboard consumes all APIs and renders execution insights

## API structure (key)
- Core data: `/employees`, `/skills`, `/assign-skill`
- Planning: `/skill-gap`, `/recommendation/{skill_name}`
- AI/ML: `/ml/train`, `/ml/evaluate`, `/ml/forecast/{skill_name}`, `/ml/turnover-risk/{employee_id}`
- Analytics: `/analytics/skill-heatmap`, `/analytics/workforce-risk`, `/analytics/hiring-trends`
- NLP intake: `/upload-resume`, `/parse-jd`
- Advisor: `/advisor/query`
- Reports: `/reports/skill-gap`, `/reports/employee-skills`, `/reports/forecast`

---

## 5) Database Design

## Existing core
- `users`
- `employees`
- `skills`
- `employee_skills`
- `training_history`

## Added for production planning
- `job_roles`
  - role_name, department
  - required_skills_json
  - target_headcount
  - planning_horizon_months
  - status flags + timestamps

- `prediction_snapshots`
  - skill_id, department, scenario
  - horizon_month, forecast_date
  - predicted_demand/supply/gap
  - model_version, confidence

- `recommendation_logs`
  - skill_id, scope
  - required/current/gap
  - hire/upskill/transfer counts
  - decision + rationale_json
  - audit timestamps

---

## 6) Implementation Plan (Step-by-step)

Step 1 — Backend AI hardening
- Finish endpoint contracts and payload validation
- Add auth/role constraints where required

Step 2 — AI API integration
- Enable LLM provider keys in env
- Add retries/timeouts/circuit-breaker for external calls

Step 3 — ML quality pipeline
- Schedule periodic retraining
- Store model artifacts and evaluation history

Step 4 — Frontend integration
- Extend advisor UX with saved conversations and filters
- Add hiring/risk trend drill-down views

Step 5 — Deployment
- Containerize backend/frontend
- PostgreSQL + object storage + secrets manager
- CI/CD + observability + rollback strategy

---

## 7) Recommended Tech Stack (Modern + Practical)

Frontend
- React + TypeScript + Vite
- Zustand + Axios
- Recharts

Backend
- FastAPI + SQLAlchemy + Pydantic
- Celery/RQ (next phase async jobs)

AI/ML
- scikit-learn (baseline)
- Optional: PyTorch/Prophet/LSTM for richer forecasting
- OpenAI/Gemini for advisor layer

Data
- PostgreSQL (prod), Redis cache, object store for artifacts

Deployment
- Docker + Nginx
- AWS ECS/Fargate or Azure Container Apps
- GitHub Actions CI/CD

---

## 8) Demo Flow (Hackathon-ready)

1. Upload JD (cloud security + kubernetes role)
2. Show extracted skills with confidence in JD parser
3. Run skill gap analysis for same skills and scope
4. Generate recommendation (hire/upskill/transfer + score rationale)
5. Run forecast (6 months, aggressive scenario)
6. Open Dashboard and show:
   - heatmap
   - workforce risk
   - hiring trend
7. Ask Advisor:
   - “Should we hire or upskill for Kubernetes?”
   - show action cards and KPI-driven answer
8. Export forecast/skill-gap reports for leadership

---

## 9) Differentiation (Why it stands out)

- Explainable AI, not just predictions:
  - confidence, evidence, decision scores, rationale
- Conversational HR intelligence layer:
  - actionable answers, not static charts
- Governance-ready architecture:
  - prediction and recommendation audit logs
- Full loop platform:
  - ingestion -> forecasting -> decisions -> execution dashboards
- Practical production path:
  - modular API boundaries, cloud-ready stack, measurable model quality

---

## Immediate Next Sprint (P0)
- Add role-based API protection to new planning endpoints
- Move from synthetic-heavy to historical demand datasets
- Add advisor conversation persistence and source citations
- Add dashboard drill-down from trend cards to scoped action views
