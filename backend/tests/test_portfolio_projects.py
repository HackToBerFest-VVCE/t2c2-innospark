from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.portfolio_projects import generate_portfolio_project


client = TestClient(app)


def test_project_prioritizes_missing_required_skills() -> None:
    result = generate_portfolio_project(["Python"], "Python Developer")

    assert result["target_role"] == "Python Developer"
    assert result["priority_skills"][:2] == ["SQL", "Git"]
    assert result["milestones"][0]["phase"] == "Plan"


def test_project_is_deterministic() -> None:
    skills = ["Python", "SQL"]
    assert generate_portfolio_project(skills, "Python Developer") == generate_portfolio_project(
        skills, "Python Developer"
    )


def test_project_endpoint_returns_portfolio_plan() -> None:
    response = client.post(
        "/api/portfolio/projects",
        json={"target_role": "Frontend Developer", "skills": ["JavaScript"]},
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Accessible Career Dashboard"
    assert response.json()["priority_skills"][0] == "HTML"


def test_project_endpoint_rejects_unknown_role() -> None:
    response = client.post(
        "/api/portfolio/projects",
        json={"target_role": "Cloud Architect", "skills": ["Python"]},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unknown target role: Cloud Architect."
