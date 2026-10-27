from collections.abc import Iterable

from backend.app.skill_gap import analyze_skill_gap


RESOURCE_LINKS = {
    "Python": "https://docs.python.org/3/tutorial/",
    "SQL": "https://sqlbolt.com/",
    "Git": "https://git-scm.com/book/en/v2",
    "JavaScript": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    "HTML": "https://developer.mozilla.org/en-US/docs/Learn/HTML",
    "CSS": "https://developer.mozilla.org/en-US/docs/Learn/CSS",
    "React": "https://react.dev/learn",
    "Django": "https://docs.djangoproject.com/en/stable/intro/tutorial01/",
    "FastAPI": "https://fastapi.tiangolo.com/tutorial/",
    "REST APIs": "https://developer.mozilla.org/en-US/docs/Glossary/REST",
    "Docker": "https://docs.docker.com/get-started/",
    "Excel": "https://support.microsoft.com/en-us/excel",
    "data analysis": "https://pandas.pydata.org/docs/getting_started/intro_tutorials/",
    "Machine Learning": "https://developers.google.com/machine-learning/crash-course",
    "NLP": "https://huggingface.co/learn/nlp-course/chapter1/1",
    "GitHub": "https://docs.github.com/en/get-started/start-your-journey",
    "PostgreSQL": "https://www.postgresql.org/docs/current/tutorial.html",
    "Java": "https://dev.java/learn/",
    "C": "https://en.cppreference.com/w/c",
}

ROLE_PROJECTS = {
    "Python Developer": "Build and document a small Python API that stores and serves a useful dataset.",
    "Frontend Developer": "Build a responsive role-relevant web interface with a small interactive feature.",
    "Data Analyst": "Produce a short analysis of a dataset with cleaned data, charts, and written findings.",
    "Backend Developer": "Design and document a production-grade backend service with database schema, CRUD endpoints, and authentication.",
    "Full Stack Developer": "Build and deploy an end-to-end full stack web application with reactive frontend, REST API, and database integration.",
    "Machine Learning Engineer": "Develop and evaluate an end-to-end ML model pipeline with dataset preprocessing, evaluation metrics, and API inference.",
    "DevOps Engineer": "Create an automated CI/CD pipeline with Docker containerization, linting, unit testing, and deployment automation.",
    "QA Automation Engineer": "Design and execute an automated testing framework with unit tests, API integration tests, and test coverage reporting.",
}

WEEK_LENGTHS = (7, 7, 7, 9)


def _validate_daily_minutes(daily_minutes: int) -> None:
    if isinstance(daily_minutes, bool) or not isinstance(daily_minutes, int):
        raise ValueError("daily_minutes must be an integer between 15 and 240.")
    if not 15 <= daily_minutes <= 240:
        raise ValueError("daily_minutes must be between 15 and 240.")


def _learning_topic(skill: str, day: int) -> tuple[str, str, str, str]:
    resource = RESOURCE_LINKS.get(skill)
    resource_text = f" Use {resource}." if resource else ""
    if day == 1:
        return (
            f"{skill} fundamentals",
            f"Study the core concepts of {skill} and take concise notes.{resource_text}",
            f"Write a one-page summary of three {skill} concepts.",
            "Learn the core vocabulary and complete a guided introduction.",
        )
    if day == 2:
        return (
            f"{skill} guided practice",
            f"Follow a beginner exercise focused on {skill}.{resource_text}",
            f"Complete one small {skill} exercise and record its result.",
            "Follow a guided exercise, then repeat it without the walkthrough.",
        )
    return (
        f"{skill} applied practice",
        f"Apply {skill} to a small feature and review the result.{resource_text}",
        f"Commit or save a working {skill} example with a short explanation.",
        "Build a small working example and explain the design choices.",
    )


def _make_task(
    day: int,
    topic: str,
    activity: str,
    minutes: int,
    deliverable: str,
    skill: str,
    difficulty: str,
    completion_criteria: str,
    resource: str | None = None,
) -> dict[str, int | str | None]:
    return {
        "day": day,
        "topic": topic,
        "learning_activity": activity,
        "estimated_minutes": minutes,
        "deliverable": deliverable,
        "skill": skill,
        "difficulty": difficulty,
        "completion_criteria": completion_criteria,
        "resource": resource,
    }


def generate_roadmap(
    user_skills: Iterable[str],
    target_role: str,
    daily_minutes: int = 60,
    focus_skills: Iterable[str] | None = None,
) -> dict[str, object]:
    """Generate a deterministic 30-day learning plan for a catalog role."""
    _validate_daily_minutes(daily_minutes)
    gap = analyze_skill_gap(user_skills, target_role)
    role_name = str(gap["target_role"])
    missing_required = list(gap["missing_required_skills"])
    matched_required = list(gap["matched_required_skills"])
    matched_optional = list(gap["matched_optional_skills"])

    prioritized_skills = [
        item["skill"] for item in gap.get("prioritized_gaps", [])
    ] or missing_required
    if focus_skills is not None:
        if isinstance(focus_skills, (str, bytes)):
            raise ValueError("focus_skills must be a list of skill names.")
        requested_focus = list(focus_skills)
        for skill in requested_focus:
            if not isinstance(skill, str) or not skill.strip():
                raise ValueError("focus_skills must contain only non-empty strings.")
        prioritized_skills = requested_focus + prioritized_skills
        prioritized_skills = list(dict.fromkeys(prioritized_skills))
    if not prioritized_skills:
        prioritized_skills = matched_required or matched_optional

    project_description = ROLE_PROJECTS.get(
        role_name,
        f"Build and document an end-to-end portfolio project demonstrating your core skills in {role_name}."
    )

    tasks: list[dict[str, object]] = []
    for day in range(1, 31):
        if day <= len(prioritized_skills):
            skill = prioritized_skills[day - 1]
        elif day <= 21 and prioritized_skills:
            skill = prioritized_skills[(day - len(prioritized_skills) - 1) % len(prioritized_skills)]
        else:
            skill = role_name

        if day == 30:
            task = _make_task(
                day,
                f"{role_name} mini-project",
                f"Complete and polish the final mini-project: {project_description}",
                daily_minutes,
                "Publish or package the project with a README, screenshots or sample output, and next steps.",
                role_name,
                "Advanced",
                "The project runs, is tested, documented, and ready to demonstrate.",
            )
        elif day in (7, 14, 21):
            week_number = day // 7
            task = _make_task(
                day,
                f"Week {week_number} review",
                f"Review the week's {skill} work and combine the exercises into one coherent practice task.",
                daily_minutes,
                f"Submit a checklist and a working review exercise covering {skill}.",
                skill,
                "Intermediate",
                f"Complete the review exercise and record what you can explain about {skill}.",
                RESOURCE_LINKS.get(skill),
            )
        else:
            topic, activity, deliverable, completion_criteria = _learning_topic(skill, day)
            task = _make_task(
                day,
                topic,
                activity,
                daily_minutes,
                deliverable,
                skill,
                "Foundational" if day <= 6 else "Intermediate",
                completion_criteria,
                RESOURCE_LINKS.get(skill),
            )
        tasks.append(task)

    weekly_goals = [
        {"week": 1, "goal": f"Build foundations in {', '.join(prioritized_skills[:2]) or role_name}."},
        {"week": 2, "goal": f"Practice applying {', '.join(prioritized_skills[:3]) or role_name} in small exercises."},
        {"week": 3, "goal": f"Integrate role skills and prepare the {role_name} mini-project."},
        {"week": 4, "goal": "Complete, test, document, and present the final mini-project."},
    ]
    weeks = []
    task_start = 0
    for week_number, week_length in enumerate(WEEK_LENGTHS, start=1):
        week_tasks = tasks[task_start : task_start + week_length]
        weeks.append(
            {
                "week": week_number,
                "goal": weekly_goals[week_number - 1]["goal"],
                "tasks": week_tasks,
            }
        )
        task_start += week_length

    return {
        "target_role": role_name,
        "daily_minutes": daily_minutes,
        "weekly_goals": weekly_goals,
        "weeks": weeks,
        "tasks": tasks,
        "final_mini_project": project_description,
        "focus_skills": prioritized_skills,
    }
