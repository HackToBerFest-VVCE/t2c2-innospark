from collections.abc import Iterable

from backend.app.skill_gap import JOB_ROLE_SKILL_CATALOG, analyze_skill_gap


PROJECT_BLUEPRINTS = {
    "Python Developer": {
        "title": "Career Skills API",
        "problem": "Build an API that helps learners track skills, learning tasks, and progress toward a target role.",
        "stack": ("Python", "FastAPI", "SQL", "Git"),
        "stretch": "Add authentication and a small deployment guide.",
    },
    "Frontend Developer": {
        "title": "Accessible Career Dashboard",
        "problem": "Create a responsive dashboard that turns a learner's skills and goals into clear visual progress.",
        "stack": ("JavaScript", "HTML", "CSS", "React"),
        "stretch": "Add keyboard navigation and a performance budget report.",
    },
    "Data Analyst": {
        "title": "Career Progress Insights",
        "problem": "Turn learning activity data into an analysis with trends, recommendations, and a concise stakeholder report.",
        "stack": ("SQL", "Excel", "data analysis", "Python"),
        "stretch": "Add a reproducible notebook and explain one surprising finding.",
    },
    "Backend Developer": {
        "title": "Reliable Learning Progress API",
        "problem": "Design a versioned service for learning plans with validation, persistence, and clear error responses.",
        "stack": ("Python", "SQL", "REST APIs", "FastAPI"),
        "stretch": "Add containerization and an integration-test workflow.",
    },
    "Full Stack Developer": {
        "title": "Job Match Workspace",
        "problem": "Build a full-stack workspace that compares a candidate profile with a job description and visualizes the gaps.",
        "stack": ("JavaScript", "React", "Python", "SQL"),
        "stretch": "Add optimistic UI updates and an end-to-end test.",
    },
    "Machine Learning Engineer": {
        "title": "Explainable Skill Classifier",
        "problem": "Create a small, explainable classifier that maps text descriptions to career skill categories.",
        "stack": ("Python", "Machine Learning", "SQL", "Git"),
        "stretch": "Document evaluation limits and compare two simple baselines.",
    },
    "DevOps Engineer": {
        "title": "Learning Platform Delivery Pipeline",
        "problem": "Package a small service with repeatable checks, deployment configuration, and operational documentation.",
        "stack": ("Git", "Docker", "REST APIs", "Python"),
        "stretch": "Add health monitoring and a rollback runbook.",
    },
    "QA Automation Engineer": {
        "title": "Career App Quality Lab",
        "problem": "Build an automated test strategy for a career app, covering API behavior, validation, and user-critical flows.",
        "stack": ("Python", "JavaScript", "Git", "REST APIs"),
        "stretch": "Add a failure triage guide with reproducible bug reports.",
    },
}


def _validate_skills(skills: Iterable[str]) -> list[str]:
    if isinstance(skills, (str, bytes)) or not isinstance(skills, Iterable):
        raise ValueError("skills must be a list of skill names.")
    validated: list[str] = []
    for skill in skills:
        if not isinstance(skill, str) or not skill.strip():
            raise ValueError("skills must contain only non-empty strings.")
        if skill.strip() not in validated:
            validated.append(skill.strip())
    return validated


def generate_portfolio_project(user_skills: Iterable[str], target_role: str) -> dict:
    """Create a deterministic, role-specific portfolio project plan."""
    if not isinstance(target_role, str) or not target_role.strip():
        raise ValueError("target_role must be a non-empty string.")

    role_name = next(
        (
            role
            for role in JOB_ROLE_SKILL_CATALOG
            if role.casefold() == " ".join(target_role.split()).casefold()
        ),
        None,
    )
    if role_name is None:
        raise ValueError(f"Unknown target role: {target_role.strip()}.")

    skills = _validate_skills(user_skills)
    gap = analyze_skill_gap(skills, role_name)
    blueprint = PROJECT_BLUEPRINTS[role_name]
    missing = gap["missing_required_skills"]
    priority_skills = list(missing) + [
        skill for skill in blueprint["stack"] if skill not in missing
    ]
    priority_skills = priority_skills[:4]

    milestones = [
        {
            "phase": "Plan",
            "deliverable": f"Write a one-page scope and acceptance checklist for {blueprint['title']}.",
            "skills": priority_skills[:2],
        },
        {
            "phase": "Build",
            "deliverable": f"Implement the smallest working version using {', '.join(priority_skills)}.",
            "skills": priority_skills,
        },
        {
            "phase": "Prove",
            "deliverable": "Add tests, a README with setup steps, and one screenshot or sample output.",
            "skills": ["Git", "communication"],
        },
    ]
    resume_bullets = [
        f"Built {blueprint['title']} using {', '.join(blueprint['stack'])}.",
        f"Demonstrated {', '.join(priority_skills)} through a working, documented deliverable.",
    ]

    return {
        "target_role": role_name,
        "title": blueprint["title"],
        "problem_statement": blueprint["problem"],
        "recommended_stack": list(blueprint["stack"]),
        "priority_skills": priority_skills,
        "why_this_project": (
            f"It targets {len(missing)} missing required skill(s) from your role profile "
            f"while producing evidence you can show in a portfolio."
        ),
        "milestones": milestones,
        "resume_bullets": resume_bullets,
        "github_checklist": [
            "Add a clear README with setup, usage, and design decisions.",
            "Include tests and a reproducible sample or screenshot.",
            "Keep commits focused and explain trade-offs in the project notes.",
        ],
        "stretch_goal": blueprint["stretch"],
    }
