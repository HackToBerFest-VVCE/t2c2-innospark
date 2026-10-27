import re
from collections.abc import Iterable

from backend.app.skill_gap import JOB_ROLE_SKILL_CATALOG, analyze_skill_gap

SOFT_SKILLS = (
    "communication",
    "collaboration",
    "teamwork",
    "problem solving",
    "leadership",
    "time management",
)

PARTIAL_ALIASES = {
    "REST APIs": ("rest", "api"),
    "GitHub": ("git",),
    "Machine Learning": ("ml",),
    "data analysis": ("analytics",),
}

SKILL_CATEGORIES = {
    "language": {"Python", "Java", "C", "JavaScript", "HTML", "CSS", "SQL"},
    "framework": {"React", "FastAPI", "Django", "Machine Learning", "NLP"},
    "tool": {"Git", "GitHub", "Docker"},
    "database": {"PostgreSQL", "SQL", "Excel"},
}


def _normalize(value: str) -> str:
    return " ".join(value.split()).casefold()


def _validate_inputs(job_description: str, user_skills: Iterable[str]) -> list[str]:
    if not isinstance(job_description, str) or len(job_description.strip()) < 20:
        raise ValueError("job_description must contain at least 20 characters.")
    if len(job_description) > 20_000:
        raise ValueError("job_description must be 20,000 characters or fewer.")
    if isinstance(user_skills, (str, bytes)) or not isinstance(user_skills, Iterable):
        raise ValueError("skills must be a list of skill names.")
    cleaned: list[str] = []
    for skill in user_skills:
        if not isinstance(skill, str) or not skill.strip():
            raise ValueError("skills must contain only non-empty strings.")
        cleaned.append(skill)
    return cleaned


def _known_skills() -> list[str]:
    return list(
        dict.fromkeys(
            skill
            for role in JOB_ROLE_SKILL_CATALOG.values()
            for group in ("required", "optional")
            for skill in role[group]
        )
    )


def _evidence_for_skill(description: str, skill: str) -> str | None:
    pattern = re.compile(rf"(?i).{{0,90}}{re.escape(skill)}.{{0,120}}")
    match = pattern.search(description)
    return " ".join(match.group(0).split()) if match else None


def _is_preferred_requirement(description: str, skill: str) -> bool:
    evidence = _evidence_for_skill(description, skill)
    if not evidence:
        return False
    return any(
        marker in evidence.casefold()
        for marker in ("preferred", "nice to have", "bonus", "good to have", "plus")
    )


def _importance(skill: str, required: list[str], optional: list[str]) -> str:
    if skill in required:
        return "Critical" if required.index(skill) < max(1, len(required) // 2) else "High"
    if skill in optional:
        return "Preferred"
    return "Relevant"


def _skill_status(skill: str, profile: set[str], description: str) -> tuple[str, str]:
    normalized = _normalize(skill)
    if normalized in profile:
        return "matched", "This skill is explicitly present in the current profile."
    aliases = PARTIAL_ALIASES.get(skill, ())
    if any(alias in profile for alias in aliases):
        return "partially_matched", "A related profile skill was found, but the exact requirement should be verified."
    if _evidence_for_skill(description, skill):
        return "missing", "The requirement appears in the posting but is not present in the current profile."
    return "needs_verification", "The posting contains this requirement, but available profile evidence is insufficient."


def _skill_category(skill: str) -> str:
    for category, skills in SKILL_CATEGORIES.items():
        if skill in skills:
            return category
    return "technology"


def _requirement_details(
    description: str,
    expected: list[str],
    required: list[str],
    optional: list[str],
    profile: set[str],
) -> list[dict[str, object]]:
    return [
        {
            "skill": skill,
            "category": _skill_category(skill),
            "importance": _importance(skill, required, optional),
            "status": status,
            "explanation": explanation,
            "evidence": _evidence_for_skill(description, skill),
        }
        for skill in expected
        for status, explanation in [_skill_status(skill, profile, description)]
    ]


def match_job_description(
    job_description: str,
    user_skills: Iterable[str],
    target_role: str | None = None,
) -> dict[str, object]:
    """Compare known skills mentioned in a job description with a user profile."""
    cleaned_skills = _validate_inputs(job_description, user_skills)
    description = " ".join(job_description.split())
    known = _known_skills()
    mentioned = [
        skill
        for skill in known
        if re.search(rf"(?i)(?<!\w){re.escape(skill)}(?!\w)", description)
    ]
    profile = {_normalize(skill) for skill in cleaned_skills}

    if target_role is not None and target_role.strip():
        gap = analyze_skill_gap(cleaned_skills, target_role)
        role_name = str(gap["target_role"])
        role = JOB_ROLE_SKILL_CATALOG[role_name]
        mentioned_normalized = {_normalize(item) for item in mentioned}
        required = [
            skill for skill in role["required"] if _normalize(skill) in mentioned_normalized
        ]
        optional = [
            skill for skill in role["optional"] if _normalize(skill) in mentioned_normalized
        ]
        expected = required + optional
    else:
        role_name = None
        required = mentioned
        optional = []
        optional = [
            skill for skill in mentioned
            if _is_preferred_requirement(description, skill)
        ]
        required = [skill for skill in mentioned if skill not in optional]
        expected = required + optional

    profile_available = bool(profile)

    matched = [skill for skill in expected if _normalize(skill) in profile]
    requirement_details = _requirement_details(description, expected, required, optional, profile)
    missing_required = [
        skill for skill in required
        if next(item for item in requirement_details if item["skill"] == skill)["status"] != "matched"
    ]
    missing_optional = [
        skill for skill in optional if _normalize(skill) not in profile
    ]
    evidence = [
        {"skill": skill, "evidence": _evidence_for_skill(description, skill)}
        for skill in expected
        if _evidence_for_skill(description, skill)
    ]
    matched_required = [
        skill for skill in required if _normalize(skill) in profile
    ]
    partial_required = [
        item["skill"] for item in requirement_details
        if item["status"] == "partially_matched"
    ]
    required_weight = len(required) * 2
    required_points = len(matched_required) * 2 + len(partial_required)
    coverage = round(required_points / required_weight * 100, 2) if required_weight and profile_available else None
    matched_optional = [skill for skill in optional if _normalize(skill) in profile]
    optional_coverage = round(len(matched_optional) / len(optional) * 100, 2) if optional and profile_available else None
    final_score = round((coverage or 0) * 0.7 + (optional_coverage or 0) * 0.3, 2) if profile_available else None
    experience_requirements = [
        " ".join(line.split())
        for line in re.findall(
            r"(?im)^[^.\n]*(?:\d+\+?\s+years?|degree|bachelor|master|qualification|experience)[^.\n]*",
            description,
        )
    ][:8]
    soft_skills = [
        skill for skill in SOFT_SKILLS
        if re.search(rf"(?i)(?<!\w){re.escape(skill)}(?!\w)", description)
    ]
    recommendations = [
        {
            "skill": item["skill"],
            "reason": f"{item['importance']} requirement classified as {item['status'].replace('_', ' ')}.",
        }
        for item in requirement_details
        if item["status"] != "matched"
    ][:5]
    return {
        "target_role": role_name,
        "detected_required_skills": required,
        "detected_optional_skills": optional,
        "matched_skills": matched,
        "missing_skills": missing_required,
        "missing_optional_skills": missing_optional,
        "matched_evidence": evidence,
        "skill_coverage_percentage": coverage if coverage is not None else 0.0,
        "required_skill_coverage_percentage": coverage,
        "preferred_skill_coverage_percentage": optional_coverage,
        "final_match_score": final_score,
        "profile_data_available": profile_available,
        "scoring_explanation": "Final score = 70% weighted required-skill coverage + 30% preferred-skill coverage. Matched requirements earn full credit; partially matched requirements earn half credit.",
        "requirement_details": requirement_details,
        "experience_requirements": experience_requirements,
        "soft_skills": soft_skills,
        "recommendations": recommendations,
        "suggested_learning_skills": (missing_required + missing_optional)[:5],
    }
