from fastapi.testclient import TestClient

from backend.app.intelligence import build_intelligence
from backend.app.main import app


client = TestClient(app)


def test_intelligence_prioritizes_first_incomplete_task() -> None:
    result = build_intelligence(
        ["Python"],
        "Python Developer",
        60,
        [1],
        [],
        [],
        [],
    )

    assert result["adaptive_learning"]["next_task"]["day"] == 2
    assert result["adaptive_learning"]["completed_count"] == 1
    assert result["market_insights"]["sample_size"] == 0


def test_intelligence_changes_role_recommendation_context() -> None:
    python_result = build_intelligence(
        ["Python", "SQL"],
        "Python Developer",
        60,
        [],
        [],
        [],
        [],
    )
    frontend_result = build_intelligence(
        ["Python", "SQL"],
        "Frontend Developer",
        60,
        [],
        [],
        [],
        [],
    )

    assert python_result["target_role"] != frontend_result["target_role"]
    assert python_result["skill_gap"]["target_role"] == "Python Developer"
    assert frontend_result["skill_gap"]["target_role"] == "Frontend Developer"


def test_market_insights_are_limited_to_supplied_saved_samples() -> None:
    result = build_intelligence(
        ["Python"],
        "Python Developer",
        60,
        [],
        [
            {
                "result": {
                    "detected_required_skills": ["Python", "SQL"],
                    "detected_preferred_skills": ["Docker"],
                }
            }
        ],
        [],
        [],
    )

    assert result["market_insights"]["sample_size"] == 1
    assert result["market_insights"]["source"].startswith("Saved job descriptions")
    assert "not live labor-market data" in result["market_insights"]["limitations"]


def test_intelligence_endpoint_rejects_invalid_progress() -> None:
    response = client.post(
        "/api/intelligence/overview",
        json={
            "skills": ["Python"],
            "target_role": "Python Developer",
            "daily_minutes": 60,
            "completed_days": [31],
        },
    )

    assert response.status_code == 400
