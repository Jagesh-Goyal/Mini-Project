from backend.tests.conftest import auth_headers


def _login_admin(client):
    client.post("/api/auth/register", json={"email": "forecast@dakshtra.test", "password": "StrongPass123", "full_name": "Forecast Admin", "role": "ADMIN"}, headers=auth_headers())
    client.post("/api/auth/login", json={"email": "forecast@dakshtra.test", "password": "StrongPass123"}, headers=auth_headers())


def test_skill_forecast_shape(client):
    _login_admin(client)
    res = client.get("/api/forecast/skills")
    assert res.status_code == 200
    assert len(res.json()) == 6


def test_scenario_forecast(client):
    _login_admin(client)
    res = client.post("/api/forecast/scenario", json={"growth_percent": 25}, headers=auth_headers())
    assert res.status_code == 200
    assert all("predicted_demand" in row for row in res.json())
