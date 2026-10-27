from collections import Counter
from typing import Any

from backend.app.recommendations import recommend_roles
from backend.app.roadmap import generate_roadmap
from backend.app.skill_gap import analyze_skill_gap


def _role_recommendations(skills: list[str], target_role: str) -> list[dict[str, Any]]:
    recommendations = []
    for item in recommend_roles(skills)[:5]:
        role = str(item["target_role"])
        gap = analyze_skill_gap(skills, role)
        missing = list(gap["missing_required_skills"])
        effort = sum(
            int(gap_item["estimated_hours"])
            for gap_item in gap.get("prioritized_gaps", [])
            if gap_item["skill"] in missing
        )
        recommendations.append({
            **item,
            "is_selected": role == target_role,
            "preparation_hours": effort,
            "reasons": [
                f'{len(item["matched_required_skills"])} required skills match the catalog.',
                f'{len(item["matched_optional_skills"])} optional skills are already present.',
                f'Priority gaps: {", ".join(missing[:3]) or "none identified"}.',
            ],
            "next_steps": [
                f"Study {skill} using the prioritized gap guidance."
                for skill in missing[:3]
            ] or ["Strengthen project evidence and interview explanations."],
        })
    return recommendations


def _adaptive_learning(
    skills: list[str],
    target_role: str,
    completed_days: list[int],
    daily_minutes: int,
) -> dict[str, Any]:
    roadmap = generate_roadmap(skills, target_role, daily_minutes)
    completed = set(completed_days)
    next_task = next((task for task in roadmap["tasks"] if task["day"] not in completed), None)
    return {
        "next_task": next_task,
        "completed_count": len(completed),
        "total_tasks": len(roadmap["tasks"]),
        "reason": (
            f"Task {next_task['day']} is the first incomplete task and focuses on "
            f"{next_task['skill']}."
            if next_task
            else "All generated roadmap tasks are complete; review gaps or build project evidence."
        ),
        "pace": {
            "daily_minutes": daily_minutes,
            "estimated_weekly_minutes": daily_minutes * 7,
        },
    }


def _market_insights(saved_matches: list[dict[str, Any]]) -> dict[str, Any]:
    counts: Counter[str] = Counter()
    for match in saved_matches:
        result = match.get("result") or {}
        for skill in result.get("detected_required_skills", []):
            counts[str(skill)] += 1
        for skill in result.get("detected_preferred_skills", []):
            counts[str(skill)] += 1
    return {
        "source": "Saved job descriptions supplied by the user",
        "collected_at": None,
        "sample_size": len(saved_matches),
        "skills": [
            {"skill": skill, "mentions": mentions}
            for skill, mentions in counts.most_common(10)
        ],
        "limitations": (
            "This is not live labor-market data. It is a descriptive summary of saved "
            "job descriptions and cannot establish demand, trends, geography, or salary."
        ),
    }


def build_intelligence(
    skills: list[str],
    target_role: str,
    daily_minutes: int,
    completed_days: list[int],
    saved_matches: list[dict[str, Any]],
    saved_projects: list[dict[str, Any]],
    interview_sessions: list[dict[str, Any]],
) -> dict[str, Any]:
    gap = analyze_skill_gap(skills, target_role)
    adaptive = _adaptive_learning(skills, target_role, completed_days, daily_minutes)
    priority = list(gap.get("prioritized_gaps", []))
    project = next(
        (item for item in saved_projects if item.get("status") != "completed"),
        None,
    )
    interview = min(
        (item for item in interview_sessions if isinstance(item.get("score"), (int, float))),
        key=lambda item: item["score"],
        default=None,
    )
    actions = [
        {
            "type": "skill",
            "title": f"Learn {priority[0]['skill']}" if priority else "Strengthen role evidence",
            "reason": priority[0]["why_required"] if priority else "No missing required skill is currently identified.",
            "destination": "gap",
        },
        {
            "type": "roadmap",
            "title": "Complete the next roadmap task",
            "reason": adaptive["reason"],
            "destination": "roadmap",
        },
    ]
    if project:
        actions.append({
            "type": "portfolio",
            "title": f"Continue {project.get('title', 'your saved project')}",
            "reason": "An incomplete saved project can provide evidence for relevant skills.",
            "destination": "portfolio",
        })
    if interview:
        actions.append({
            "type": "interview",
            "title": "Practice your weakest interview session topic",
            "reason": f"Your lowest saved session score is {round(float(interview['score']))}%; use coaching feedback to target practice.",
            "destination": "interview",
        })
    return {
        "target_role": target_role,
        "career_paths": _role_recommendations(skills, target_role),
        "skill_gap": gap,
        "adaptive_learning": adaptive,
        "market_insights": _market_insights(saved_matches),
        "action_plan": actions[:5],
        "disclaimer": (
            "Recommendations are transparent, profile-grounded guidance. They are not "
            "predictions of hiring outcomes or live labor-market forecasts."
        ),
    }
