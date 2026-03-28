# Dakshtra Mini Project

AI-powered workforce planning platform with FastAPI backend, ML/NLP modules, and React + Vite frontend.

## Quick Start (Local)

### 1) Backend

```powershell
.\env\Scripts\python.exe -m uvicorn backend.app:app --reload --host 127.0.0.1 --port 8000
```

### 2) Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`  
Backend URL: `http://127.0.0.1:8000`

## Environment

Use `.env.example` as the base configuration for both backend and frontend values.

## Tests

### Backend tests

```powershell
.\env\Scripts\python.exe -m pytest backend/tests -q --tb=short
```

### Frontend tests

```powershell
cd frontend
npm run test
```

## Docker Deployment

Build and run full stack:

```powershell
docker compose up --build
```

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:8000`

Stop containers:

```powershell
docker compose down
```
