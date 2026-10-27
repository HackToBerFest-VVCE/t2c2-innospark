from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.skill_gap import analyze_skill_gap


client = TestClient(app)


def test_full_match_has_full_coverage() -> None:
    result = analyze_skill_gap(
        ["Python", "SQL", "Git", "FastAPI"],
        "Python Developer",
    )

    assert result["target_role"] == "Python Developer"
    assert result["matched_required_skills"] == ["Python", "SQL", "Git"]
    assert result["missing_required_skills"] == []
    assert result["matched_optional_skills"] == ["FastAPI"]
    assert result["missing_optional_skills"] == ["Django", "REST APIs", "Docker"]
    assert result["skill_coverage_percentage"] == 100.0
    assert result["prioritized_gaps"][0]["skill"] == "Django"


def test_partial_match_reports_missing_required_skills() -> None:
    result = analyze_skill_gap(["Python", "Django"], "Python Developer")

    assert result["matched_required_skills"] == ["Python"]
    assert result["missing_required_skills"] == ["SQL", "Git"]
    assert result["matched_optional_skills"] == ["Django"]
    assert result["skill_coverage_percentage"] == 33.33


def test_missing_skills_have_zero_coverage() -> None:
    result = analyze_skill_gap([], "Python Developer")

    assert result["matched_required_skills"] == []
    assert result["missing_required_skills"] == ["Python", "SQL", "Git"]
    assert result["skill_coverage_percentage"] == 0.0


def test_matching_is_case_insensitive_and_ignores_extra_whitespace() -> None:
    result = analyze_skill_gap(
        [" python ", "sQL", "  git  "],
        " python   developer ",
    )

    assert result["matched_required_skills"] == ["Python", "SQL", "Git"]
    assert result["missing_required_skills"] == []
    assert result["skill_coverage_percentage"] == 100.0


def test_unknown_role_is_rejected_by_function() -> None:
    try:
        analyze_skill_gap(["Python"], "Cloud Architect")
    except ValueError as exc:
        assert str(exc) == "Unknown target role: Cloud Architect."
    else:
        raise AssertionError("Expected an unknown role to raise ValueError.")


def test_skill_gap_endpoint_returns_analysis() -> None:
    response = client.post(
        "/api/skills/gap",
        json={
            "target_role": "Python Developer",
            "skills": ["Python", "SQL", "Git"],
        },
    )

    assert response.status_code == 200
    assert response.json()["skill_coverage_percentage"] == 100.0


def test_skill_gap_endpoint_rejects_unknown_role() -> None:
    response = client.post(
        "/api/skills/gap",
        json={"target_role": "Cloud Architect", "skills": ["Python"]},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unknown target role: Cloud Architect."


def test_skill_gap_endpoint_rejects_empty_skill_names() -> None:
    response = client.post(
        "/api/skills/gap",
        json={"target_role": "Python Developer", "skills": ["Python", ""]},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "skills must contain only non-empty strings."


def test_prioritized_gaps_rank_required_skills_before_optional_skills() -> None:
    result = analyze_skill_gap(["Python"], "Python Developer")

    gaps = result["prioritized_gaps"]
    assert [item["skill"] for item in gaps[:2]] == ["SQL", "Git"]
    assert all(item["priority"] == "High" for item in gaps[:2])
    assert gaps[-1]["priority"] in {"Medium", "Low"}


def test_prioritized_gap_contains_transparent_learning_guidance() -> None:
    result = analyze_skill_gap([], "Frontend Developer")

    javascript = next(item for item in result["prioritized_gaps"] if item["skill"] == "JavaScript")
    assert javascript["importance"] == "core"
    assert javascript["why_required"] == "JavaScript is listed as a required skill for Frontend Developer."
    assert javascript["estimated_hours"] > 0
    assert javascript["prerequisites"] == []
    assert javascript["resources"]
    assert javascript["exercise"]
