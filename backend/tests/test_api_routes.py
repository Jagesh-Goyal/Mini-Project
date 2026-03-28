def get_auth_headers(client):
    response = client.post(
        "/auth/login",
        json={"email": "admin@dakshtra.com", "password": "admin123"},
    )
    assert response.status_code == 200
    token_payload = response.json()
    token = token_payload["access_token"]
    csrf_token = token_payload["csrf_token"]
    return {
        "Authorization": f"Bearer {token}",
        "X-CSRF-Token": csrf_token,
    }


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


def test_ml_evaluation_hiring_trends_and_advisor(client):
    headers = get_auth_headers(client)

    client.post(
        "/skills",
        json={"skill_name": "Kubernetes", "category": "DevOps"},
        headers=headers,
    )
    employee_response = client.post(
        "/employees",
        json={
            "name": "Trend User",
            "department": "Engineering",
            "role": "Platform Engineer",
            "year_exp": 4,
        },
        headers=headers,
    )
    assert employee_response.status_code == 200

    train_response = client.post("/ml/train", headers=headers)
    assert train_response.status_code == 200

    evaluate_response = client.get("/ml/evaluate", headers=headers)
    assert evaluate_response.status_code == 200
    evaluate_payload = evaluate_response.json()
    assert evaluate_payload["status"] == "success"
    assert "report" in evaluate_payload
    assert "demand_metrics" in evaluate_payload["report"]

    hiring_trends_response = client.get("/analytics/hiring-trends", headers=headers)
    assert hiring_trends_response.status_code == 200
    hiring_payload = hiring_trends_response.json()
    assert "trends" in hiring_payload
    assert isinstance(hiring_payload["trends"], list)

    advisor_response = client.post(
        "/advisor/query",
        json={
            "query": "What should we prioritize for hiring this quarter?",
            "scenario": "balanced",
            "use_llm": False,
        },
        headers=headers,
    )
    assert advisor_response.status_code == 200
    advisor_payload = advisor_response.json()
    assert advisor_payload["mode"] in {"llm", "fallback"}
    assert "answer" in advisor_payload
    assert isinstance(advisor_payload["action_cards"], list)


def test_job_role_planning_endpoints(client):
    headers = get_auth_headers(client)

    create_role_response = client.post(
        "/job-roles",
        json={
            "role_name": "Cloud Security Engineer",
            "department": "Security",
            "required_skills": ["Cloud Security", "AWS", "Kubernetes"],
            "target_headcount": 4,
            "planning_horizon_months": 6,
            "is_active": True,
        },
        headers=headers,
    )
    assert create_role_response.status_code == 200
    role_payload = create_role_response.json()
    role_id = role_payload["id"]
    assert role_payload["role_name"] == "Cloud Security Engineer"

    list_role_response = client.get("/job-roles", headers=headers)
    assert list_role_response.status_code == 200
    role_list = list_role_response.json()
    assert any(role["id"] == role_id for role in role_list)

    update_role_response = client.put(
        f"/job-roles/{role_id}",
        json={
            "role_name": "Cloud Security Lead",
            "department": "Security",
            "required_skills": ["Cloud Security", "AWS"],
            "target_headcount": 5,
            "planning_horizon_months": 12,
            "is_active": True,
        },
        headers=headers,
    )
    assert update_role_response.status_code == 200
    updated_payload = update_role_response.json()
    assert updated_payload["role_name"] == "Cloud Security Lead"
    assert updated_payload["target_headcount"] == 5


def test_jd_parser_with_confidence(client):
    """Test job description parsing with skill confidence scoring."""
    headers = get_auth_headers(client)

    jd_text = """
    Job Title: Senior Backend Engineer
    
    Required Skills:
    - Python (5+ years)
    - FastAPI or Django
    - PostgreSQL and MySQL
    - Kubernetes and Docker
    - AWS (EC2, S3, Lambda)
    - Git and CI/CD (Jenkins, GitHub Actions)
    
    Nice to have:
    - Machine Learning basics
    - Apache Kafka
    - Redis
    """

    parse_response = client.post(
        "/parse-jd",
        json={"jd_text": jd_text},
        headers=headers,
    )
    assert parse_response.status_code == 200
    payload = parse_response.json()
    assert payload["status"] == "success"
    assert "extracted_skills" in payload
    assert "mapped_skills" in payload
    assert "skill_intelligence" in payload
    
    # Verify confidence scoring exists
    for skill in payload.get("skill_intelligence", []):
        assert "skill_name" in skill
        assert "confidence" in skill
        assert 0 <= skill["confidence"] <= 100


def test_advisor_query_with_fallback_mode(client):
    """Test advisor query endpoint with fallback mode (no LLM)."""
    headers = get_auth_headers(client)

    # Create sample data
    client.post(
        "/skills",
        json={"skill_name": "Kubernetes", "category": "DevOps"},
        headers=headers,
    )
    client.post(
        "/employees",
        json={
            "name": "Advisor Test User",
            "department": "Engineering",
            "role": "DevOps Engineer",
            "year_exp": 3,
        },
        headers=headers,
    )

    # Test various advisor queries
    test_queries = [
        "What are our top skill gaps?",
        "Which departments need the most hiring?",
        "Should we hire or upskill for Kubernetes?",
        "What's our workforce risk score?",
    ]

    for query in test_queries:
        response = client.post(
            "/advisor/query",
            json={
                "query": query,
                "use_llm": False,  # Force fallback mode
            },
            headers=headers,
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["mode"] == "fallback"
        assert "answer" in payload
        assert len(payload["answer"]) > 0
        assert "action_cards" in payload
        assert isinstance(payload["action_cards"], list)
        assert "kpi_snapshot" in payload


def test_model_evaluation_metrics(client):
    """Test model evaluation endpoint returns proper metrics."""
    headers = get_auth_headers(client)

    # Train models first
    train_response = client.post("/ml/train", headers=headers)
    assert train_response.status_code == 200

    # Get evaluation metrics
    eval_response = client.get("/ml/evaluate", headers=headers)
    assert eval_response.status_code == 200
    payload = eval_response.json()

    assert payload["status"] == "success"
    assert "report" in payload
    report = payload["report"]

    # Check demand model metrics
    assert "demand_metrics" in report
    demand_metrics = report["demand_metrics"]
    assert "mae" in demand_metrics
    assert "rmse" in demand_metrics
    assert "r2_score" in demand_metrics
    assert isinstance(demand_metrics["mae"], (int, float))
    assert isinstance(demand_metrics["rmse"], (int, float))

    # Check turnover model metrics
    assert "turnover_metrics" in report
    turnover_metrics = report["turnover_metrics"]
    assert "accuracy" in turnover_metrics
    assert "precision" in turnover_metrics
    assert "recall" in turnover_metrics
    assert "f1_score" in turnover_metrics


def test_forecast_with_multiple_scenarios(client):
    """Test forecasting with different scenarios."""
    headers = get_auth_headers(client)

    # Create skill and employee
    skill_response = client.post(
        "/skills",
        json={"skill_name": "Cloud Security", "category": "Security"},
        headers=headers,
    )
    skill_id = skill_response.json()["data"]["id"]

    client.post(
        "/employees",
        json={
            "name": "Forecast Test User",
            "department": "Security",
            "role": "Security Engineer",
            "year_exp": 4,
        },
        headers=headers,
    )

    # Train models
    client.post("/ml/train", headers=headers)

    # Test all three scenarios
    scenarios = ["conservative", "balanced", "aggressive"]
    for scenario in scenarios:
        response = client.get(
            "/ml/forecast/Cloud Security",
            params={"months_ahead": 6, "scenario": scenario},
            headers=headers,
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["scenario"] == scenario
        assert "forecasts" in payload
        assert len(payload["forecasts"]) > 0


def test_turnover_risk_prediction(client):
    """Test turnover risk prediction for employees."""
    headers = get_auth_headers(client)

    # Create employee
    emp_response = client.post(
        "/employees",
        json={
            "name": "Turnover Test User",
            "department": "Engineering",
            "role": "Developer",
            "year_exp": 2,
            "performance_score": 65,
        },
        headers=headers,
    )
    emp_id = emp_response.json()["id"]

    # Train models
    client.post("/ml/train", headers=headers)

    # Get turnover risk
    response = client.get(f"/ml/turnover-risk/{emp_id}", headers=headers)
    assert response.status_code == 200
    payload = response.json()

    assert payload["employee_id"] == emp_id
    assert "risk_score" in payload
    assert "risk_level" in payload
    assert payload["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    assert 0 <= payload["risk_score"] <= 100


def test_hiring_trends_analytics(client):
    """Test hiring trends endpoint returns proper historical data."""
    headers = get_auth_headers(client)

    response = client.get("/analytics/hiring-trends", headers=headers)
    assert response.status_code == 200
    payload = response.json()

    assert "trends" in payload
    assert isinstance(payload["trends"], list)
    
    # Verify trend structure
    for trend in payload["trends"]:
        assert "month" in trend
        assert "hires" in trend
        assert "department" in trend or trend.get("all_departments") is not None


def test_file_upload_edge_cases(client):
    """Test edge cases for file uploads."""
    headers = get_auth_headers(client)

    # Test 1: Empty file
    empty_response = client.post(
        "/upload-resume",
        files={"file": ("empty.txt", b"", "text/plain")},
        headers=headers,
    )
    assert empty_response.status_code in [200, 400]  # Either returns empty result or error

    # Test 2: Large text resume
    large_resume = "Python AWS Kubernetes " * 500  # Large text
    large_response = client.post(
        "/upload-resume",
        files={"file": ("large_resume.txt", large_resume.encode(), "text/plain")},
        headers=headers,
    )
    assert large_response.status_code == 200

    # Test 3: Resume with multiple skills
    detailed_resume = """
    John Doe
    Senior Full-Stack Engineer
    
    Technical Skills:
    - Languages: Python, JavaScript, TypeScript, Java, Go
    - Frontend: React, Vue, Angular, Next.js
    - Backend: FastAPI, Django, Express, Spring Boot
    - Cloud: AWS, GCP, Azure, Kubernetes, Docker
    - Databases: PostgreSQL, MongoDB, Redis, DynamoDB
    - DevOps: CI/CD, Jenkins, GitHub Actions, GitLab CI
    - Data: TensorFlow, PyTorch, scikit-learn, pandas
    - Tools: Git, Linux, Nginx, Apache
    
    Experience: 8 years
    """
    detail_response = client.post(
        "/upload-resume",
        files={"file": ("detailed_resume.txt", detailed_resume.encode(), "text/plain")},
        headers=headers,
    )
    assert detail_response.status_code == 200
    detail_payload = detail_response.json()
    assert "mapped_skills" in detail_payload
    assert len(detail_payload["mapped_skills"]) > 0


def test_recommendation_with_decision_rationale(client):
    """Test that recommendations include decision scores and rationale."""
    headers = get_auth_headers(client)

    # Create full workflow
    skill_response = client.post(
        "/skills",
        json={"skill_name": "AI/ML", "category": "Data Science"},
        headers=headers,
    )
    skill_id = skill_response.json()["data"]["id"]

    # Create employees with varying proficiency
    emp1 = client.post(
        "/employees",
        json={
            "name": "ML Expert",
            "department": "Data",
            "role": "ML Engineer",
            "year_exp": 7,
        },
        headers=headers,
    ).json()["id"]

    emp2 = client.post(
        "/employees",
        json={
            "name": "Junior Developer",
            "department": "Data",
            "role": "Junior Dev",
            "year_exp": 1,
        },
        headers=headers,
    ).json()["id"]

    # Assign skills
    client.post(
        "/assign-skill",
        json={"employee_id": emp1, "skill_id": skill_id, "proficiency_level": 5},
        headers=headers,
    )
    client.post(
        "/assign-skill",
        json={"employee_id": emp2, "skill_id": skill_id, "proficiency_level": 2},
        headers=headers,
    )

    # Get recommendation
    response = client.get(
        "/recommendation/AI/ML",
        params={"required_count": 5},
        headers=headers,
    )
    assert response.status_code == 200
    payload = response.json()

    # Verify decision structure
    assert "hire_count" in payload
    assert "upskill_count" in payload
    assert "transfer_count" in payload
    assert "decision_scores" in payload
    assert "decision_rationale" in payload
    assert isinstance(payload["decision_rationale"], list)
    assert len(payload["decision_rationale"]) > 0


def test_pagination_employee_list(client):
    """Test pagination parameters for employee listing."""
    headers = get_auth_headers(client)

    # Create multiple employees
    for i in range(15):
        client.post(
            "/employees",
            json={
                "name": f"Employee {i}",
                "department": "Engineering",
                "role": "Developer",
                "year_exp": i % 5,
            },
            headers=headers,
        )

    # Test with pagination parameters
    response = client.get(
        "/employees",
        params={"skip": 0, "limit": 5},
        headers=headers,
    )
    
    # Should handle pagination gracefully
    assert response.status_code == 200


def test_skill_gap_with_department_scope(client):
    """Test skill gap analysis scoped to a department."""
    headers = get_auth_headers(client)

    # Create employees in different departments
    skill_id = client.post(
        "/skills",
        json={"skill_name": "DevOps", "category": "Infrastructure"},
        headers=headers,
    ).json()["data"]["id"]

    for dept in ["Engineering", "DevOps", "Data"]:
        emp = client.post(
            "/employees",
            json={
                "name": f"User in {dept}",
                "department": dept,
                "role": "Role",
                "year_exp": 2,
            },
            headers=headers,
        ).json()["id"]
        
        if dept == "DevOps":
            client.post(
                "/assign-skill",
                json={"employee_id": emp, "skill_id": skill_id, "proficiency_level": 3},
                headers=headers,
            )

    # Test skill gap with department scope
    response = client.post(
        "/skill-gap",
        json={
            "skill_name": "DevOps",
            "required_count": 4,
            "department": "DevOps",
        },
        headers=headers,
    )
    assert response.status_code == 200
    payload = response.json()
    assert "gap" in payload
    assert "coverage_ratio" in payload
