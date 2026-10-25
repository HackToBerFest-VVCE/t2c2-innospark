from collections.abc import Iterable


JOB_ROLE_SKILL_CATALOG = {
    "Python Developer": {
        "required": ("Python", "SQL", "Git"),
        "optional": ("Django", "FastAPI", "REST APIs", "Docker"),
    },
    "Frontend Developer": {
        "required": ("JavaScript", "HTML", "CSS"),
        "optional": ("React", "Git", "GitHub"),
    },
    "Data Analyst": {
        "required": ("SQL", "Excel", "data analysis"),
        "optional": ("Python", "Machine Learning", "NLP"),
    },
    "Backend Developer": {
        "required": ("Python", "SQL", "REST APIs"),
        "optional": ("FastAPI", "Django", "Docker", "Git"),
    },
    "Full Stack Developer": {
        "required": ("JavaScript", "HTML", "CSS", "SQL"),
        "optional": ("React", "Python", "Git", "GitHub"),
    },
    "Machine Learning Engineer": {
        "required": ("Python", "SQL", "Machine Learning"),
        "optional": ("NLP", "Docker", "Git", "FastAPI"),
    },
    "DevOps Engineer": {
        "required": ("Git", "Docker", "REST APIs"),
        "optional": ("Python", "GitHub", "FastAPI", "SQL"),
    },
    "QA Automation Engineer": {
        "required": ("Python", "Git", "JavaScript"),
        "optional": ("SQL", "Docker", "REST APIs", "GitHub"),
    },
}


def _normalize_skill(value: str) -> str:
    return " ".join(value.split()).casefold()


def analyze_skill_gap(
    user_skills: Iterable[str],
    target_role: str,
) -> dict[str, str | list[str] | float]:
    """Compare a user's skills with the requirements for a catalog role."""
    if not isinstance(target_role, str) or not target_role.strip():
        raise ValueError("target_role must be a non-empty string.")

    role_name = next(
        (
            catalog_role
            for catalog_role in JOB_ROLE_SKILL_CATALOG
            if _normalize_skill(catalog_role) == _normalize_skill(target_role)
        ),
        None,
    )
    if role_name is None:
        raise ValueError(f"Unknown target role: {target_role.strip()}.")

    if isinstance(user_skills, (str, bytes)) or not isinstance(user_skills, Iterable):
        raise ValueError("skills must be a list of skill names.")

    normalized_user_skills: set[str] = set()
    for skill in user_skills:
        if not isinstance(skill, str) or not skill.strip():
            raise ValueError("skills must contain only non-empty strings.")
        normalized_user_skills.add(_normalize_skill(skill))

    role_skills = JOB_ROLE_SKILL_CATALOG[role_name]
    required_skills = list(role_skills["required"])
    optional_skills = list(role_skills["optional"])
    matched_required = [
        skill
        for skill in required_skills
        if _normalize_skill(skill) in normalized_user_skills
    ]
    missing_required = [
        skill
        for skill in required_skills
        if _normalize_skill(skill) not in normalized_user_skills
    ]
    matched_optional = [
        skill
        for skill in optional_skills
        if _normalize_skill(skill) in normalized_user_skills
    ]
    coverage = round(len(matched_required) / len(required_skills) * 100, 2)

    return {
        "target_role": role_name,
        "matched_required_skills": matched_required,
        "missing_required_skills": missing_required,
        "matched_optional_skills": matched_optional,
        "skill_coverage_percentage": coverage,
    }
