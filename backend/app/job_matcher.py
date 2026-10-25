import re
from collections.abc import Iterable

from backend.app.skill_gap import JOB_ROLE_SKILL_CATALOG, analyze_skill_gap


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
        expected = mentioned

    matched = [skill for skill in expected if _normalize(skill) in profile]
    missing_required = [
        skill for skill in required if _normalize(skill) not in profile
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
    coverage = round(len(matched_required) / len(required) * 100, 2) if required else 0.0
    return {
        "target_role": role_name,
        "detected_required_skills": required,
        "detected_optional_skills": optional,
        "matched_skills": matched,
        "missing_skills": missing_required,
        "missing_optional_skills": missing_optional,
        "matched_evidence": evidence,
        "skill_coverage_percentage": coverage,
        "suggested_learning_skills": (missing_required + missing_optional)[:5],
    }
