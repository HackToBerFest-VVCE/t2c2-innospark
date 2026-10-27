from collections.abc import Iterable

from backend.app.skill_gap import JOB_ROLE_SKILL_CATALOG, analyze_skill_gap


ROLE_QUESTIONS = {
    "Python Developer": [
        ("Fundamentals", "Explain how you would structure a maintainable Python service."),
        ("Problem solving", "How would you debug a slow Python endpoint?"),
        ("Data", "When would you choose SQL joins versus application-side processing?"),
        ("API design", "What makes a REST API predictable and easy for clients to use?"),
        ("Testing", "Describe the tests you would write before shipping a new endpoint."),
        ("Behavioral", "Tell us about a time you improved code quality or reliability."),
    ],
    "Frontend Developer": [
        ("Fundamentals", "How do semantic HTML and accessible interactions improve a product?"),
        ("JavaScript", "Explain how you would manage asynchronous state in a frontend feature."),
        ("UI engineering", "How do you make a responsive interface work across device sizes?"),
        ("Performance", "What would you measure before optimizing a slow page?"),
        ("Testing", "What belongs in a component test versus an end-to-end test?"),
        ("Behavioral", "Tell us about a UI decision you changed after user feedback."),
    ],
    "Data Analyst": [
        ("SQL", "How would you validate a query before presenting its result?"),
        ("Analysis", "How do you distinguish correlation from a useful business insight?"),
        ("Data quality", "What checks do you perform when a dataset contains missing values?"),
        ("Communication", "How would you explain an uncertain result to a non-technical stakeholder?"),
        ("Tools", "Describe a repeatable workflow for turning raw data into a report."),
        ("Behavioral", "Tell us about a time your analysis changed a decision."),
    ],
}


def _role_name(target_role: str) -> str:
    if not isinstance(target_role, str) or not target_role.strip():
        raise ValueError("target_role must be a non-empty string.")
    normalized = " ".join(target_role.split()).casefold()
    role = next((name for name in JOB_ROLE_SKILL_CATALOG if name.casefold() == normalized), None)
    if role is None:
        raise ValueError(f"Unknown target role: {target_role.strip()}.")
    return role


def _questions_for_role(role: str) -> list[tuple[str, str]]:
    if role in ROLE_QUESTIONS:
        return ROLE_QUESTIONS[role]
    required = JOB_ROLE_SKILL_CATALOG[role]["required"]
    return [
        ("Core skill", f"Explain a practical use of {skill} and one trade-off.")
        for skill in required
    ] + [
        ("Behavioral", f"Describe a project that demonstrates readiness for {role}."),
        ("Growth", "What would you learn next and how would you measure progress?"),
    ]


def generate_interview_plan(
    user_skills: Iterable[str],
    target_role: str,
    question_count: int | None = None,
    difficulty: str = "Intermediate",
    focus_skills: Iterable[str] | None = None,
    job_requirements: Iterable[str] | None = None,
) -> dict:
    if question_count is not None and (question_count < 3 or question_count > 12):
        raise ValueError("question_count must be between 3 and 12.")
    if difficulty not in {"Foundational", "Intermediate", "Advanced"}:
        raise ValueError("difficulty must be Foundational, Intermediate, or Advanced.")
    role = _role_name(target_role)
    gap = analyze_skill_gap(user_skills, role)
    missing = list(gap["missing_required_skills"])
    questions = _questions_for_role(role)
    requested_focus = [skill.strip() for skill in (focus_skills or []) if isinstance(skill, str) and skill.strip()]
    job_focus = [skill.strip() for skill in (job_requirements or []) if isinstance(skill, str) and skill.strip()]
    focus = list(dict.fromkeys(requested_focus + job_focus + missing))[:3] or list(gap["matched_required_skills"])[:3]
    if question_count is not None and question_count < len(questions):
        questions = questions[:question_count]
    elif question_count is not None and question_count > len(questions):
        questions = questions + [
            ("Situational", f"How would you approach a production problem involving {focus[0] if focus else role}?"),
        ] * (question_count - len(questions))

    return {
        "target_role": role,
        "skill_coverage_percentage": gap["skill_coverage_percentage"],
        "priority_topics": focus,
        "questions": [
            {
                "id": index,
                "category": category,
                "question": question,
                "type": "behavioral" if category == "Behavioral" else (
                    "situational" if category in {"Problem solving", "Situational"} else (
                        "project" if "project" in question.casefold() else "technical"
                    )
                ),
                "source": "SkillBridge practice question",
                "hint": f"Structure your answer around {focus[0]} and a concrete example." if focus else "Explain your reasoning, trade-offs, and outcome.",
                "resources": [f"Review the fundamentals and trade-offs of {focus[0]}." if focus else "Review the role fundamentals."],
                "evaluation_criteria": [
                    "Use a concrete example or implementation detail.",
                    "Explain one trade-off, limitation, or edge case.",
                    "Connect the answer to measurable impact where possible.",
                ],
            }
            for index, (category, question) in enumerate(questions, start=1)
        ],
        "study_plan": [
            f"Review the fundamentals of {skill} and explain them without notes."
            for skill in focus
        ] + [
            "Practice two answers aloud using the STAR structure for behavioral questions.",
            "Run a timed mock interview and write down one improvement for each answer.",
        ],
        "readiness_note": (
            f"Your current core coverage is {gap['skill_coverage_percentage']}%. "
            f"Prioritize {', '.join(focus) if focus else 'project explanations'} before interviews."
        ),
        "difficulty": difficulty,
        "question_count": len(questions),
        "job_requirements_used": job_focus,
    }


def evaluate_interview_answer(
    question: str,
    answer: str,
    evaluation_criteria: Iterable[str] | None = None,
) -> dict[str, object]:
    if not isinstance(answer, str) or not answer.strip():
        raise ValueError("answer must be a non-empty string.")
    if len(answer) > 10_000:
        raise ValueError("answer must be 10,000 characters or fewer.")
    words = answer.split()
    criteria = list(evaluation_criteria or [])
    relevance = 100 if any(token.casefold() in answer.casefold() for token in question.split() if len(token) > 4) else 45
    clarity = min(100, 40 + len(words) * 2)
    completeness = min(100, 35 + (25 if criteria and len(words) >= 30 else 0) + (25 if len(words) >= 60 else 0))
    technical = 70 if any(marker in answer.casefold() for marker in ("because", "trade-off", "test", "measure", "example")) else 45
    score = round((relevance + clarity + completeness + technical) / 4, 2)
    strengths = []
    if relevance >= 70:
        strengths.append("The answer addresses the question directly.")
    if clarity >= 70:
        strengths.append("The answer contains enough detail to follow the reasoning.")
    missing = []
    if completeness < 70:
        missing.append("Add a concrete example, implementation detail, or outcome.")
    if technical < 70:
        missing.append("Explain the reasoning, trade-off, test, or measurable result.")
    return {
        "score": score,
        "dimensions": {"relevance": relevance, "clarity": clarity, "completeness": completeness, "technical_accuracy": technical},
        "strengths": strengths,
        "missing_concepts": missing,
        "coaching_feedback": "Use a concise structure: context, action, technical reasoning, and result. This is coaching feedback, not a hiring prediction.",
        "question": question,
    }
