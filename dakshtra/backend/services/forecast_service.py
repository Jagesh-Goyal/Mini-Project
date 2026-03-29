from datetime import datetime, timedelta

import numpy as np
from sklearn.linear_model import LinearRegression


def synthetic_skill_history(points: int = 12):
    x = np.arange(points).reshape(-1, 1)
    y = 20 + 2 * np.arange(points) + np.random.normal(0, 1.5, points)
    return x, y


def forecast_next_6_months(skill_name: str):
    x, y = synthetic_skill_history()
    model = LinearRegression()
    model.fit(x, y)

    future_x = np.arange(len(x), len(x) + 6).reshape(-1, 1)
    predictions = model.predict(future_x)

    result = []
    for i, value in enumerate(predictions):
        current = float(y[-1])
        predicted = float(value)
        trend = "up" if predicted >= current else "down"
        result.append(
            {
                "skill_name": skill_name,
                "month": (datetime.utcnow() + timedelta(days=(i + 1) * 30)).strftime("%Y-%m"),
                "current_demand": round(current, 2),
                "predicted_demand": round(predicted, 2),
                "trend": trend,
            }
        )
    return result


def scenario_forecast(growth_percent: int, skill_name: str = "Cloud"):
    base = forecast_next_6_months(skill_name)
    multiplier = 1 + (growth_percent / 100)
    for item in base:
        item["predicted_demand"] = round(item["predicted_demand"] * multiplier, 2)
    return base
