from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_profile_can_be_updated_and_read() -> None:
    response = client.put(
        "/api/profile",
        json={
            "name": "Jordan",
            "target_role": "Python Developer",
            "experience_level": "beginner",
            "daily_minutes": 60,
            "skills": ["Python"],
        },
    )

    assert response.status_code == 200
    assert response.json()["skills"] == ["Python"]
    assert client.get("/api/profile").json()["name"] == "Jordan"


def test_roadmap_progress_is_persisted() -> None:
    response = client.put(
        "/api/roadmap/progress",
        json={"target_role": "Python Developer", "completed_days": [1, 2, 2]},
    )

    assert response.status_code == 200
    assert response.json()["completed_days"] == [1, 2]
    assert client.get("/api/roadmap/progress/Python%20Developer").json() == {
        "completed_days": [1, 2]
    }


def test_roadmap_progress_history_records_persisted_snapshots() -> None:
    client.put(
        "/api/roadmap/progress",
        json={"target_role": "Python Developer", "completed_days": [1]},
    )
    client.put(
        "/api/roadmap/progress",
        json={"target_role": "Python Developer", "completed_days": [1, 2]},
    )

    response = client.get("/api/roadmap/progress/Python%20Developer/history")

    assert response.status_code == 200
    history = response.json()["history"]
    assert len(history) >= 2
    assert history[-1]["completed_days"] == [1, 2]
    assert history[-1]["created_at"]


def test_invalid_roadmap_progress_is_rejected() -> None:
    response = client.put(
        "/api/roadmap/progress",
        json={"target_role": "Python Developer", "completed_days": [31]},
    )

    assert response.status_code == 400


def test_unknown_roadmap_role_is_rejected() -> None:
    response = client.get("/api/roadmap/progress/Unknown%20Role")

    assert response.status_code == 400


def test_job_match_can_be_saved_and_listed() -> None:
    response = client.post(
        "/api/jobs/matches",
        json={
            "title": "Python Developer",
            "company": "Example Co",
            "description": "Build Python APIs and write SQL queries.",
            "result": {"skill_coverage_percentage": 50.0},
        },
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Python Developer"
    assert client.get("/api/jobs/matches").json()["matches"]
