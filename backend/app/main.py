import re

import fitz
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.app.roadmap import generate_roadmap
from backend.app.job_matcher import match_job_description
from backend.app.mentor import answer_mentor_question
from backend.app.recommendations import recommend_roles
from backend.app.skill_gap import analyze_skill_gap

app = FastAPI(title="SkillBridge AI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_RESUME_SIZE = 5 * 1024 * 1024
PREVIEW_LENGTH = 500

SKILL_PATTERNS = {
    "Python": r"\bpython\b",
    "Java": r"\bjava\b",
    "C": r"(?<!\w)c(?!\w)",
    "JavaScript": r"\bjavascript\b",
    "React": r"\breact\b",
    "HTML": r"\bhtml\b",
    "CSS": r"\bcss\b",
    "SQL": r"\bsql\b",
    "PostgreSQL": r"\bpostgresql\b",
    "Django": r"\bdjango\b",
    "FastAPI": r"\bfastapi\b",
    "REST APIs": r"\brest\s+apis?\b",
    "Git": r"\bgit\b",
    "GitHub": r"\bgithub\b",
    "Docker": r"\bdocker\b",
    "Machine Learning": r"\bmachine\s+learning\b",
    "NLP": r"\bnlp\b",
    "Excel": r"\bexcel\b",
    "data analysis": r"\bdata\s+analysis\b",
}


class SkillGapRequest(BaseModel):
    target_role: str
    skills: list[str]


class RoadmapRequest(BaseModel):
    target_role: str
    skills: list[str]
    daily_minutes: int = 60
    focus_skills: list[str] | None = None


class RecommendationsRequest(BaseModel):
    skills: list[str]


class JobMatchRequest(BaseModel):
    job_description: str
    skills: list[str]
    target_role: str | None = None


class MentorRequest(BaseModel):
    question: str
    target_role: str
    skills: list[str]


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy", "project": "SkillBridge AI"}


@app.post("/api/skills/gap")
def skill_gap_analysis(request: SkillGapRequest) -> dict[str, str | list[str] | float]:
    try:
        return analyze_skill_gap(request.skills, request.target_role)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/roadmap/generate")
def roadmap_generation(request: RoadmapRequest) -> dict:
    try:
        return generate_roadmap(
            request.skills,
            request.target_role,
            request.daily_minutes,
            request.focus_skills,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/roles/recommend")
def role_recommendations(request: RecommendationsRequest) -> dict[str, list[dict]]:
    try:
        return {"recommendations": recommend_roles(request.skills)}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/jobs/match")
def job_description_match(request: JobMatchRequest) -> dict[str, object]:
    try:
        return match_job_description(
            request.job_description,
            request.skills,
            request.target_role,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/mentor/ask")
def mentor_question(request: MentorRequest) -> dict[str, object]:
    try:
        return answer_mentor_question(
            request.question,
            request.skills,
            request.target_role,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def extract_skills(text: str) -> list[str]:
    """Return skills found by the transparent keyword dictionary."""
    return [
        skill
        for skill, pattern in SKILL_PATTERNS.items()
        if re.search(pattern, text, flags=re.IGNORECASE)
    ]


def extract_pdf_text(pdf_bytes: bytes) -> str:
    """Extract and normalize text from a PDF held in memory."""
    try:
        document = fitz.open(stream=pdf_bytes, filetype="pdf")
    except fitz.FileDataError as exc:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid PDF.",
        ) from exc

    try:
        text = "\n".join(page.get_text() for page in document)
    finally:
        document.close()

    return " ".join(text.split())


@app.post("/api/resume/analyze")
async def analyze_resume(file: UploadFile = File(...)) -> dict[str, list[str] | str]:
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are accepted.",
        )

    pdf_bytes = await file.read()
    if len(pdf_bytes) > MAX_RESUME_SIZE:
        raise HTTPException(
            status_code=413,
            detail="The PDF file must be 5 MB or smaller.",
        )

    text = extract_pdf_text(pdf_bytes)
    if not text:
        raise HTTPException(
            status_code=400,
            detail="The PDF does not contain any extractable text.",
        )

    return {
        "skills": extract_skills(text),
        "preview": text[:PREVIEW_LENGTH],
    }