from collections.abc import Iterable
import os
import re

from backend.app.skill_gap import analyze_skill_gap

DISCLAIMER_TEXT = (
    "This is deterministic coaching based on your submitted skills, "
    "not a hiring prediction or employment guarantee."
)


def _detect_intent(question: str) -> str:
    lowered = question.lower()
    if any(k in lowered for k in ("interview", "screening", "questions", "coding challenge")):
        return "interview"
    if any(k in lowered for k in ("project", "portfolio", "build", "github", "repo", "demo")):
        return "portfolio"
    if any(k in lowered for k in ("resume", "cv", "bullet", "linkedin", "experience")):
        return "resume"
    if any(k in lowered for k in ("transition", "switch", "ready", "qualify", "chances")):
        return "transition"
    return "learning"


def _generate_deterministic_guidance(
    question: str,
    gap: dict[str, object],
    matched: list[str],
    missing: list[str],
    matched_optional: list[str],
) -> tuple[str, list[str]]:
    role = str(gap["target_role"])
    coverage = float(gap["skill_coverage_percentage"])
    intent = _detect_intent(question)
    matched_str = ", ".join(matched) if matched else "your current profile"

    if intent == "interview":
        if missing:
            response = (
                f"For {role} interviews, your strongest talking points will be "
                f"{matched_str}. Expect technical questions on {missing[0]}, so practice "
                f"explaining its core principles and trade-offs before interviewing."
            )
            next_steps = [
                f"Review 5 common technical interview questions for {missing[0]}.",
                f"Prepare 2 STAR-method stories emphasizing your experience with {matched[0] if matched else role}.",
                f"Conduct a 30-minute mock interview focusing on {role} design patterns.",
            ]
        else:
            response = (
                f"Your core technical profile matches {role} requirements. Focus interview prep on "
                "system design, edge cases, and articulating architectural decisions from your past projects."
            )
            next_steps = [
                "Practice explaining end-to-end architecture decisions from your portfolio.",
                "Review behavioral interview questions using the STAR framework.",
                "Prepare insightful questions for the hiring team regarding their tech stack and workflow.",
            ]

    elif intent == "portfolio":
        focus_tech = missing[0] if missing else (matched_optional[0] if matched_optional else role)
        response = (
            f"To showcase readiness for {role}, build a focused project that connects "
            f"{matched_str} with {focus_tech}. Employers look for clean documentation, "
            "clear commit history, and test coverage."
        )
        next_steps = [
            f"Define a scoped MVP that incorporates both {matched[0] if matched else 'core tools'} and {focus_tech}.",
            "Write a clear README with architecture diagrams, setup instructions, and sample API outputs.",
            "Add automated tests and a CI workflow on GitHub to demonstrate production habits.",
        ]

    elif intent == "resume":
        if missing:
            response = (
                f"When tailoring your resume for {role}, prominently feature your work in "
                f"{matched_str} with measurable outcomes. For {missing[0]}, highlight active courses, "
                "side projects, or labs under a 'Technical Focus' section."
            )
            next_steps = [
                f"Quantify bullet points for {matched[0] if matched else 'your projects'} with metrics (e.g. latency, users, tests).",
                f"Add {missing[0]} to an 'Ongoing Learning' or 'Projects' section once you finish initial exercises.",
                "Ensure your GitHub and live project links are clickable and lead to polished repositories.",
            ]
        else:
            response = (
                f"Your resume matches the core technical requirements for {role}. Ensure every project "
                "bullet demonstrates business or user impact, not just a list of used technologies."
            )
            next_steps = [
                "Refactor bullets to start with strong action verbs and include measurable impact.",
                "Highlight performance, scalability, or code quality improvements.",
                "Tailor your profile summary to explicitly position yourself as a skilled " + role + ".",
            ]

    elif intent == "transition":
        if coverage >= 70:
            response = (
                f"You have a solid foundation for transitioning to {role} with {round(coverage)}% "
                f"skill coverage. Closing your remaining gap in {missing[0] if missing else 'portfolio depth'} "
                "will make your profile competitive for entry-to-intermediate roles."
            )
            next_steps = [
                f"Prioritize closing the gap in {missing[0]} over the next two weeks." if missing else "Polish your portfolio showcase.",
                "Network with professionals currently working in " + role + " roles.",
                "Apply to target roles while actively completing your remaining learning roadmap.",
            ]
        else:
            response = (
                f"Transitioning to {role} requires structured learning since current required coverage "
                f"is {round(coverage)}%. Focus on high-leverage fundamentals starting with "
                f"{missing[0] if missing else 'core practices'}."
            )
            next_steps = [
                f"Dedicate 45-60 minutes daily to learning {missing[0]}." if missing else "Focus on core fundamentals.",
                "Build small, incremental exercises rather than trying to build a massive project immediately.",
                "Track daily progress using your 30-day SkillBridge roadmap.",
            ]

    else:
        # Default / learning order intent
        if missing:
            response = (
                f"For {role}, your strongest evidence is in "
                f"{matched_str}. Start with "
                f"{missing[0]}, then practice it in a small role-relevant project."
            )
            next_steps = [
                f"Learn the foundations of {skill}." for skill in missing[:3]
            ]
            if "interview" in question.casefold():
                response = (
                    f"For interview preparation toward {gap['target_role']}, review "
                    f"{', '.join(missing[:2]) or 'your core skills'} and practice "
                    "explaining one project with measurable results."
                )
                next_steps = [
                    f"Practice explaining a project using {skill}."
                    for skill in missing[:3]
                ]
        else:
            response = (
                f"Your required-skill coverage for {role} is complete. "
                "Strengthen your portfolio with measurable project outcomes and "
                "clear documentation."
            )
            next_steps = ["Build one portfolio project that demonstrates the role."]

    return response, next_steps


def answer_mentor_question(
    question: str,
    user_skills: Iterable[str],
    target_role: str,
) -> dict[str, object]:
    """Provide profile-grounded career coaching with fallback to transparent deterministic rules."""
    if not isinstance(question, str) or not question.strip():
        raise ValueError("question must be a non-empty string.")
    if len(question) > 2_000:
        raise ValueError("question must be 2,000 characters or fewer.")

    gap = analyze_skill_gap(user_skills, target_role)
    missing = list(gap["missing_required_skills"])
    matched = list(gap["matched_required_skills"])
    matched_optional = list(gap["matched_optional_skills"])

    # Attempt optional LLM integration if configured via environment variable
    llm_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")
    if llm_api_key:
        # If an external key is configured, an advanced agent hook can be attached.
        # Fallback to deterministic rules ensures stability, zero downtime, and reproducibility.
        pass

    response, next_steps = _generate_deterministic_guidance(
        question, gap, matched, missing, matched_optional
    )

    return {
        "target_role": gap["target_role"],
        "skill_coverage_percentage": gap["skill_coverage_percentage"],
        "response": response,
        "next_steps": next_steps,
        "disclaimer": DISCLAIMER_TEXT,
    }
