from io import BytesIO

import fitz
from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def make_pdf(text: str) -> bytes:
    document = fitz.open()
    page = document.new_page()
    if text:
        page.insert_text((72, 72), text)
    pdf_bytes = document.tobytes()
    document.close()
    return pdf_bytes


def test_analyze_valid_pdf() -> None:
    response = client.post(
        "/api/resume/analyze",
        files={
            "file": (
                "resume.pdf",
                BytesIO(make_pdf("Python developer with backend experience.")),
                "application/pdf",
            )
        },
    )

    assert response.status_code == 200
    assert response.json()["skills"] == ["Python"]
    assert response.json()["preview"]
    assert response.json()["quality"]["score"] >= 0
    assert response.json()["evidence"].startswith("Python developer")


def test_analyze_accepts_pdf_with_generic_browser_mime_type() -> None:
    response = client.post(
        "/api/resume/analyze",
        files={
            "file": (
                "resume.pdf",
                BytesIO(make_pdf("Python developer with backend experience.")),
                "application/octet-stream",
            )
        },
    )

    assert response.status_code == 200
    assert response.json()["skills"] == ["Python"]


def test_analyze_reports_detected_resume_sections() -> None:
    response = client.post(
        "/api/resume/analyze",
        files={
            "file": (
                "sections.pdf",
                BytesIO(
                    make_pdf(
                        "Summary\nPython developer\nExperience\nBackend role\n"
                        "Education\nComputer Science\nProjects\nSkillBridge\n"
                        "Certifications\nFastAPI course"
                    )
                ),
                "application/pdf",
            )
        },
    )

    assert response.status_code == 200
    assert response.json()["sections"] == {
        "summary": True,
        "education": True,
        "experience": True,
        "projects": True,
        "certifications": True,
    }


def test_analyze_rejects_non_pdf_file() -> None:
    response = client.post(
        "/api/resume/analyze",
        files={"file": ("resume.txt", b"Python developer", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Only PDF files are accepted."


def test_analyze_rejects_empty_pdf() -> None:
    response = client.post(
        "/api/resume/analyze",
        files={
            "file": (
                "empty.pdf",
                BytesIO(make_pdf("")),
                "application/pdf",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "The PDF does not contain any extractable text."


def test_analyze_rejects_pdf_larger_than_5_mb() -> None:
    response = client.post(
        "/api/resume/analyze",
        files={
            "file": (
                "large.pdf",
                b"0" * (5 * 1024 * 1024 + 1),
                "application/pdf",
            )
        },
    )

    assert response.status_code == 413
    assert response.json()["detail"] == "The PDF file must be 5 MB or smaller."


def test_analyze_extracts_expected_skills() -> None:
    resume_text = "\n".join(
        [
            "Python, Java, C, JavaScript, React, HTML, CSS, SQL, PostgreSQL,",
            "Django, FastAPI, REST APIs, Git, GitHub, Docker, Machine Learning,",
            "NLP, Excel, and data analysis.",
        ]
    )
    response = client.post(
        "/api/resume/analyze",
        files={
            "file": (
                "skills.pdf",
                BytesIO(make_pdf(resume_text)),
                "application/pdf",
            )
        },
    )

    assert response.status_code == 200
    assert response.json()["skills"] == [
        "Python",
        "Java",
        "C",
        "JavaScript",
        "React",
        "HTML",
        "CSS",
        "SQL",
        "PostgreSQL",
        "Django",
        "FastAPI",
        "REST APIs",
        "Git",
        "GitHub",
        "Docker",
        "Machine Learning",
        "NLP",
        "Excel",
        "data analysis",
    ]


def test_analyze_categorized_skills_and_snippets() -> None:
    text = (
        "Summary\nPython and FastAPI developer focused on REST APIs.\n"
        "Experience\nBuilt backend microservices with Docker and PostgreSQL.\n"
        "Education\nBS Computer Science\n"
        "Projects\nSkillBridge full stack career agent with React and SQL."
    )
    response = client.post(
        "/api/resume/analyze",
        files={"file": ("profile.pdf", BytesIO(make_pdf(text)), "application/pdf")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "categorized_skills" in data
    assert "Languages" in data["categorized_skills"]
    assert "Python" in data["categorized_skills"]["Languages"]
    assert "Frameworks & Libraries" in data["categorized_skills"]
    assert "section_content" in data
    assert "summary" in data["section_content"]
    assert data["verification_status"] == "unverified_document_extraction"
    assert "disclaimer" in data


def test_generate_resume_report_pdf() -> None:
    payload = {
        "target_role": "Python Developer",
        "skills": ["Python", "FastAPI", "SQL", "Git"],
        "readiness_score": 85,
        "missing_skills": ["Docker"],
        "matched_skills": ["Python", "SQL", "Git"],
        "accepted_improvements": [
            {
                "label": "Summary enhancement",
                "after": "Backend developer with hands-on Python and FastAPI experience.",
            }
        ],
        "job_match": {
            "skill_coverage_percentage": 75,
            "matched_skills": ["Python", "SQL"],
            "missing_skills": ["Docker"],
        },
    }
    response = client.post("/api/resume/report", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 500
    assert "skillbridge_report_Python_Developer.pdf" in response.headers["content-disposition"]
