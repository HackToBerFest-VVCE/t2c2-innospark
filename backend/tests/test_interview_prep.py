from fastapi.testclient import TestClient

from backend.app.interview_prep import generate_interview_plan
from backend.app.interview_prep import evaluate_interview_answer
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


def test_interview_plan_accepts_length_difficulty_and_focus() -> None:
    result = generate_interview_plan(
        ["Python"],
        "Python Developer",
        question_count=3,
        difficulty="Advanced",
        focus_skills=["FastAPI"],
        job_requirements=["Docker"],
    )

    assert result["question_count"] == 3
    assert result["difficulty"] == "Advanced"
    assert result["job_requirements_used"] == ["Docker"]
    assert result["priority_topics"][0] == "FastAPI"
    assert all(item["source"] == "SkillBridge practice question" for item in result["questions"])


def test_interview_answer_evaluation_is_explainable() -> None:
    result = evaluate_interview_answer(
        "How would you debug a slow Python endpoint?",
        "I would reproduce the issue, measure the endpoint, inspect SQL queries, add a test, and compare the result.",
        ["Use a concrete example."],
    )

    assert 0 <= result["score"] <= 100
    assert set(result["dimensions"]) == {"relevance", "clarity", "completeness", "technical_accuracy"}
    assert result["coaching_feedback"]


def test_interview_answer_rejects_empty_input() -> None:
    response = client.post(
        "/api/interview/evaluate",
        json={"question": "Explain Python.", "answer": ""},
    )

    assert response.status_code == 400
