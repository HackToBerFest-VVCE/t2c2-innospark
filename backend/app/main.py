import re

import fitz
from fastapi import FastAPI, File, HTTPException, UploadFile, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.app.roadmap import generate_roadmap
from backend.app.job_matcher import match_job_description
from backend.app.mentor import answer_mentor_question
from backend.app.profile_store import (
    APPLICATION_STATUSES,
    create_application,
    delete_application,
    get_profile,
    get_roadmap_progress,
    list_applications,
    list_job_matches,
    save_job_match,
    save_roadmap_progress,
    update_application,
    update_profile,
)
from backend.app.portfolio_projects import generate_portfolio_project
from backend.app.interview_prep import generate_interview_plan
from backend.app.recommendations import recommend_roles
from backend.app.skill_gap import analyze_skill_gap

app = FastAPI(title="SkillBridge AI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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


class ProfileRequest(BaseModel):
    name: str = ""
    target_role: str = "Python Developer"
    experience_level: str = "exploring"
    daily_minutes: int = 60
    skills: list[str] = []


class RoadmapProgressRequest(BaseModel):
    target_role: str
    completed_days: list[int]


class SaveJobMatchRequest(BaseModel):
    title: str
    company: str = ""
    description: str
    result: dict


class ResumeReportRequest(BaseModel):
    target_role: str = "Python Developer"
    skills: list[str] = []
    readiness_score: int = 0
    missing_skills: list[str] = []
    matched_skills: list[str] = []
    accepted_improvements: list[dict] = []
    job_match: dict | None = None


class PortfolioProjectRequest(BaseModel):
    target_role: str
    skills: list[str]


class InterviewPrepRequest(BaseModel):
    target_role: str
    skills: list[str]


class ApplicationRequest(BaseModel):
    company: str
    job_title: str
    job_url: str = ""
    status: str = "saved"
    deadline: str = ""
    applied_date: str = ""
    follow_up_date: str = ""
    notes: str = ""


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


@app.post("/api/portfolio/projects")
def portfolio_project_generation(request: PortfolioProjectRequest) -> dict:
    try:
        return generate_portfolio_project(request.skills, request.target_role)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/interview/prepare")
def interview_preparation(request: InterviewPrepRequest) -> dict:
    try:
        return generate_interview_plan(request.skills, request.target_role)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _validate_application(request: ApplicationRequest) -> dict[str, str]:
    values = request.model_dump()
    if len(request.company.strip()) < 2:
        raise HTTPException(status_code=400, detail="company must contain at least 2 characters.")
    if len(request.job_title.strip()) < 2:
        raise HTTPException(status_code=400, detail="job_title must contain at least 2 characters.")
    if request.status not in APPLICATION_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"status must be one of: {', '.join(APPLICATION_STATUSES)}.",
        )
    for field in ("job_url", "deadline", "applied_date", "follow_up_date", "notes"):
        if len(values[field]) > 2_000:
            raise HTTPException(status_code=400, detail=f"{field} must be 2,000 characters or fewer.")
    values["company"] = request.company.strip()
    values["job_title"] = request.job_title.strip()
    return values


@app.get("/api/applications")
def applications_list(status: str | None = None) -> dict[str, list[dict]]:
    if status is not None and status not in APPLICATION_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"status must be one of: {', '.join(APPLICATION_STATUSES)}.",
        )
    return {"applications": list_applications(status)}


@app.post("/api/applications")
def application_create(request: ApplicationRequest) -> dict:
    return create_application(_validate_application(request))


@app.put("/api/applications/{application_id}")
def application_update(application_id: int, request: ApplicationRequest) -> dict:
    updated = update_application(application_id, _validate_application(request))
    if updated is None:
        raise HTTPException(status_code=404, detail="Application not found.")
    return updated


@app.delete("/api/applications/{application_id}")
def application_delete(application_id: int) -> dict[str, bool]:
    if not delete_application(application_id):
        raise HTTPException(status_code=404, detail="Application not found.")
    return {"deleted": True}


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


@app.get("/api/profile")
def profile_details() -> dict:
    return get_profile()


@app.put("/api/profile")
def profile_update(request: ProfileRequest) -> dict:
    if not 15 <= request.daily_minutes <= 240:
        raise HTTPException(
            status_code=400,
            detail="daily_minutes must be between 15 and 240.",
        )
    try:
        return update_profile(request.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/roadmap/progress/{target_role}")
def roadmap_progress(target_role: str) -> dict[str, list[int]]:
    return {"completed_days": get_roadmap_progress(target_role)}


@app.put("/api/roadmap/progress")
def roadmap_progress_update(request: RoadmapProgressRequest) -> dict[str, list[int]]:
    if any(day < 1 or day > 30 for day in request.completed_days):
        raise HTTPException(
            status_code=400,
            detail="completed_days must contain values from 1 through 30.",
        )
    return {
        "completed_days": save_roadmap_progress(
            request.target_role,
            request.completed_days,
        )
    }


@app.get("/api/jobs/matches")
def saved_job_matches() -> dict[str, list[dict]]:
    return {"matches": list_job_matches()}


@app.post("/api/jobs/matches")
def save_job_match_result(request: SaveJobMatchRequest) -> dict:
    if len(request.title.strip()) < 2:
        raise HTTPException(status_code=400, detail="title must not be empty.")
    if len(request.description.strip()) < 20:
        raise HTTPException(
            status_code=400,
            detail="description must contain at least 20 characters.",
        )
    return save_job_match(
        request.title.strip(),
        request.company.strip(),
        request.description,
        request.result,
    )


SKILL_CATEGORIES = {
    "Languages": ["Python", "Java", "C", "JavaScript", "HTML", "CSS", "SQL"],
    "Frameworks & Libraries": ["React", "FastAPI", "Django", "Machine Learning", "NLP"],
    "Databases & Analytics": ["SQL", "PostgreSQL", "Excel", "data analysis"],
    "DevOps & Developer Tools": ["Git", "GitHub", "Docker", "REST APIs"],
}


def categorize_skills(detected_skills: list[str]) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {cat: [] for cat in SKILL_CATEGORIES}
    skill_set = set(detected_skills)
    for category, cat_skills in SKILL_CATEGORIES.items():
        for s in cat_skills:
            if s in skill_set and s not in result[category]:
                result[category].append(s)
    return {k: v for k, v in result.items() if v}


def extract_section_snippets(text: str) -> dict[str, str]:
    snippets: dict[str, str] = {}
    keywords = [
        ("summary", r"(?:summary|profile|objective|about\s+me)"),
        ("experience", r"(?:work\s+experience|professional\s+experience|experience|employment)"),
        ("education", r"(?:education|academic\s+background|academics)"),
        ("projects", r"(?:technical\s+projects?|projects?|portfolio)"),
        ("certifications", r"(?:certifications?|courses?|training)"),
    ]
    for key, pattern in keywords:
        match = re.search(rf"(?i)\b{pattern}\b[:\s\-]*([^\n\r]+(?:\n[^\n\r]+){{0,4}})", text)
        if match:
            clean_snippet = " ".join(match.group(1).split())
            if len(clean_snippet) > 220:
                clean_snippet = clean_snippet[:220] + "..."
            snippets[key] = clean_snippet
        else:
            snippets[key] = ""
    return snippets


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


def analyze_resume_content(
    pdf_bytes: bytes,
) -> tuple[str, list[dict[str, str | int]], dict[str, object], dict[str, bool]]:
    try:
        document = fitz.open(stream=pdf_bytes, filetype="pdf")
    except fitz.FileDataError as exc:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid PDF.",
        ) from exc

    page_text: list[tuple[int, str]] = []
    try:
        for page_number, page in enumerate(document, start=1):
            page_text.append((page_number, " ".join(page.get_text().split())))
    finally:
        document.close()

    text = " ".join(value for _, value in page_text).strip()
    if not text:
        raise HTTPException(
            status_code=400,
            detail="The PDF does not contain any extractable text.",
        )

    evidence: list[dict[str, str | int]] = []
    for skill in extract_skills(text):
        pattern = re.compile(rf"(?i).{{0,80}}{re.escape(skill)}.{{0,100}}")
        for page_number, page_value in page_text:
            match = pattern.search(page_value)
            if match:
                evidence.append(
                    {
                        "skill": skill,
                        "evidence": " ".join(match.group(0).split()),
                        "page": page_number,
                    }
                )
                break

    sections = {
        "summary": bool(re.search(r"\b(summary|profile|objective)\b", text, re.I)),
        "projects": bool(re.search(r"\b(projects?|portfolio)\b", text, re.I)),
        "education": bool(re.search(r"\beducation\b", text, re.I)),
        "experience": bool(re.search(r"\b(experience|employment)\b", text, re.I)),
    }
    measurable = len(re.findall(r"\b\d+%|\b\d+\+?\s*(?:users|projects|months|years)\b", text, re.I))
    quality_score = min(
        100,
        25 + sum(15 for present in sections.values() if present) + min(measurable * 5, 20),
    )
    improvements = [
        f"Add a {label} section." for label, present in sections.items() if not present
    ]
    if measurable == 0:
        improvements.append("Add measurable outcomes such as percentages, scale, or time saved.")
    sections_detected = {
        "summary": sections["summary"],
        "education": sections["education"],
        "experience": sections["experience"],
        "projects": sections["projects"],
        "certifications": bool(re.search(r"\b(certifications?|courses?|training)\b", text, re.I)),
    }
    quality = {
        "score": quality_score,
        "strengths": [
            f"Detected {len(evidence)} skill evidence item(s).",
            "Resume includes measurable outcomes." if measurable else "Resume text was successfully extracted.",
        ],
        "improvements": improvements[:4],
    }
    return text, evidence, quality, sections_detected


@app.post("/api/resume/analyze")
async def analyze_resume(file: UploadFile = File(...)) -> dict[str, object]:
    # Some browsers report files selected from synced folders as octet-stream
    # (or omit the MIME type). The PDF parser remains the source of truth.
    accepted_content_types = {None, "", "application/octet-stream", "application/pdf"}
    filename_is_pdf = (file.filename or "").lower().endswith(".pdf")
    if file.content_type not in accepted_content_types and not filename_is_pdf:
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

    text, evidence, quality, sections = analyze_resume_content(pdf_bytes)
    detected_skills = extract_skills(text)
    categorized = categorize_skills(detected_skills)
    section_snippets = extract_section_snippets(text)

    return {
        "skills": detected_skills,
        "categorized_skills": categorized,
        "preview": text[:PREVIEW_LENGTH],
        "evidence": evidence[0]["evidence"] if evidence else "",
        "evidence_items": evidence,
        "quality": quality,
        "sections": sections,
        "section_content": section_snippets,
        "verification_status": "unverified_document_extraction",
        "disclaimer": "Skills and sections are parsed directly from document text using pattern matching; they are not independently verified.",
    }


@app.post("/api/resume/report")
def generate_resume_report_pdf(request: ResumeReportRequest) -> Response:
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)

    # Header Banner
    page.draw_rect(fitz.Rect(36, 36, 559, 100), color=None, fill=(0.04, 0.08, 0.16))
    page.insert_text((50, 65), "SkillBridge AI - Career Readiness & Intelligence Report", fontsize=15, color=(0.33, 0.84, 0.91))
    page.insert_text((50, 85), f"Target Role: {request.target_role}   |   Readiness Score: {request.readiness_score}%", fontsize=11, color=(0.9, 0.93, 0.98))

    # Section 1: Verification & Methodology
    page.insert_text((36, 122), "1. Verification Notice & Scoring Methodology", fontsize=11, fontname="helv", color=(0.04, 0.08, 0.16))
    notice = (
        "This report is generated from in-memory parsing of document text. Identified skills and "
        "experiences represent unverified candidate claims extracted from the resume. Readiness scores "
        "measure alignment with standardized role requirements, not hiring probability or ATS guarantees."
    )
    page.insert_textbox(fitz.Rect(36, 130, 559, 175), notice, fontsize=9, color=(0.35, 0.4, 0.48))

    # Section 2: Extracted Skills & Category Breakdown
    page.insert_text((36, 185), f"2. Extracted Technical Skills ({len(request.skills)})", fontsize=11, fontname="helv", color=(0.04, 0.08, 0.16))
    skills_text = ", ".join(request.skills) if request.skills else "No skills identified"
    page.insert_textbox(fitz.Rect(36, 195, 559, 240), f"Parsed Skills: {skills_text}", fontsize=9, color=(0.1, 0.15, 0.25))

    # Section 3: Target Role Alignment
    page.insert_text((36, 250), f"3. Target Role Alignment: {request.target_role}", fontsize=11, fontname="helv", color=(0.04, 0.08, 0.16))
    matched_text = ", ".join(request.matched_skills) if request.matched_skills else "None yet"
    missing_text = ", ".join(request.missing_skills) if request.missing_skills else "All core requirements satisfied"
    role_alignment = f"Matched Core Requirements:\n{matched_text}\n\nPriority Skill Gaps (To Learn):\n{missing_text}"
    page.insert_textbox(fitz.Rect(36, 260, 559, 330), role_alignment, fontsize=9, color=(0.1, 0.15, 0.25))

    # Section 4: Resume Improvement Recommendations
    page.insert_text((36, 345), "4. Resume Improvement Recommendations (PAR Framework)", fontsize=11, fontname="helv", color=(0.04, 0.08, 0.16))
    if request.accepted_improvements:
        imp_lines = []
        for item in request.accepted_improvements[:4]:
            label = item.get("label", "Improvement")
            after = item.get("after", "")
            imp_lines.append(f"• [{label}]: {after}")
        imp_text = "\n\n".join(imp_lines)
    else:
        imp_text = (
            "• Use strong action verbs at the start of each bullet.\n"
            "• Include truthful, verifiable metrics where available (latency, users, throughput).\n"
            "• Replace generic duty descriptions with Problem-Action-Result (PAR) statements."
        )
    page.insert_textbox(fitz.Rect(36, 355, 559, 470), imp_text, fontsize=8.5, color=(0.15, 0.2, 0.3))

    # Section 5: Job Match Summary
    if request.job_match:
        page.insert_text((36, 485), "5. Job Description Match Analysis", fontsize=11, fontname="helv", color=(0.04, 0.08, 0.16))
        jm_cov = request.job_match.get("skill_coverage_percentage", 0)
        jm_matched = ", ".join(request.job_match.get("matched_skills", []))
        jm_missing = ", ".join(request.job_match.get("missing_skills", []))
        jm_text = f"Analyzed Posting Fit: {jm_cov}% match.\nMatched Skills: {jm_matched}\nJob-Specific Gaps: {jm_missing}"
        page.insert_textbox(fitz.Rect(36, 495, 559, 560), jm_text, fontsize=9, color=(0.1, 0.15, 0.25))

    page.insert_text((36, 810), "SkillBridge AI — Deterministic Career Navigator | Hacktoberfest InnoSpark", fontsize=8, color=(0.5, 0.55, 0.65))

    pdf_bytes = doc.tobytes()
    doc.close()
    filename = f"skillbridge_report_{request.target_role.replace(' ', '_')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
