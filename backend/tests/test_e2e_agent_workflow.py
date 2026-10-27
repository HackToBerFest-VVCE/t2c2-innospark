from io import BytesIO
import fitz
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def make_pdf(text: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), text, fontsize=10)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_complete_career_agent_workflow() -> None:
    # Step 1: Upload and analyze a PDF resume
    resume_content = (
        "Software Engineer with 2 years of experience.\n"
        "Proficient in Python, SQL, and Git.\n"
        "Built relational database queries and collaborated via Git."
    )
    analyze_resp = client.post(
        "/api/resume/analyze",
        files={"file": ("alex_resume.pdf", BytesIO(make_pdf(resume_content)), "application/pdf")},
    )
    assert analyze_resp.status_code == 200
    skills = analyze_resp.json()["skills"]
    assert "Python" in skills
    assert "SQL" in skills
    assert "Git" in skills

    # Step 2: Get explainable recommendations across 8 catalog roles
    rec_resp = client.post("/api/roles/recommend", json={"skills": skills})
    assert rec_resp.status_code == 200
    recommendations = rec_resp.json()["recommendations"]
    assert len(recommendations) >= 8
    # Python Developer has required: Python, SQL, Git -> 100% required coverage
    top_role = recommendations[0]
    assert top_role["target_role"] == "Python Developer"
    assert top_role["match_percentage"] >= 80.0

    # Step 3: Skill gap analysis for another target path (e.g. Machine Learning Engineer)
    gap_resp = client.post(
        "/api/skills/gap",
        json={"target_role": "Machine Learning Engineer", "skills": skills},
    )
    assert gap_resp.status_code == 200
    gap_data = gap_resp.json()
    assert "Machine Learning" in gap_data["missing_required_skills"]
    assert "Python" in gap_data["matched_required_skills"]

    # Step 4: Job Description Matching against real-world opportunity
    job_desc = (
        "Seeking a Machine Learning Engineer to design predictive models. "
        "Must be proficient with Python, SQL, and Machine Learning. "
        "Familiarity with NLP and Docker is highly preferred."
    )
    match_resp = client.post(
        "/api/jobs/match",
        json={
            "target_role": "Machine Learning Engineer",
            "skills": skills,
            "job_description": job_desc,
        },
    )
    assert match_resp.status_code == 200
    match_data = match_resp.json()
    assert "Python" in match_data["matched_skills"]
    assert "Machine Learning" in match_data["missing_skills"]
    assert len(match_data["matched_evidence"]) > 0
    suggested_focus = match_data["suggested_learning_skills"]
    assert "Machine Learning" in suggested_focus

    # Step 5: Transfer Job Matcher gaps into 30-Day Learning Roadmap
    roadmap_resp = client.post(
        "/api/roadmap/generate",
        json={
            "target_role": "Machine Learning Engineer",
            "skills": skills,
            "daily_minutes": 60,
            "focus_skills": suggested_focus,
        },
    )
    assert roadmap_resp.status_code == 200
    roadmap_data = roadmap_resp.json()
    assert len(roadmap_data["tasks"]) == 30
    assert len(roadmap_data["weeks"]) == 4
    # The first task should prioritize the focus skill from the job matcher
    assert "Machine Learning" in roadmap_data["tasks"][0]["topic"]

    # Step 6: Profile-grounded Career Mentor consultation
    mentor_resp = client.post(
        "/api/mentor/ask",
        json={
            "question": "How do I prepare for a Machine Learning Engineer interview?",
            "target_role": "Machine Learning Engineer",
            "skills": skills,
        },
    )
    assert mentor_resp.status_code == 200
    mentor_data = mentor_resp.json()
    assert "interview" in mentor_data["response"].lower()
    assert len(mentor_data["next_steps"]) >= 2
    assert "disclaimer" in mentor_data
