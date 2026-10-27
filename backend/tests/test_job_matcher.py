from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.job_matcher import match_job_description


client = TestClient(app)


DESCRIPTION = (
    "We need a Python developer who can build REST APIs with FastAPI, "
    "write SQL queries, and collaborate with Git."
)


def test_job_match_reports_evidence_and_missing_skills() -> None:
    result = match_job_description(DESCRIPTION, ["Python", "Git"])

    assert result["detected_required_skills"] == [
        "Python",
        "SQL",
        "Git",
        "FastAPI",
        "REST APIs",
    ]
    assert result["matched_skills"] == ["Python", "Git"]
    assert result["missing_skills"] == ["SQL", "FastAPI", "REST APIs"]
    assert result["skill_coverage_percentage"] == 40.0
    assert result["matched_evidence"][0]["skill"] == "Python"


def test_job_match_can_scope_skills_to_a_role() -> None:
    response = client.post(
        "/api/jobs/match",
        json={
            "target_role": "Python Developer",
            "job_description": DESCRIPTION,
            "skills": ["Python", "SQL"],
        },
    )

    assert response.status_code == 200
    assert response.json()["missing_skills"] == ["Git"]


def test_job_match_rejects_short_descriptions() -> None:
    response = client.post(
        "/api/jobs/match",
        json={"job_description": "too short", "skills": []},
    )

    assert response.status_code == 400
    assert "at least 20 characters" in response.json()["detail"]


def test_job_match_returns_explainable_weighted_requirements() -> None:
    result = match_job_description(
        "Required Python and SQL experience. Preferred Docker. Strong communication.",
        ["Python"],
        "Python Developer",
    )

    assert result["required_skill_coverage_percentage"] == 50.0
    assert result["preferred_skill_coverage_percentage"] == 0.0
    assert result["final_match_score"] == 35.0
    assert result["scoring_explanation"].startswith("Final score = 70%")
    details = {item["skill"]: item for item in result["requirement_details"]}
    assert details["Python"]["status"] == "matched"
    assert details["SQL"]["status"] == "missing"
    assert details["Docker"]["importance"] == "Preferred"
    assert "communication" in result["soft_skills"]


def test_job_match_does_not_score_without_profile_evidence() -> None:
    result = match_job_description(DESCRIPTION, [])

    assert result["profile_data_available"] is False
    assert result["final_match_score"] is None
    assert result["required_skill_coverage_percentage"] is None
