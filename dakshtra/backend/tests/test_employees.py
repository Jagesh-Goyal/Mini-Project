from backend.tests.conftest import auth_headers


def _login_admin(client):
    payload = {
        "email": "admin2@dakshtra.test",
        "password": "StrongPass123",
        "full_name": "Admin Two",
        "role": "ADMIN"
    }
    client.post("/api/auth/register", json=payload, headers=auth_headers())
    client.post("/api/auth/login", json={"email": payload["email"], "password": payload["password"]}, headers=auth_headers())


def test_employee_crud_and_pagination(client):
    _login_admin(client)

    create = client.post(
        "/api/employees",
        json={"name": "A", "email": "a@x.com", "department": "Eng", "team": "Core", "job_title": "Dev", "years_experience": 2},
        headers=auth_headers(),
    )
    assert create.status_code == 200

    listed = client.get("/api/employees", params={"skip": 0, "limit": 10})
    assert listed.status_code == 200
    assert len(listed.json()) >= 1


def test_employee_search(client):
    _login_admin(client)
    client.post(
        "/api/employees",
        json={"name": "Search Me", "email": "search@x.com", "department": "Data", "team": "AI", "job_title": "Analyst", "years_experience": 3},
        headers=auth_headers(),
    )

    listed = client.get("/api/employees", params={"search": "Search"})
    assert listed.status_code == 200
    assert any("Search" in e["name"] for e in listed.json())
