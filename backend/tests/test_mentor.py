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
