from backend.tests.conftest import auth_headers


def _login_admin(client):
    client.post("/api/auth/register", json={"email": "gap@dakshtra.test", "password": "StrongPass123", "full_name": "Gap Admin", "role": "ADMIN"}, headers=auth_headers())
    client.post("/api/auth/login", json={"email": "gap@dakshtra.test", "password": "StrongPass123"}, headers=auth_headers())


def test_org_gap_endpoint(client):
    _login_admin(client)
    res = client.get("/api/gap/org")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_role_gap_endpoint(client):
    _login_admin(client)
    res = client.post("/api/gap/role", json={"role_name": "Data Scientist"}, headers=auth_headers())
    assert res.status_code == 200
    assert isinstance(res.json(), list)
