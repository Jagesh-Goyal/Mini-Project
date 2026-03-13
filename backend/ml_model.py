"""
Machine Learning Models for Demand Forecasting & Turnover Prediction
- Demand Forecasting: Random Forest Regressor
- Turnover Prediction: Gradient Boosting Classifier
"""

import numpy as np
import pandas as pd
import os
import joblib
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sqlalchemy.orm import Session

from backend.model import Employee, Skill, EmployeeSkill
from backend.database import SessionLocal


MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

DEMAND_MODEL_PATH = os.path.join(MODEL_DIR, "demand_forecast_model.pkl")
TURNOVER_MODEL_PATH = os.path.join(MODEL_DIR, "turnover_prediction_model.pkl")
LABEL_ENCODERS_PATH = os.path.join(MODEL_DIR, "label_encoders.pkl")


class MLModels:
    """Wrapper for ML models - demand forecasting and turnover prediction."""

    def __init__(self):
        self.demand_model = None
        self.turnover_model = None
        self.label_encoders = {}
        self.feature_importance = None
        self.training_records = 0
        self.load_models()

    def load_models(self):
        """Load models from disk if available."""
        try:
            if os.path.exists(DEMAND_MODEL_PATH):
                self.demand_model = joblib.load(DEMAND_MODEL_PATH)
            if os.path.exists(TURNOVER_MODEL_PATH):
                self.turnover_model = joblib.load(TURNOVER_MODEL_PATH)
            if os.path.exists(LABEL_ENCODERS_PATH):
                self.label_encoders = joblib.load(LABEL_ENCODERS_PATH)
        except Exception as e:
            print(f"Error loading models: {e}")

    def save_models(self):
        """Save models to disk."""
        try:
            joblib.dump(self.demand_model, DEMAND_MODEL_PATH)
            joblib.dump(self.turnover_model, TURNOVER_MODEL_PATH)
            joblib.dump(self.label_encoders, LABEL_ENCODERS_PATH)
        except Exception as e:
            print(f"Error saving models: {e}")

    def generate_synthetic_training_data(self, db: Session, months: int = 24) -> tuple:
        """
        Generate synthetic historical data for training.
        Simulates 24 months of skill demand data with trends and seasonality.
        """
        skills = db.query(Skill).all()
        employees = db.query(Employee).all()
        
        if not skills:
            return None, None

        skill_names = [s.skill_name for s in skills]
        departments = list(set(e.department for e in employees if e.department)) or ["Engineering"]

        # Define trending skills (50% growth simulation)
        trending_skills = {"Machine Learning", "Kubernetes", "AWS", "AI", "Cloud Security"}

        data = []
        for month in range(1, months + 1):
            year = 2024 + (month - 1) // 12
            month_in_year = ((month - 1) % 12) + 1
            quarter = (month_in_year - 1) // 3 + 1

            for skill_name in skill_names:
                for department in departments:
                    # Base demand
                    base_demand = np.random.randint(5, 20)

                    # Trending skills: 50% growth over 24 months
                    trend_factor = 1.5 if skill_name in trending_skills else 1.0
                    trend_boost = trend_factor ** (month / 24) if skill_name in trending_skills else 1.0

                    # Seasonal pattern: higher hiring Q1 & Q3
                    seasonal_factor = 1.2 if quarter in [1, 3] else 0.85

                    # Department affinity
                    dept_affinity = {
                        "engineering": {"Python": 1.3, "SQL": 1.25, "React": 1.2},
                        "data science": {"Python": 1.4, "Machine Learning": 1.35, "SQL": 1.2},
                        "devops": {"Kubernetes": 1.4, "AWS": 1.3, "Docker": 1.25},
                        "backend": {"Python": 1.3, "SQL": 1.25},
                    }

                    dept_key = department.lower().replace(" ", "")
                    affinity = dept_affinity.get(dept_key, {}).get(skill_name, 1.0)

                    # Calculate demand
                    demand = base_demand * trend_boost * seasonal_factor * affinity

                    # Add realistic noise
                    noise = np.random.normal(1.0, 0.15)
                    final_demand = max(1, int(demand * noise))

                    # Current supply (actual employee count with this skill)
                    current_count = (
                        db.query(EmployeeSkill)
                        .join(Skill, Skill.id == EmployeeSkill.skill_id)
                        .filter(Skill.skill_name == skill_name)
                        .count()
                    )

                    # Trend score (0-100): higher for trending skills
                    trend_score = 75 if skill_name in trending_skills else 30

                    data.append(
                        {
                            "month": month,
                            "quarter": quarter,
                            "year": year,
                            "skill": skill_name,
                            "department": department,
                            "demand": final_demand,
                            "supply": current_count,
                            "trend_score": trend_score,
                        }
                    )

        df = pd.DataFrame(data)
        return df

    def train_models(self, db: Session) -> dict:
        """Train both demand forecasting and turnover prediction models."""
        
        # Generate synthetic data
        df = self.generate_synthetic_training_data(db)
        if df is None or df.empty:
            return {"error": "Insufficient data for training"}

        self.training_records = len(df)

        # ============ DEMAND FORECASTING MODEL (Random Forest) ============
        try:
            # Encode categorical variables
            if "skill" not in self.label_encoders:
                self.label_encoders["skill"] = LabelEncoder()
            if "demand_department" not in self.label_encoders:
                self.label_encoders["demand_department"] = LabelEncoder()
            if "turnover_department" not in self.label_encoders:
                self.label_encoders["turnover_department"] = LabelEncoder()

            df["skill_encoded"] = self.label_encoders["skill"].fit_transform(df["skill"])
            df["department_encoded"] = self.label_encoders["demand_department"].fit_transform(
                df["department"]
            )
            self.label_encoders["department"] = self.label_encoders["demand_department"]

            # Feature engineering for demand forecasting
            X_demand = df[
                ["month", "quarter", "year", "skill_encoded", "department_encoded", "supply", "trend_score"]
            ]
            y_demand = df["demand"]

            # Train Random Forest
            self.demand_model = RandomForestRegressor(
                n_estimators=100,
                max_depth=15,
                min_samples_split=5,
                random_state=42,
                n_jobs=-1,
            )
            self.demand_model.fit(X_demand, y_demand)

            # Feature importance
            feature_names = ["month", "quarter", "year", "skill", "department", "supply", "trend_score"]
            self.feature_importance = dict(zip(feature_names, self.demand_model.feature_importances_))

            demand_r2 = self.demand_model.score(X_demand, y_demand)

        except Exception as e:
            return {"error": f"Demand model training failed: {str(e)}"}

        # ============ TURNOVER PREDICTION MODEL (Gradient Boosting) ============
        try:
            employees = db.query(Employee).all()
            turnover_data = []

            for emp in employees:
                skill_count = (
                    db.query(EmployeeSkill)
                    .filter(EmployeeSkill.employee_id == emp.id)
                    .count()
                )

                avg_proficiency = (
                    db.query(EmployeeSkill.proficiency_level)
                    .filter(EmployeeSkill.employee_id == emp.id)
                    .all()
                )
                avg_prof = (
                    np.mean([p[0] for p in avg_proficiency]) if avg_proficiency else 2.5
                )

                # Synthetic turnover risk: senior employees with few skills = higher risk
                risk = 1 if (emp.year_exp >= 5 and skill_count <= 2) else 0

                turnover_data.append(
                    {
                        "experience": emp.year_exp,
                        "skill_count": skill_count,
                        "proficiency": avg_prof,
                        "department": emp.department or "Unknown",
                        "risk": risk,
                    }
                )

            if len(turnover_data) < 5:
                # Synthetic data for demonstration
                for _ in range(20):
                    turnover_data.append(
                        {
                            "experience": np.random.randint(1, 15),
                            "skill_count": np.random.randint(1, 8),
                            "proficiency": np.random.uniform(1, 5),
                            "department": np.random.choice(["Engineering", "Data", "DevOps"]),
                            "risk": np.random.randint(0, 2),
                        }
                    )

            df_turnover = pd.DataFrame(turnover_data)

            # Encode department
            df_turnover["department_encoded"] = self.label_encoders[
                "turnover_department"
            ].fit_transform(df_turnover["department"])

            X_turnover = df_turnover[
                ["experience", "skill_count", "proficiency", "department_encoded"]
            ]
            y_turnover = df_turnover["risk"]

            # Train Gradient Boosting Classifier
            self.turnover_model = GradientBoostingClassifier(
                n_estimators=50,
                learning_rate=0.1,
                max_depth=5,
                random_state=42,
            )
            self.turnover_model.fit(X_turnover, y_turnover)

            turnover_accuracy = self.turnover_model.score(X_turnover, y_turnover)

        except Exception as e:
            return {"error": f"Turnover model training failed: {str(e)}"}

        # Save models
        self.save_models()

        return {
            "status": "success",
            "demand_model_r2": round(demand_r2, 4),
            "turnover_model_accuracy": round(turnover_accuracy, 4),
            "training_records": self.training_records,
            "feature_importance": {k: round(v, 4) for k, v in self.feature_importance.items()},
        }

    def forecast_demand(
        self, skill_name: str, months_ahead: int = 3, department: str = None, db: Session = None
    ) -> dict:
        """
        Forecast skill demand using Random Forest model.
        
        months_ahead: 3, 6, or 12 months
        """
        if self.demand_model is None:
            return {"error": "Model not trained. Please train the model first."}

        try:
            skill_encoder = self.label_encoders.get("skill")
            department_encoder = self.label_encoders.get("demand_department") or self.label_encoders.get(
                "department"
            )

            if skill_encoder is None or department_encoder is None:
                return {"error": "Model encoders missing. Please retrain model."}

            skill_classes = set(skill_encoder.classes_)
            if skill_name not in skill_classes:
                return {
                    "error": (
                        "Requested skill is not available in trained model. "
                        "Please retrain model after adding the skill."
                    )
                }

            department_classes = set(department_encoder.classes_)

            # Get all departments if not specified
            if department is None:
                employees = db.query(Employee).all() if db else []
                db_departments = sorted({e.department for e in employees if e.department})
                departments = [dept for dept in db_departments if dept in department_classes]

                if not departments:
                    departments = list(department_encoder.classes_)
            else:
                if department not in department_classes:
                    return {
                        "error": (
                            "Requested department is not available in trained model. "
                            "Please retrain model after adding department data."
                        )
                    }
                departments = [department]

            if not departments:
                return {"error": "No valid departments available for forecasting"}

            current_date = datetime.now()
            forecast_result = {}

            skill_obj = db.query(Skill).filter(Skill.skill_name == skill_name).first() if db else None
            base_supply = (
                db.query(EmployeeSkill)
                .filter(EmployeeSkill.skill_id == skill_obj.id)
                .count()
                if db and skill_obj
                else 5
            )

            for dept in departments:
                predictions = []

                for month_offset in range(1, months_ahead + 1):
                    future_date = current_date + timedelta(days=30 * month_offset)

                    month = future_date.month
                    quarter = (month - 1) // 3 + 1
                    year = future_date.year

                    supply = base_supply

                    # Encode categorical variables
                    skill_code = skill_encoder.transform([skill_name])[0]
                    dept_code = department_encoder.transform([dept])[0]

                    # Trend score
                    trend_score = 75 if skill_name in {"Machine Learning", "Kubernetes", "AWS"} else 30

                    # Predict
                    X_pred = pd.DataFrame(
                        {
                            "month": [month],
                            "quarter": [quarter],
                            "year": [year],
                            "skill_encoded": [skill_code],
                            "department_encoded": [dept_code],
                            "supply": [supply],
                            "trend_score": [trend_score],
                        }
                    )

                    demand_pred = self.demand_model.predict(X_pred)[0]
                    gap = max(0, int(demand_pred) - supply)

                    predictions.append(
                        {
                            "month": month_offset,
                            "date": future_date.strftime("%Y-%m-%d"),
                            "demand": max(0, int(demand_pred)),
                            "supply": supply,
                            "gap": gap,
                        }
                    )

                forecast_result[dept] = predictions

            return {
                "skill": skill_name,
                "months_ahead": months_ahead,
                "forecasts": forecast_result,
            }

        except Exception as e:
            return {"error": f"Forecasting failed: {str(e)}"}

    def predict_turnover_risk(self, employee_id: int, db: Session) -> dict:
        """Predict turnover risk for an employee."""
        if self.turnover_model is None:
            return {"error": "Turnover model not trained"}

        try:
            emp = db.query(Employee).filter(Employee.id == employee_id).first()
            if not emp:
                return {"error": "Employee not found"}

            skill_count = db.query(EmployeeSkill).filter(EmployeeSkill.employee_id == emp.id).count()

            avg_proficiency = (
                db.query(EmployeeSkill.proficiency_level)
                .filter(EmployeeSkill.employee_id == emp.id)
                .all()
            )
            avg_prof = np.mean([p[0] for p in avg_proficiency]) if avg_proficiency else 2.5

            department_encoder = self.label_encoders.get("turnover_department") or self.label_encoders.get(
                "department"
            )
            if department_encoder is None:
                return {"error": "Turnover encoder missing. Please retrain model."}

            employee_department = emp.department or "Unknown"
            if employee_department not in set(department_encoder.classes_):
                employee_department = department_encoder.classes_[0]

            dept_code = department_encoder.transform([employee_department])[0]

            X_pred = pd.DataFrame(
                {
                    "experience": [emp.year_exp],
                    "skill_count": [skill_count],
                    "proficiency": [avg_prof],
                    "department_encoded": [dept_code],
                }
            )

            risk_pred = self.turnover_model.predict(X_pred)[0]
            risk_prob = self.turnover_model.predict_proba(X_pred)[0][1]

            return {
                "employee_id": employee_id,
                "employee_name": emp.name,
                "risk_level": "HIGH" if risk_pred == 1 else "LOW",
                "risk_probability": round(risk_prob, 3),
            }

        except Exception as e:
            return {"error": f"Prediction failed: {str(e)}"}


# Global instance
ml_models = MLModels()
