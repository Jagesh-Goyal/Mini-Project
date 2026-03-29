from datetime import datetime

import numpy as np
from sklearn.linear_model import LinearRegression
from sqlalchemy.orm import Session

from backend.models.skill import Skill


def _synthetic_history(months: int = 12) -> tuple[np.ndarray, np.ndarray]:
    x = np.arange(months).reshape(-1, 1)
    base = np.linspace(20, 50, months)
    noise = np.random.default_rng(42).normal(0, 2, months)
    y = base + noise
    return x, y


def forecast_skill_demand(db: Session, horizon: int = 6) -> list[dict]:
    skills = db.query(Skill).all()
    output = []
    for skill in skills:
        x, y = _synthetic_history(12)
        model = LinearRegression()
        model.fit(x, y)

        future_x = np.arange(12, 12 + horizon).reshape(-1, 1)
        preds = model.predict(future_x)
        trend = "up" if preds[-1] >= y[-1] else "down"

        output.append(
            {
                "skill": skill.name,
                "current_demand": round(float(y[-1]), 2),
                "predicted_demand": [round(float(item), 2) for item in preds],
                "trend_direction": trend,
                "months": [(datetime.utcnow().month + i - 1) % 12 + 1 for i in range(1, horizon + 1)],
            }
        )
    return output


def scenario_forecast(db: Session, growth_percent: float) -> list[dict]:
    baseline = forecast_skill_demand(db, horizon=6)
    factor = 1 + (growth_percent / 100)
    for item in baseline:
        item["predicted_demand"] = [round(point * factor, 2) for point in item["predicted_demand"]]
    return baseline
