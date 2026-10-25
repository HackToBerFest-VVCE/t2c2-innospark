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
    assert response.json()["preview"].startswith("Python developer")


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
