from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.recommendations import recommend_roles


client = TestClient(app)


def test_recommendations_cover_eight_catalog_roles() -> None:
    results = recommend_roles(["Python", "SQL", "Git"])

    assert len(results) >= 8
    assert results[0]["target_role"] == "Python Developer"
    assert results[0]["match_percentage"] == 80.0


def test_recommendations_endpoint_is_deterministic() -> None:
    payload = {"skills": ["Python", "SQL", "Git"]}

    first = client.post("/api/roles/recommend", json=payload)
    second = client.post("/api/roles/recommend", json=payload)

    assert first.status_code == 200
    assert first.json() == second.json()
