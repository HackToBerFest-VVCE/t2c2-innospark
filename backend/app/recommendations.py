from collections.abc import Iterable

from backend.app.skill_gap import JOB_ROLE_SKILL_CATALOG, analyze_skill_gap


def recommend_roles(user_skills: Iterable[str]) -> list[dict[str, object]]:
    """Rank catalog roles using required-skill coverage plus optional bonuses."""
    results: list[dict[str, object]] = []
    for role_name, role_skills in JOB_ROLE_SKILL_CATALOG.items():
        gap = analyze_skill_gap(user_skills, role_name)
        required_total = len(role_skills["required"])
        optional_total = len(role_skills["optional"])
        required_score = len(gap["matched_required_skills"]) / required_total
        optional_score = (
            len(gap["matched_optional_skills"]) / optional_total
            if optional_total
            else 0
        )
        match_percentage = round((required_score * 80) + (optional_score * 20), 2)
        missing = gap["missing_required_skills"]
        if missing:
            explanation = (
                f"{len(gap['matched_required_skills'])} of {required_total} "
                f"required skills match; focus next on {', '.join(missing[:2])}."
            )
        else:
            explanation = (
                "All required skills match; optional skills can strengthen "
                "your portfolio."
            )
        results.append(
            {
                "target_role": role_name,
                "match_percentage": match_percentage,
                "matched_required_skills": gap["matched_required_skills"],
                "matched_optional_skills": gap["matched_optional_skills"],
                "missing_required_skills": missing,
                "explanation": explanation,
            }
        )
    return sorted(
        results,
        key=lambda item: (-float(item["match_percentage"]), str(item["target_role"])),
    )
