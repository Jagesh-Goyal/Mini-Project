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


def test_login_rejects_invalid_password(client):
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


def test_signup_then_login_and_get_profile(client):
    signup_response = client.post(
        "/auth/signup",
        json={
            "name": "New User",
            "email": "newuser@example.com",
            "password": "Password123",
        },
    )
    assert signup_response.status_code == 201

    login_response = client.post(
        "/auth/login",
        json={"email": "newuser@example.com", "password": "Password123"},
    )
    assert login_response.status_code == 200

    token = login_response.json()["access_token"]
    me_response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    profile = me_response.json()
    assert profile["email"] == "newuser@example.com"
    assert profile["name"] == "New User"


def test_heatmap_workforce_risk_and_skill_graph(client):
    headers = get_auth_headers(client)

    skill_python = client.post(
        "/skills",
        json={"skill_name": "Python", "category": "Programming"},
        headers=headers,
    ).json()["data"]["id"]
    skill_kubernetes = client.post(
        "/skills",
        json={"skill_name": "Kubernetes", "category": "DevOps"},
        headers=headers,
    ).json()["data"]["id"]

    employee_one = client.post(
        "/employees",
        json={
            "name": "Risk User One",
            "department": "DevOps",
            "role": "DevOps Engineer",
            "year_exp": 4,
        },
        headers=headers,
    ).json()["id"]
    employee_two = client.post(
        "/employees",
        json={
            "name": "Risk User Two",
            "department": "DevOps",
            "role": "Cloud Engineer",
            "year_exp": 6,
        },
        headers=headers,
    ).json()["id"]

    client.post(
        "/assign-skill",
        json={"employee_id": employee_one, "skill_id": skill_python, "proficiency_level": 4},
        headers=headers,
    )
    client.post(
        "/assign-skill",
        json={"employee_id": employee_one, "skill_id": skill_kubernetes, "proficiency_level": 3},
        headers=headers,
    )
    client.post(
        "/assign-skill",
        json={"employee_id": employee_two, "skill_id": skill_python, "proficiency_level": 3},
        headers=headers,
    )

    heatmap_response = client.get("/analytics/skill-heatmap", headers=headers)
    assert heatmap_response.status_code == 200
    heatmap_payload = heatmap_response.json()
    assert "rows" in heatmap_payload
    assert "legend" in heatmap_payload
    assert any(row["skill"] == "Kubernetes" for row in heatmap_payload["rows"])

    risk_response = client.get("/analytics/workforce-risk", headers=headers)
    assert risk_response.status_code == 200
    risk_payload = risk_response.json()
    assert "overall_risk" in risk_payload
    assert "top_risk_summary" in risk_payload
    assert isinstance(risk_payload["teams"], list)

    graph_response = client.get("/analytics/skill-graph", headers=headers)
    assert graph_response.status_code == 200
    graph_payload = graph_response.json()
    assert "nodes" in graph_payload
    assert "edges" in graph_payload
    assert len(graph_payload["nodes"]) >= 2


def test_ml_and_resume_workflow(client):
    headers = get_auth_headers(client)

    python_skill_id = client.post(
        "/skills",
        json={"skill_name": "Python", "category": "Programming"},
        headers=headers,
    ).json()["data"]["id"]
    client.post(
        "/skills",
        json={"skill_name": "AWS", "category": "Cloud"},
        headers=headers,
    )

    employee_response = client.post(
        "/employees",
        json={
            "name": "ML User",
            "department": "Engineering",
            "role": "Engineer",
            "year_exp": 5,
        },
        headers=headers,
    )
    employee_id = employee_response.json()["id"]

    client.post(
        "/assign-skill",
        json={"employee_id": employee_id, "skill_id": python_skill_id, "proficiency_level": 4},
        headers=headers,
    )

    train_response = client.post("/ml/train", headers=headers)
    assert train_response.status_code == 200
    assert train_response.json()["status"] == "success"

    forecast_response = client.get(
        "/ml/forecast/Python",
        params={"months_ahead": 3, "scenario": "balanced"},
        headers=headers,
    )
    assert forecast_response.status_code == 200
    forecast_payload = forecast_response.json()
    assert forecast_payload["skill"] == "Python"
    assert isinstance(forecast_payload["forecasts"], dict)

    turnover_response = client.get(f"/ml/turnover-risk/{employee_id}", headers=headers)
    assert turnover_response.status_code == 200
    assert turnover_response.json()["employee_id"] == employee_id

    resume_upload_response = client.post(
        "/upload-resume",
        files={
            "file": (
                "resume.txt",
                b"Rahul Sharma\n5 years experience\nPython AWS Kubernetes",
                "text/plain",
            )
        },
        headers=headers,
    )
    assert resume_upload_response.status_code == 200
    resume_payload = resume_upload_response.json()
    assert resume_payload["status"] == "success"
    assert "mapped_skills" in resume_payload

    mapped_skill_ids = [skill["skill_id"] for skill in resume_payload["mapped_skills"]]

    create_from_resume_response = client.post(
        "/create-employee-from-resume",
        json={
            "name": "Rahul Sharma",
            "department": "Engineering",
            "role": "Backend Engineer",
            "experience_years": 5,
            "skill_ids": mapped_skill_ids,
            "proficiency_level": 3,
        },
        headers=headers,
    )
    assert create_from_resume_response.status_code == 200
    created_payload = create_from_resume_response.json()
    assert created_payload["status"] == "success"
    assert "employee_id" in created_payload
