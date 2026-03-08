def get_auth_headers(client):
    response = client.post(
        "/auth/login",
        json={"email": "admin@dakshtra.com", "password": "admin123"},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_login_success(client):
    response = client.post(
        "/auth/login",
        json={"email": "admin@dakshtra.com", "password": "admin123"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_failure(client):
    response = client.post(
        "/auth/login",
        json={"email": "admin@dakshtra.com", "password": "wrong"},
    )

    assert response.status_code == 401


def test_protected_route_requires_token(client):
    response = client.get("/employees")
    assert response.status_code == 401


def test_employee_skill_flow(client):
    headers = get_auth_headers(client)

    employee_response = client.post(
        "/employees",
        json={
            "name": "Test User",
            "department": "Engineering",
            "role": "Developer",
            "year_exp": 3,
        },
        headers=headers,
    )
    assert employee_response.status_code == 200
    employee_id = employee_response.json()["id"]

    skill_response = client.post(
        "/skills",
        json={"skill_name": "Python", "category": "Programming"},
        headers=headers,
    )
    assert skill_response.status_code == 200
    skill_id = skill_response.json()["data"]["id"]

    assign_response = client.post(
        "/assign-skill",
        json={"employee_id": employee_id, "skill_id": skill_id, "proficiency_level": 4},
        headers=headers,
    )
    assert assign_response.status_code == 200

    profile_response = client.get(f"/employee-skills/{employee_id}", headers=headers)
    assert profile_response.status_code == 200
    profile = profile_response.json()
    assert profile["employee_name"] == "Test User"
    assert len(profile["skills"]) == 1
    assert profile["skills"][0]["skill_name"] == "Python"


def test_gap_recommendation_and_analytics(client):
    headers = get_auth_headers(client)

    employee_response = client.post(
        "/employees",
        json={
            "name": "Analytics User",
            "department": "Data",
            "role": "Analyst",
            "year_exp": 5,
        },
        headers=headers,
    )
    employee_id = employee_response.json()["id"]

    skill_response = client.post(
        "/skills",
        json={"skill_name": "SQL", "category": "Database"},
        headers=headers,
    )
    skill_id = skill_response.json()["data"]["id"]

    client.post(
        "/assign-skill",
        json={"employee_id": employee_id, "skill_id": skill_id, "proficiency_level": 3},
        headers=headers,
    )

    gap_response = client.post(
        "/skill-gap",
        json={"skill_name": "SQL", "required_count": 4},
        headers=headers,
    )
    assert gap_response.status_code == 200
    assert gap_response.json()["gap"] == 3

    recommendation_response = client.get(
        "/recommendation/SQL",
        params={"required_count": 4},
        headers=headers,
    )
    assert recommendation_response.status_code == 200
    assert recommendation_response.json()["recommendation"] == "Hire + Upskill recommended"

    proficiency_response = client.get("/analytics/proficiency-distribution", headers=headers)
    categories_response = client.get("/analytics/skill-categories", headers=headers)
    experience_response = client.get("/analytics/experience-distribution", headers=headers)

    assert proficiency_response.status_code == 200
    assert categories_response.status_code == 200
    assert experience_response.status_code == 200
    assert isinstance(proficiency_response.json(), list)
    assert isinstance(categories_response.json(), list)
    assert isinstance(experience_response.json(), list)
