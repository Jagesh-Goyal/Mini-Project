from backend.tests.conftest import auth_headers


def _login_admin(client):
    client.post("/api/auth/register", json={"email": "skills@dakshtra.test", "password": "StrongPass123", "full_name": "Skills Admin", "role": "ADMIN"}, headers=auth_headers())
    client.post("/api/auth/login", json={"email": "skills@dakshtra.test", "password": "StrongPass123"}, headers=auth_headers())


def test_create_skill_and_matrix(client):
    _login_admin(client)
    create = client.post("/api/skills", json={"name": "Python", "category": "Programming", "description": "Language"}, headers=auth_headers())
    assert create.status_code == 200

    matrix = client.get("/api/skills/matrix")
    assert matrix.status_code == 200


def test_heatmap_data(client):
    _login_admin(client)
    client.post("/api/skills", json={"name": "Docker", "category": "DevOps", "description": "Container"}, headers=auth_headers())
    heatmap = client.get("/api/skills/heatmap")
    assert heatmap.status_code == 200
    assert isinstance(heatmap.json(), list)
