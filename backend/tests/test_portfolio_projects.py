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


def test_project_includes_skill_gap_and_effort_metadata() -> None:
    result = generate_portfolio_project(
        ["Python"],
        "Python Developer",
        focus_skills=["FastAPI"],
        job_requirements=["Docker"],
        experience_level="beginner",
        daily_minutes=60,
    )

    assert result["priority_skills"][0:2] == ["FastAPI", "Docker"]
    assert result["difficulty"] == "Foundational"
    assert result["estimated_hours"] == 30
    assert result["milestones"][1]["prerequisites"] == ["Plan"]
    assert result["milestones"][1]["completion_criteria"]


def test_saved_project_can_be_updated_and_validated() -> None:
    response = client.post(
        "/api/portfolio/projects/save",
        json={"target_role": "Python Developer", "skills": ["Python"]},
    )

    assert response.status_code == 200
    project_id = response.json()["id"]
    updated = client.put(
        f"/api/portfolio/projects/{project_id}",
        json={"status": "in_progress", "github_url": "https://github.com/example/project"},
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "in_progress"
    invalid = client.put(
        f"/api/portfolio/projects/{project_id}",
        json={"github_url": "not-a-url"},
    )
    assert invalid.status_code == 400
    missing = client.put("/api/portfolio/projects/999999", json={"status": "completed"})
    assert missing.status_code == 404
