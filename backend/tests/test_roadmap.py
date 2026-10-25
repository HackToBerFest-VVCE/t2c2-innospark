from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.roadmap import generate_roadmap


client = TestClient(app)


def test_roadmap_has_30_tasks_grouped_into_four_weeks() -> None:
    response = client.post(
        "/api/roadmap/generate",
        json={"target_role": "Python Developer", "skills": []},
    )

    assert response.status_code == 200
    roadmap = response.json()
    assert len(roadmap["tasks"]) == 30
    assert [task["day"] for task in roadmap["tasks"]] == list(range(1, 31))
    assert len(roadmap["weekly_goals"]) == 4
    assert [goal["week"] for goal in roadmap["weekly_goals"]] == [1, 2, 3, 4]
    assert [len(week["tasks"]) for week in roadmap["weeks"]] == [7, 7, 7, 9]
    assert [
        task["day"]
        for week in roadmap["weeks"]
        for task in week["tasks"]
    ] == list(range(1, 31))
    assert roadmap["tasks"][-1]["topic"] == "Python Developer mini-project"


def test_roadmap_prioritizes_missing_required_skills() -> None:
    roadmap = generate_roadmap(["Python"], "Python Developer")

    assert roadmap["tasks"][0]["topic"].startswith("SQL")
    assert roadmap["tasks"][1]["topic"].startswith("Git")


def test_roadmap_rejects_unknown_role() -> None:
    response = client.post(
        "/api/roadmap/generate",
        json={"target_role": "Cloud Architect", "skills": []},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unknown target role: Cloud Architect."


def test_roadmap_rejects_daily_minutes_outside_limits() -> None:
    for daily_minutes in (14, 241):
        response = client.post(
            "/api/roadmap/generate",
            json={
                "target_role": "Python Developer",
                "skills": [],
                "daily_minutes": daily_minutes,
            },
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "daily_minutes must be between 15 and 240."


def test_roadmap_preserves_requested_daily_minutes() -> None:
    response = client.post(
        "/api/roadmap/generate",
        json={
            "target_role": "Python Developer",
            "skills": [],
            "daily_minutes": 90,
        },
    )

    assert response.status_code == 200
    assert response.json()["daily_minutes"] == 90
    assert {task["estimated_minutes"] for task in response.json()["tasks"]} == {90}


def test_roadmap_accepts_matcher_focus_skills() -> None:
    response = client.post(
        "/api/roadmap/generate",
        json={
            "target_role": "Python Developer",
            "skills": ["Python"],
            "focus_skills": ["Git"],
        },
    )

    assert response.status_code == 200
    assert response.json()["tasks"][0]["topic"].startswith("Git")
