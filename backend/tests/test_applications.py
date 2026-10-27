from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_application_crud_and_status_filter() -> None:
    created = client.post(
        "/api/applications",
        json={
            "company": "Acme Labs",
            "job_title": "Python Developer",
            "status": "saved",
            "notes": "Review the API requirements.",
        },
    )
    assert created.status_code == 200
    application_id = created.json()["id"]

    updated = client.put(
        f"/api/applications/{application_id}",
        json={
            "company": "Acme Labs",
            "job_title": "Python Developer",
            "status": "applied",
            "applied_date": "2026-10-27",
        },
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "applied"

    filtered = client.get("/api/applications?status=applied")
    assert filtered.status_code == 200
    assert any(item["id"] == application_id for item in filtered.json()["applications"])

    deleted = client.delete(f"/api/applications/{application_id}")
    assert deleted.status_code == 200
    assert deleted.json() == {"deleted": True}


def test_application_validation() -> None:
    response = client.post(
        "/api/applications",
        json={"company": "A", "job_title": "Developer", "status": "unknown"},
    )
    assert response.status_code == 400
    assert "company" in response.json()["detail"]


def test_application_missing_record_returns_404() -> None:
    response = client.delete("/api/applications/999999")
    assert response.status_code == 404


def test_resume_optimization_and_version_management() -> None:
    optimize = client.post(
        "/api/resume/optimize",
        json={
            "target_role": "Python Developer",
            "skills": ["Python", "FastAPI", "SQL"],
            "job_description": "We need a Python Developer with FastAPI and SQL experience, testing and cloud skills.",
            "resume_summary": "Python developer with SQL and API experience.",
        },
    )
    assert optimize.status_code == 200
    assert optimize.json()["score"] >= 0
    assert optimize.json()["suggestions"]

    created = client.post(
        "/api/resume/versions",
        json={
            "target_role": "Python Developer",
            "version_name": "Python API Resume",
            "summary": "Aligned to job description",
            "score": 88,
            "result": optimize.json(),
        },
    )
    assert created.status_code == 200
    version_id = created.json()["id"]

    fetched = client.get("/api/resume/versions?target_role=Python Developer")
    assert fetched.status_code == 200
    assert any(item["id"] == version_id for item in fetched.json()["versions"])

    deleted = client.delete(f"/api/resume/versions/{version_id}")
    assert deleted.status_code == 200
    assert deleted.json() == {"deleted": True}
