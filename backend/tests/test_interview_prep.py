from fastapi.testclient import TestClient

from backend.app.interview_prep import generate_interview_plan
from backend.app.main import app


client = TestClient(app)


def test_interview_plan_prioritizes_missing_skills() -> None:
    result = generate_interview_plan(["Python"], "Python Developer")

    assert result["priority_topics"] == ["SQL", "Git"]
    assert len(result["questions"]) == 6
    assert result["questions"][0]["evaluation_criteria"]


def test_interview_plan_is_deterministic_for_catalog_roles() -> None:
    first = generate_interview_plan(["Git"], "DevOps Engineer")
    second = generate_interview_plan(["Git"], "DevOps Engineer")

    assert first == second
    assert len(first["questions"]) == 5


def test_interview_endpoint_rejects_unknown_role() -> None:
    response = client.post(
        "/api/interview/prepare",
        json={"target_role": "Cloud Architect", "skills": ["Python"]},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unknown target role: Cloud Architect."


def test_interview_endpoint_returns_plan() -> None:
    response = client.post(
        "/api/interview/prepare",
        json={"target_role": "Data Analyst", "skills": ["SQL"]},
    )

    assert response.status_code == 200
    assert response.json()["target_role"] == "Data Analyst"
    assert response.json()["questions"][0]["category"] == "SQL"
