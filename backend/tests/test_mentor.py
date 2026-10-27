from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_mentor_uses_profile_and_returns_next_steps() -> None:
    response = client.post(
        "/api/mentor/ask",
        json={
            "question": "What should I learn next?",
            "target_role": "Python Developer",
            "skills": ["Python"],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["skill_coverage_percentage"] == 33.33
    assert "SQL" in body["response"]
    assert body["next_steps"]
    assert "disclaimer" in body


def test_mentor_interview_intent_returns_tailored_advice() -> None:
    response = client.post(
        "/api/mentor/ask",
        json={
            "question": "How do I prepare for a Python Developer interview?",
            "target_role": "Python Developer",
            "skills": ["Python"],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert "interview" in body["response"].lower()
    assert len(body["next_steps"]) >= 2


def test_mentor_portfolio_intent_returns_project_advice() -> None:
    response = client.post(
        "/api/mentor/ask",
        json={
            "question": "What portfolio project should I build on GitHub?",
            "target_role": "Python Developer",
            "skills": ["Python"],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert "project" in body["response"].lower() or "portfolio" in body["response"].lower()
    assert len(body["next_steps"]) >= 2


def test_mentor_rejects_empty_question() -> None:
    response = client.post(
        "/api/mentor/ask",
        json={
            "question": "   ",
            "target_role": "Python Developer",
            "skills": ["Python"],
        },
    )

    assert response.status_code == 400
    assert "question must be a non-empty string" in response.json()["detail"]
