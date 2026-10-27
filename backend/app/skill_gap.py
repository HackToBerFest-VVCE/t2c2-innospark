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

SKILL_LEARNING_GUIDANCE = {
    "Python": {
        "hours": 24,
        "prerequisites": [],
        "resources": ["https://docs.python.org/3/tutorial/"],
        "exercise": "Build a small command-line program that reads, validates, and transforms structured data.",
    },
    "SQL": {
        "hours": 18,
        "prerequisites": [],
        "resources": ["https://sqlbolt.com/"],
        "exercise": "Design a small relational schema and write queries for filtering, joins, and aggregation.",
    },
    "Git": {
        "hours": 8,
        "prerequisites": [],
        "resources": ["https://git-scm.com/book/en/v2"],
        "exercise": "Create a repository, work in a feature branch, resolve a merge conflict, and document the workflow.",
    },
    "JavaScript": {
        "hours": 24,
        "prerequisites": [],
        "resources": ["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"],
        "exercise": "Build a small interactive page using modules, DOM events, and form validation.",
    },
    "HTML": {
        "hours": 8,
        "prerequisites": [],
        "resources": ["https://developer.mozilla.org/en-US/docs/Learn/HTML"],
        "exercise": "Create an accessible semantic page with navigation, form controls, and structured content.",
    },
    "CSS": {
        "hours": 14,
        "prerequisites": ["HTML"],
        "resources": ["https://developer.mozilla.org/en-US/docs/Learn/CSS"],
        "exercise": "Build a responsive layout that works at mobile, tablet, and desktop breakpoints.",
    },
    "React": {
        "hours": 24,
        "prerequisites": ["JavaScript"],
        "resources": ["https://react.dev/learn"],
        "exercise": "Build a small component-based interface with state, events, and loading/error states.",
    },
    "Django": {
        "hours": 24,
        "prerequisites": ["Python"],
        "resources": ["https://docs.djangoproject.com/en/stable/intro/tutorial01/"],
        "exercise": "Create a Django CRUD feature with validation and a small set of automated tests.",
    },
    "FastAPI": {
        "hours": 16,
        "prerequisites": ["Python"],
        "resources": ["https://fastapi.tiangolo.com/tutorial/"],
        "exercise": "Build a typed API endpoint with validation, error handling, and an automated request test.",
    },
    "REST APIs": {
        "hours": 12,
        "prerequisites": [],
        "resources": ["https://developer.mozilla.org/en-US/docs/Glossary/REST"],
        "exercise": "Design and document CRUD endpoints for a small resource, including status codes and validation.",
    },
    "Docker": {
        "hours": 16,
        "prerequisites": ["Git"],
        "resources": ["https://docs.docker.com/get-started/"],
        "exercise": "Containerize a small application and document how to build, run, and test it.",
    },
    "Excel": {
        "hours": 14,
        "prerequisites": [],
        "resources": ["https://support.microsoft.com/en-us/excel"],
        "exercise": "Clean a small dataset and create a summary using formulas, filters, and a chart.",
    },
    "data analysis": {
        "hours": 20,
        "prerequisites": ["Python"],
        "resources": ["https://pandas.pydata.org/docs/getting_started/intro_tutorials/"],
        "exercise": "Analyze a public dataset and present three evidence-based findings with visualizations.",
    },
    "Machine Learning": {
        "hours": 30,
        "prerequisites": ["Python", "data analysis"],
        "resources": ["https://developers.google.com/machine-learning/crash-course"],
        "exercise": "Train, evaluate, and explain a baseline model with a reproducible data preparation pipeline.",
    },
    "NLP": {
        "hours": 24,
        "prerequisites": ["Python", "Machine Learning"],
        "resources": ["https://huggingface.co/learn/nlp-course/chapter1/1"],
        "exercise": "Build a small text classification experiment and report its data, metric, and limitations.",
    },
    "GitHub": {
        "hours": 6,
        "prerequisites": ["Git"],
        "resources": ["https://docs.github.com/en/get-started/start-your-journey"],
        "exercise": "Open a pull request with a clear description, review checklist, and linked issue.",
    },
}

ROLE_IMPORTANCE = {
    role: {skill: "core" for skill in details["required"]}
    | {skill: "optional" for skill in details["optional"]}
    for role, details in JOB_ROLE_SKILL_CATALOG.items()
}


def _normalize_skill(value: str) -> str:
    return " ".join(value.split()).casefold()


def analyze_skill_gap(
    user_skills: Iterable[str],
    target_role: str,
) -> dict[str, object]:
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
    missing_optional = [
        skill
        for skill in optional_skills
        if _normalize_skill(skill) not in normalized_user_skills
    ]
    coverage = round(len(matched_required) / len(required_skills) * 100, 2)
    missing_by_name = missing_required + missing_optional
    prioritized_gaps = []
    for order, skill in enumerate(missing_by_name):
        guidance = SKILL_LEARNING_GUIDANCE.get(
            skill,
            {"hours": 12, "prerequisites": [], "resources": [], "exercise": f"Complete a small practical {skill} exercise."},
        )
        importance = ROLE_IMPORTANCE[role_name][skill]
        priority = "High" if importance == "core" else "Medium"
        prerequisite_gaps = [
            prerequisite
            for prerequisite in guidance["prerequisites"]
            if _normalize_skill(prerequisite) not in normalized_user_skills
        ]
        if prerequisite_gaps and priority == "Medium":
            priority = "Low"
        prioritized_gaps.append(
            {
                "skill": skill,
                "importance": importance,
                "why_required": (
                    f"{skill} is listed as a required skill for {role_name}."
                    if importance == "core"
                    else f"{skill} is an optional skill that can strengthen your {role_name} profile."
                ),
                "priority": priority,
                "estimated_hours": guidance["hours"],
                "prerequisites": prerequisite_gaps,
                "resources": guidance["resources"],
                "exercise": guidance["exercise"],
                "catalog_order": order,
            }
        )
    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    prioritized_gaps.sort(key=lambda item: (priority_order[item["priority"]], item["catalog_order"]))
    for item in prioritized_gaps:
        item.pop("catalog_order")

    return {
        "target_role": role_name,
        "matched_required_skills": matched_required,
        "missing_required_skills": missing_required,
        "matched_optional_skills": matched_optional,
        "missing_optional_skills": missing_optional,
        "skill_coverage_percentage": coverage,
        "prioritized_gaps": prioritized_gaps,
    }
