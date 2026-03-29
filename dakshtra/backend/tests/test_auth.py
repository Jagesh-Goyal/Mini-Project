from backend.tests.conftest import auth_headers


def test_register_and_login(client):
    payload = {
        "email": "admin@dakshtra.test",
        "password": "StrongPass123",
        "full_name": "Admin User",
        "role": "ADMIN"
    }
    reg = client.post("/api/auth/register", json=payload, headers=auth_headers())
    assert reg.status_code == 200

    login = client.post("/api/auth/login", json={"email": payload["email"], "password": payload["password"]}, headers=auth_headers())
    assert login.status_code == 200
    assert "csrf_token" in login.json()


def test_refresh_and_logout(client):
    payload = {
        "email": "hr@dakshtra.test",
        "password": "StrongPass123",
        "full_name": "HR User",
        "role": "HR_MANAGER"
    }
    client.post("/api/auth/register", json=payload, headers=auth_headers())
    client.post("/api/auth/login", json={"email": payload["email"], "password": payload["password"]}, headers=auth_headers())

    refresh = client.post("/api/auth/refresh")
    assert refresh.status_code == 200

    logout = client.post("/api/auth/logout")
    assert logout.status_code == 200
