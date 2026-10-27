from datetime import date, timedelta
import re
from typing import Any

from backend.app.roadmap import generate_roadmap
from backend.app.skill_gap import analyze_skill_gap


WORKFLOW_STEPS = (
    {
        "id": "review-requirements",
        "title": "Review job requirements",
        "destination": "matcher",
    },
    {
        "id": "tailor-resume",
        "title": "Review resume fit and suggested edits",
        "destination": "resume",
    },
    {
        "id": "address-skill-gaps",
        "title": "Review the highest-priority skill gaps",
        "destination": "gap",
    },
    {
        "id": "choose-project",
        "title": "Select relevant portfolio evidence",
        "destination": "portfolio",
    },
    {
        "id": "practice-interview",
        "title": "Practice role-specific interview questions",
        "destination": "interview",
    },
    {
        "id": "review-application",
        "title": "Review and update the application record",
        "destination": "applications",
    },
)

ACTION_STATUSES = ("accepted", "dismissed", "postponed", "completed")


def _action_key(kind: str, identifier: str) -> str:
    slug = re.sub(r"[^a-z0-9-]+", "-", identifier.casefold()).strip("-")
    return f"{kind}:{slug}"


def _parse_date(value: Any) -> date | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        return None


def _make_action(
    action_id: str,
    action_type: str,
    title: str,
    reason: str,
    benefit: str,
    destination: str,
    effort_minutes: int | None,
    priority: int,
    due_date: str | None = None,
) -> dict[str, Any]:
    return {
        "id": action_id,
        "type": action_type,
        "title": title,
        "reason": reason,
        "expected_benefit": benefit,
        "destination": destination,
        "effort_minutes": effort_minutes,
        "priority": priority,
        "due_date": due_date,
    }


def build_copilot_dashboard(
    profile: dict[str, Any],
    applications: list[dict[str, Any]],
    completed_days: list[int],
    saved_matches: list[dict[str, Any]],
    projects: list[dict[str, Any]],
    interviews: list[dict[str, Any]],
    action_states: dict[str, str] | None = None,
    reminders_enabled: bool = False,
    workflows: list[dict[str, Any]] | None = None,
    today: date | None = None,
    custom_tasks: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    current_day = today or date.today()
    role = str(profile.get("target_role") or "Python Developer")
    skills = profile.get("skills") or []
    daily_minutes = int(profile.get("daily_minutes") or 60)
    gap = analyze_skill_gap(skills, role)
    roadmap = generate_roadmap(skills, role, daily_minutes)
    completed = set(completed_days)
    next_task = next(
        (task for task in roadmap["tasks"] if task["day"] not in completed),
        None,
    )
    states = action_states or {}
    actions: list[dict[str, Any]] = []

    priority_gaps = gap.get("prioritized_gaps", []) if skills else []
    for index, item in enumerate(priority_gaps[:3]):
        skill = str(item["skill"])
        hours = item.get("estimated_hours")
        effort = int(hours * 60) if isinstance(hours, (int, float)) else None
        actions.append(
            _make_action(
                _action_key("skill", f"{role}-{skill}"),
                "skill",
                f"Start learning {skill}",
                str(item.get("why_required") or f"{skill} is a priority gap for {role}."),
                f"Improve coverage of a role requirement with an explicit learning plan.",
                "gap",
                effort,
                100 - index * 4,
            )
        )

    if next_task and skills:
        task_minutes = next_task.get("estimated_minutes")
        if not isinstance(task_minutes, int):
            task_minutes = max(15, daily_minutes)
        actions.append(
            _make_action(
                _action_key("roadmap", f"{role}-{next_task['day']}"),
                "roadmap",
                str(next_task.get("title") or f"Complete roadmap task {next_task['day']}"),
                f"This is the first incomplete task in the existing {role} roadmap.",
                f"Continue the saved roadmap without regenerating or resetting it.",
                "roadmap",
                task_minutes,
                90,
            )
        )

    window_end = current_day + timedelta(days=7)
    reminders: list[dict[str, Any]] = []
    for application in applications:
        if application.get("status") in ("rejected", "withdrawn", "offer"):
            continue
        identifier = str(application.get("id", ""))
        title = str(application.get("job_title") or "job application")
        company = str(application.get("company") or "")
        for field, action_type, label, priority in (
            ("follow_up_date", "follow-up", "Review follow-up", 120),
            ("deadline", "deadline", "Review application deadline", 115),
        ):
            due = _parse_date(application.get(field))
            if due and current_day - timedelta(days=30) <= due <= window_end:
                overdue = due < current_day
                title_prefix = (
                    "Review overdue follow-up"
                    if overdue and field == "follow_up_date"
                    else "Review overdue deadline"
                    if overdue
                    else label
                )
                action = _make_action(
                    _action_key(action_type, identifier),
                    action_type,
                    f"{title_prefix}: {title}",
                    (
                        f"This saved application has an overdue {field.replace('_', ' ')} dated {due.isoformat()}."
                        if overdue
                        else f"This saved application has a {field.replace('_', ' ')} on {due.isoformat()}."
                    ),
                    "Keep the application plan current; no message will be sent automatically.",
                    "applications",
                    10,
                    priority + 5 if overdue else priority,
                    due.isoformat(),
                )
                if company:
                    action["context"] = company
                actions.append(action)
                reminders.append(action)

        if application.get("status") == "interview":
            actions.append(
                _make_action(
                    _action_key("interview", identifier),
                    "interview",
                    f"Practice for {title}",
                    "This application is marked as an interview in the saved application tracker.",
                    f"Use the existing interview practice feature for {role}.",
                    "interview",
                    30,
                    110,
                )
            )

    low_match = next(
        (
            match
            for match in saved_matches
            if isinstance((match.get("result") or {}).get("final_match_score"), (int, float))
            and float(match["result"]["final_match_score"]) < 60
        ),
        None,
    )
    if low_match:
        match_result = low_match.get("result") or {}
        missing = match_result.get("missing_skills") or []
        job_name = str(low_match.get("title") or "a saved job")
        actions.append(
            _make_action(
                _action_key("job-match", str(low_match.get("id", job_name))),
                "job-match",
                f"Review resume alignment for {job_name}",
                (
                    f"The saved comparison scored below 60%; it lists {', '.join(missing[:3])} "
                    "as missing requirements."
                    if missing
                    else "The saved job comparison scored below 60%; review its requirements before tailoring."
                ),
                "Check whether your existing evidence can be presented more clearly; do not add unsupported claims.",
                "saved",
                15,
                105,
            )
        )

    incomplete_project = next(
        (project for project in projects if project.get("status") != "completed"),
        None,
    )
    if incomplete_project:
        project_title = str(incomplete_project.get("title") or "your saved project")
        actions.append(
            _make_action(
                _action_key("portfolio", str(incomplete_project.get("id", project_title))),
                "portfolio",
                f"Continue {project_title}",
                "A saved, incomplete portfolio project can provide evidence for role-relevant skills.",
                "Build demonstrable evidence without claiming the project is complete.",
                "portfolio",
                None,
                70,
            )
        )
    elif priority_gaps:
        actions.append(
            _make_action(
                _action_key("portfolio", role),
                "portfolio",
                "Plan a portfolio project for your priority gaps",
                "No incomplete saved project was found, while your role analysis still identifies skill gaps.",
                "Turn learning into portfolio evidence when you choose to start a project.",
                "portfolio",
                None,
                60,
            )
        )

    weakest_interview = min(
        (
            session
            for session in interviews
            if isinstance(session.get("score"), (int, float))
        ),
        key=lambda session: float(session["score"]),
        default=None,
    )
    if weakest_interview and float(weakest_interview["score"]) < 70:
        actions.append(
            _make_action(
                _action_key("interview-session", str(weakest_interview.get("id", "latest"))),
                "interview",
                "Review feedback from a lower-scoring mock interview",
                "A saved mock interview score was below 70%; use its feedback to pick a practice topic.",
                "Focus preparation on a recorded area for improvement.",
                "interview",
                20,
                65,
            )
        )

    actions.sort(
        key=lambda action: (
            -action["priority"],
            action["due_date"] or "9999-12-31",
            action["id"],
        )
    )
    for action in actions:
        action["status"] = states.get(action["id"], "suggested")

    active_actions = [
        action
        for action in actions
        if action["status"] not in ("dismissed", "completed", "postponed")
    ]
    daily_plan: list[dict[str, Any]] = []
    remaining_minutes = daily_minutes
    for action in active_actions:
        effort = action["effort_minutes"]
        if effort is None or effort <= remaining_minutes:
            daily_plan.append(action)
            if effort is not None:
                remaining_minutes -= effort
        if len(daily_plan) >= 3:
            break
    weekly_plan = active_actions[:5]
    for task in custom_tasks or []:
        plan_task = {
            "id": f"plan:{task['id']}",
            "type": "custom",
            "title": task["title"],
            "reason": task.get("description") or "A task you added to your personal Copilot plan.",
            "expected_benefit": "Move forward at your own pace with a task you chose.",
            "destination": task.get("destination") or "roadmap",
            "effort_minutes": task.get("estimated_minutes"),
            "priority": 50,
            "due_date": None,
            "status": "completed" if task.get("completed") else "accepted",
        }
        if not task.get("completed") and task.get("period") == "daily":
            effort = plan_task["effort_minutes"]
            if effort is None or effort <= remaining_minutes:
                daily_plan.append(plan_task)
                if effort is not None:
                    remaining_minutes -= effort
        if not task.get("completed") and task.get("period") in ("daily", "weekly"):
            weekly_plan.append(plan_task)
    daily_plan = daily_plan[:5]
    weekly_plan = weekly_plan[:10]

    saved_actions_count = sum(
        state in ("accepted", "completed") for state in states.values()
    )
    if not skills and not applications and not saved_matches and not projects and not interviews:
        summary = "Add career evidence or a goal to get recommendations based on your saved workspace data."
    else:
        summary = (
            f"Your current target is {role}. "
            f"The saved role analysis identifies {len(gap['missing_required_skills'])} "
            f"required skill gaps and {len(completed)} completed roadmap tasks."
        )
    upcoming = sorted(
        reminders if reminders_enabled else [],
        key=lambda action: action["due_date"] or "",
    )
    has_saved_data = bool(skills or applications or saved_matches or projects or interviews)
    return {
        "summary": summary,
        "target_role": role,
        "has_saved_data": has_saved_data,
        "skill_coverage_percentage": gap["skill_coverage_percentage"] if skills else None,
        "missing_required_skills": gap["missing_required_skills"],
        "roadmap_progress": {
            "completed": len(completed),
            "total": len(roadmap["tasks"]),
            "next_task": next_task,
        },
        "actions": actions,
        "daily_plan": daily_plan,
        "weekly_plan": weekly_plan,
        "upcoming_reminders": upcoming,
        "reminders_enabled": reminders_enabled,
        "recent_achievements": [
            {
                "label": f"Completed roadmap task {day}",
                "source": "Saved roadmap progress",
            }
            for day in sorted(completed, reverse=True)[:3]
        ] + [
            {
                "label": f"Completed plan task: {task['title']}",
                "source": "Saved Copilot plan",
            }
            for task in (custom_tasks or [])
            if task.get("completed")
        ][:3],
        "workflows": workflows or [],
        "saved_job_samples": len(saved_matches),
        "accepted_action_count": saved_actions_count,
        "ranking_rules": [
            "Application follow-ups and deadlines due within seven days rank highest (priority 115-120).",
            "Interview-stage applications and the highest-priority role skill gaps rank next (priority 100-110).",
            "The first incomplete roadmap task follows (priority 90), then portfolio and interview-review suggestions.",
            "Daily tasks use the saved daily study-time preference; tasks without a supported effort estimate are not assigned a time.",
            "Dismissed, postponed, or completed actions are excluded from daily and weekly plans.",
        ],
        "limitations": [
            "This workspace currently has no authentication or user-ownership layer; records are local to the configured SQLite database.",
            "Reminders are displayed in the app only. There is no background scheduler, email, push, or external notification integration.",
            "The copilot does not send messages, submit applications, modify the 30-day roadmap, or execute arbitrary model output.",
            "No live job-market data is used; saved match counts reflect only user-supplied records.",
        ],
    }


def answer_copilot_question(
    question: str,
    dashboard: dict[str, Any],
    context: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    clean_question = question.strip()
    if not clean_question:
        raise ValueError("question must not be empty.")
    if len(clean_question) > 2_000:
        raise ValueError("question must be 2,000 characters or fewer.")
    conversation = context or []
    if len(conversation) > 6:
        raise ValueError("context may contain at most 6 recent messages.")
    for message in conversation:
        if (
            not isinstance(message, dict)
            or message.get("role") not in ("user", "assistant")
            or not isinstance(message.get("content"), str)
            or len(message["content"]) > 2_000
        ):
            raise ValueError("context messages must contain a role and short text content.")

    role = dashboard["target_role"]
    missing = dashboard["missing_required_skills"]
    lower = clean_question.casefold()
    if not any(term in lower for term in ("interview", "practice", "mock", "resume", "cv", "job fit", "project", "portfolio", "evidence", "application", "follow up", "deadline")):
        previous_question = next(
            (message["content"] for message in reversed(conversation) if message["role"] == "user"),
            "",
        )
        if previous_question:
            lower = previous_question.casefold()
    if not dashboard.get("has_saved_data"):
        response = (
            "I don't have enough saved career data to make a grounded recommendation yet. "
            "What target role are you aiming for, and which skills or completed projects should I consider? "
            "You can also add your goals in Settings, analyze a resume, or save a job description."
        )
        next_steps = ["Open Settings to review your target role and skills."]
        destination = "settings"
    elif any(term in lower for term in ("interview", "practice", "mock")):
        action = next(
            (item for item in dashboard["actions"] if item["type"] == "interview"),
            None,
        )
        response = (
            f"For {role}, use the existing Interview Prep feature. "
            f"{action['reason'] if action else 'No interview-stage application or lower-scoring saved interview was found.'}"
        )
        next_steps = ["Open Interview Prep and choose role-relevant questions."]
        destination = "interview"
    elif any(term in lower for term in ("resume", "cv", "job fit")):
        response = (
            f"Use Resume Analyzer to compare your resume with a specific job description. "
            f"Current role analysis shows {len(missing)} required skill gaps; suggestions should be supported by your own evidence."
        )
        next_steps = ["Open Resume Analyzer and provide the actual job description."]
        destination = "resume"
    elif any(term in lower for term in ("project", "portfolio", "evidence")):
        response = (
            "Portfolio Projects can help you demonstrate skills with work you actually complete. "
            "Do not describe a proposed project as completed evidence."
        )
        next_steps = ["Open Portfolio Projects to generate or continue a project plan."]
        destination = "portfolio"
    elif any(term in lower for term in ("application", "follow up", "deadline")):
        action = next(
            (item for item in dashboard["actions"] if item["type"] in ("follow-up", "deadline")),
            None,
        )
        response = action["reason"] if action else "No upcoming saved application deadline or follow-up was found."
        next_steps = ["Review the saved application record before taking any external action."]
        destination = "applications"
    else:
        first = dashboard["actions"][0]
        response = (
            f"For your {role} goal, {first['title']} is currently the highest-ranked suggestion. "
            f"{first['reason']} This ranking uses your saved workspace data, not hiring probabilities."
        )
        next_steps = [first["title"]]
        destination = first["destination"]

    return {
        "response": response,
        "next_steps": next_steps,
        "destination": destination,
        "basis": "Deterministic guidance using the saved local workspace; no external AI service was called.",
    }


def make_preparation_workflow(application: dict[str, Any]) -> dict[str, Any]:
    steps = [
        {
            **step,
            "completed": False,
        }
        for step in WORKFLOW_STEPS
    ]
    return {
        "application_id": application["id"],
        "job_title": application["job_title"],
        "company": application["company"],
        "steps": steps,
    }
