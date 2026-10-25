from collections.abc import Iterable

from backend.app.skill_gap import analyze_skill_gap


def answer_mentor_question(
    question: str,
    user_skills: Iterable[str],
    target_role: str,
) -> dict[str, object]:
    """Provide deterministic guidance grounded in the analyzed profile."""
    if not isinstance(question, str) or not question.strip():
        raise ValueError("question must be a non-empty string.")
    if len(question) > 2_000:
        raise ValueError("question must be 2,000 characters or fewer.")
    gap = analyze_skill_gap(user_skills, target_role)
    missing = list(gap["missing_required_skills"])
    matched = list(gap["matched_required_skills"])
    if missing:
        response = (
            f"For {gap['target_role']}, your strongest evidence is in "
            f"{', '.join(matched) or 'your current profile'}. Start with "
            f"{missing[0]}, then practice it in a small role-relevant project."
        )
        next_steps = [
            f"Learn the foundations of {skill}." for skill in missing[:3]
        ]
    else:
        response = (
            f"Your required-skill coverage for {gap['target_role']} is complete. "
            "Strengthen your portfolio with measurable project outcomes and "
            "clear documentation."
        )
        next_steps = ["Build one portfolio project that demonstrates the role."]
    return {
        "target_role": gap["target_role"],
        "skill_coverage_percentage": gap["skill_coverage_percentage"],
        "response": response,
        "next_steps": next_steps,
        "disclaimer": "This is deterministic coaching based on your submitted skills, not a hiring prediction.",
    }
