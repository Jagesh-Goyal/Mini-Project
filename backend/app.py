from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# database engine
from backend.database import engine

# models
from backend import model

# router import
from backend.all_api import router

# seed database
from backend.seed import seed_database

# ML libraries
import numpy as np
from sklearn.linear_model import LinearRegression


# create database tables
model.Base.metadata.create_all(bind=engine)

# seed database with sample data
try:
    seed_database()
except Exception as e:
    print(f"Database seeding skipped: {e}")


# FastAPI app
app = FastAPI()

# CORS - allow frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include routes
app.include_router(router)


# root endpoint
@app.get("/")
def root():
    return {
        "status": "success",
        "server": "running",
        "database": "connected"
    }


# ==========================
# ML Forecast API
# ==========================

@app.get("/forecast/{skill_name}")
def forecast_skill_demand(skill_name: str):

    # dummy historical hiring data
    months = np.array([1, 2, 3, 4, 5]).reshape(-1, 1)
    demand = np.array([2, 3, 4, 5, 6])

    model_lr = LinearRegression()
    model_lr.fit(months, demand)

    next_month = np.array([[6]])
    prediction = model_lr.predict(next_month)

    return {
        "skill": skill_name,
        "predicted_demand_next_month": int(prediction[0])
    }
