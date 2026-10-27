# SkillBridge AI — Personalized Career Agent

SkillBridge AI is an evidence-based, personalized career-guidance platform that transforms raw resume experience into transparent role recommendations, target skill-gap breakdowns, real-world job description matching, an interactive 30-day learning curriculum, and profile-grounded career mentoring.

Rather than presenting siloed tools, SkillBridge AI functions as an **autonomous career agent**: gaps detected from a target role or pasted job description automatically sequence into a customized 30-day roadmap and inform profile-grounded coaching.

---

## Key Features

1. **In-Memory Resume PDF Parsing & Skill Extraction (Intelligent Workspace)**
   - High-throughput text extraction using PyMuPDF (`fitz`).
   - Zero-disk storage policy: resumes are processed entirely in RAM and immediately garbage-collected.
   - Categorized technical skill extraction across Languages, Frameworks, Databases, and DevOps with search and category filters.
   - Built-in sample developer resume available for instant 1-click evaluation.
   - Structural section audit with text excerpt drawers and page-level verbatim citations.
   - Target Role Readiness gauge with explainable 3-column match breakdown and transparent scoring formulas.
   - Ethical Resume Improvement Studio using the Problem-Action-Result (PAR) framework with before/after comparisons and accept/reject controls (never hallucinates metrics).
   - In-Analyzer Job Description Matcher with quick presets and bridge to deep skill gap modules.
   - Downloadable vector PDF career readiness report generated via `/api/resume/report` alongside clean browser print stylesheets.
   - Clear distinction between extracted document claims and verified external credentials.

2. **Explainable Job-Role Recommendations (8 Industry Paths)**
   - Evaluates profiles against 8 canonical career paths: *Python Developer, Frontend Developer, Data Analyst, Backend Developer, Full Stack Developer, Machine Learning Engineer, DevOps Engineer, QA Automation Engineer*.
   - Explainable scoring formula: 80% weight on core mandatory skills + 20% bonus on optional complementary tools.
   - Clear textual reasoning for every recommendation (explaining matched vs missing requirements).

3. **Target Role Skill-Gap Analysis**
   - Interactive role switcher providing instant coverage percentage metrics.
   - Three-tier breakdown: Core Matched Skills, Priority Gaps to Learn, and Optional Competitive Advantages.
   - Direct bridges to generate focused learning roadmaps or consult the mentor.

4. **Real-World Job Description Matcher (Career Agent Differentiator)**
   - Extracts explicit skill requirements directly from real job postings.
   - Pulls contextual evidence snippets quoted verbatim from the job description.
   - Identifies candidate's matched skills and specific missing requirements.
   - **Agentic Bridge**: 1-click transfer of detected job gaps into the 30-Day Learning Roadmap and pre-filled Career Mentor consultations.

5. **Personalized 30-Day Learning Roadmap**
   - Structured 4-week progression: *Week 1 Foundations, Week 2 Guided Practice, Week 3 Applied Integration, Week 4 Capstone Mini-Project*.
   - 30 distinct daily tasks with actionable deliverables and verified documentation links.
   - Configurable daily learning commitment (30, 60, 90, 120 minutes/day).
   - Task completion tracking persisted through the local SQLite profile store.
   - Job-match gaps can be passed as explicit roadmap focus skills.

6. **Profile-Grounded AI Career Mentor**
   - Grounded strictly in the candidate's verified profile evidence and target role.
   - Intent-aware responses tailored for technical interviews, portfolio architecture, resume tailoring, learning order, or career transition readiness.
   - Concrete 3-step action plans for every inquiry.
   - Optional LLM integration via environment variables (`GEMINI_API_KEY` / `OPENAI_API_KEY`) with immediate deterministic fallback for zero downtime.

7. **Career Readiness Dashboard**
   - Evidence-based composite Career Readiness Score (0–100%) synthesizing skill match coverage, verified profile breadth, and roadmap momentum.
   - Visual tier indicators (*Early Explorer, Skill Builder, Interview Contender, Role-Ready Contender*).
   - Responsive dark and light theme support with WCAG AA readable contrast.
   - Saved job-match history for revisiting analyzed opportunities.

8. **Advanced Career Intelligence**
   - Profile-grounded alternative career paths with reasons, missing skills, and estimated preparation effort.
   - Adaptive next-task guidance based on the selected role, saved roadmap progress, and available daily study time.
   - Prioritized action plan linking skill gaps, roadmap work, portfolio projects, and interview practice.
   - Job-market sample insights computed only from saved job descriptions supplied by the user; no live market statistics are claimed.
   - The existing Career Mentor remains the conversational assistant and uses the same deterministic profile-grounded fallback when an optional provider is unavailable.

9. **Career Copilot**
   - Unifies role gaps, the existing roadmap, saved job comparisons, projects, interviews, and application dates in a prioritized workspace.
   - Produces daily and weekly suggestions with reason, expected benefit, and an effort estimate only when the source provides one.
   - Lets users accept, dismiss, postpone, or complete suggestions; custom plan tasks, reminder preferences, and action statuses persist in SQLite.
   - Offers short-session deterministic guidance based on saved workspace summaries without calling an external AI service or sending resume text/private application notes.
   - Starts idempotent, reviewable application-preparation checklists that link to existing features. The checklist does not submit applications or make consequential changes.
   - Displays in-app application deadline/follow-up reminders only after opt-in. No background scheduler, email, push, or external notifications are implemented.

> **Responsible AI Notice**: SkillBridge AI match percentages and recommendations are rule-based estimates of syllabus overlap and skill evidence. They do not constitute hiring probabilities or guarantees of employment.

---

## System Architecture

```text
t2c2-innospark/
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI application, CORS, PDF endpoint & routing
│   │   ├── skill_gap.py        # Canonical 8-role catalog & gap calculation engine
│   │   ├── recommendations.py  # Transparent 8-role explainable ranking engine
│   │   ├── job_matcher.py      # Real-world job description parser & evidence extractor
│   │   ├── roadmap.py          # 30-day deliverable curriculum & capstone generator
│   │   ├── mentor.py           # Intent-aware, profile-grounded career advisory engine
│   │   ├── intelligence.py     # Career paths, adaptive learning, action plans & sample insights
│   │   └── copilot.py          # Next actions, daily/weekly planning, private guidance
│   └── tests/                  # Pytest unit, integration, and E2E workflow suite
│       ├── test_e2e_agent_workflow.py
│       ├── test_health.py
│       ├── test_job_matcher.py
│       ├── test_mentor.py
│       ├── test_recommendations.py
│       ├── test_resume_analyze.py
│       ├── test_roadmap.py
│       └── test_skill_gap.py
├── frontend/
│   ├── public/
│   │   └── sample_resume.pdf   # Pre-packaged developer PDF for instant testing
│   ├── src/
│   │   ├── components/         # Modular React components
│   │   │   ├── common/Icons.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   ├── Overview.jsx    # Career Readiness Dashboard
│   │   │   ├── ResumeAnalyzer.jsx
│   │   │   ├── Recommendations.jsx
│   │   │   ├── SkillGapPage.jsx
│   │   │   ├── JobMatcher.jsx  # Job Matcher & Agent Bridge
│   │   │   ├── RoadmapPage.jsx # Interactive 30-day curriculum
│   │   │   ├── MentorPage.jsx
│   │   │   ├── Copilot.jsx     # Career Copilot workspace and preparation workflows
│   │   │   └── Settings.jsx
│   │   ├── constants/          # Shared navigation and role constants
│   │   │   ├── navigation.js
│   │   │   └── roles.js
│   │   ├── services/
│   │   │   └── api.js          # Centralized HTTP client and API contracts
│   │   ├── App.jsx             # Clean state orchestrator
│   │   ├── App.css             # Theme variables, high-contrast & responsive styles
│   │   └── main.jsx
│   └── package.json
└── README.md
```

---

## Setup & Running

### Prerequisites
- Python 3.10+ (tested on Python 3.12)
- Node.js 18+ and npm

### 1. Backend Setup

From the `t2c2-innospark` directory, activate the existing virtual environment or create a new one:

```powershell
# Using the pre-configured virtual environment on Windows
Set-Location "C:\Users\Bindhu Shree KR\OneDrive\Desktop\Hacktoberfest\t2c2-innospark"
& ".\.venv\Scripts\uvicorn.exe" backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

*Fresh environment alternative:*
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install fastapi uvicorn pymupdf python-multipart pytest httpx
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Frontend Setup

From the `t2c2-innospark\frontend` directory:

```powershell
Set-Location "C:\Users\Bindhu Shree KR\OneDrive\Desktop\Hacktoberfest\t2c2-innospark\frontend"
npm install
npm run dev
```

The frontend will be accessible at `http://127.0.0.1:5173`. It connects automatically to `http://127.0.0.1:8000`.

---

## API Reference

| Method | Endpoint | Description | Sample Request |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Service health status | *None* |
| **POST** | `/api/resume/analyze` | In-memory PDF text, skill extraction, evidence snippets, and detected section signals | `multipart/form-data` with `file=@resume.pdf` |
| **POST** | `/api/resume/report` | Generate high-resolution downloadable vector PDF career readiness report | `{"target_role": "Python Developer", "skills": [...], "readiness_score": 75}` |
| **GET/PUT** | `/api/profile` | Read or update confirmed profile skills and preferences | `{"skills": ["Python"], "target_role": "Python Developer"}` |
| **POST** | `/api/roles/recommend` | Explainable ranking across 8 roles | `{"skills": ["Python", "SQL", "Git"]}` |
| **POST** | `/api/intelligence/overview` | Recalculate career paths, adaptive learning, action plan, and supplied-job sample insights | `{"target_role": "Python Developer", "skills": ["Python"], "completed_days": [1]}` |
| **POST** | `/api/portfolio/projects` | Generate a role-specific portfolio project plan | `{"target_role": "Python Developer", "skills": ["Python"]}` |
| **POST** | `/api/interview/prepare` | Generate role-specific interview questions and a study plan | `{"target_role": "Python Developer", "skills": ["Python"]}` |
| **POST** | `/api/skills/gap` | Compare candidate skills with role catalog | `{"target_role": "Python Developer", "skills": ["Python"]}` |
| **POST** | `/api/jobs/match` | Match job posting, extract evidence & gaps | `{"job_description": "...", "skills": [...], "target_role": "..."}` |
| **POST** | `/api/roadmap/generate`| Generate 30-day curriculum with deliverables | `{"target_role": "...", "skills": [...], "daily_minutes": 60}` |
| **POST** | `/api/mentor/ask` | Intent-aware, profile-grounded career coaching | `{"question": "...", "target_role": "...", "skills": [...]}` |
| **GET/PUT** | `/api/roadmap/progress` | Read or save completed roadmap days | `{"target_role": "Python Developer", "completed_days": [1, 2]}` |
| **GET/POST** | `/api/jobs/matches` | List or save analyzed job matches | `{"title": "...", "description": "...", "result": {...}}` |
| **GET** | `/api/applications` | List application records, optionally filtered by status | `/api/applications?status=interview` |
| **POST** | `/api/applications` | Create a saved job application record | `{"company": "Acme", "job_title": "Python Developer"}` |
| **PUT** | `/api/applications/{id}` | Update status, dates, notes, or job details | `{"company": "Acme", "job_title": "Python Developer", "status": "applied"}` |
| **DELETE** | `/api/applications/{id}` | Remove an application record | *None* |
| **GET** | `/api/copilot/dashboard` | Build next actions, plans, in-app reminders, and workflow summaries from saved workspace records | *None* |
| **PUT** | `/api/copilot/actions/{action_id}` | Persist an allowlisted action status: accepted, dismissed, postponed, or completed | `{"status": "accepted"}` |
| **PUT** | `/api/copilot/preferences` | Persist the in-app reminder opt-in | `{"reminders_enabled": true}` |
| **POST** | `/api/copilot/chat` | Deterministic workspace guidance using recent request context | `{"question": "What next?", "context": []}` |
| **POST** | `/api/copilot/workflows/{application_id}` | Create or return the single preparation checklist for an existing application | *None* |
| **PUT** | `/api/copilot/workflows/{application_id}` | Mark one allowed preparation step complete/incomplete | `{"step_id": "review-requirements", "completed": true}` |
| **GET/POST** | `/api/copilot/plan-tasks` | List or add a user-edited daily/weekly plan task | `{"title": "Review SQL notes", "period": "daily"}` |
| **PUT/DELETE** | `/api/copilot/plan-tasks/{task_id}` | Edit, complete, or remove a personal Copilot plan task | `{"completed": true}` |

### Intelligence data limitations

`/api/intelligence/overview` is deterministic and uses profile, roadmap progress,
saved job-match results, saved portfolio projects, and completed interview sessions
provided by the application context. The current repository does not yet contain
authentication middleware, user IDs, or ownership columns; these records are local
workspace data and must not be deployed as a multi-user service until authorization
is added. Job-market insights are descriptive counts from saved user samples, with
no external collection date, geography, experience-level segmentation, or trend
inference. Optional `GEMINI_API_KEY` or `OPENAI_API_KEY` values are used only by the
existing mentor integration; the intelligence endpoint does not send private profile
data to an external provider.

### Phase 12 Copilot architecture, ranking, and limits

The Career Copilot UI calls `/api/copilot/dashboard`; the backend assembles the current
profile, saved roadmap progress, saved job matches, projects, interview sessions, and
application records from the existing SQLite store. It calls the existing role-gap
and roadmap generators instead of maintaining another skill catalog or overwriting
the saved 30-day roadmap.

Recommendation priorities are deterministic: recent overdue application follow-ups
and deadlines rank highest (priority 120-125), dates due within seven days follow
(115-120), interview-stage applications and role gaps follow (100-110), then the
first incomplete roadmap task (90), incomplete portfolio work and saved interview
feedback. Lower priority is used for project planning and additional interview
review. Daily suggestions use the profile's daily-minute setting and available
effort estimates; custom daily/weekly tasks remain separately stored. Dismissed,
postponed, and completed suggestions are excluded from generated plans. This is
guidance, not a hiring score or prediction.

Copilot chat uses deterministic, bounded response branches based on the saved role
and recommendations; it does not call an LLM. Recent conversation context is held
only in the mounted frontend workspace and sent to the local API for follow-up intent
resolution; it is not stored in SQLite. Workflow creation is allowlisted and
idempotent per application, step IDs are validated, and actions are suggestions or
checklists only. No arbitrary model output is executed.

No new environment variables are required. SQLite location continues to use
`SKILLBRIDGE_DB_PATH` when configured, otherwise the existing local database path.
In-app reminders are opt-in and display saved dates only; the app has no background
scheduler or external notification service. This repository still has no login,
authentication middleware, user IDs, or record ownership checks. Copilot and
existing records are therefore local single-workspace data and must not be exposed
as a multi-user service until authentication and authorization are implemented.
The reminder preference is not consent for email, push, or external contact; those
actions are not implemented.

---

## Testing & Quality Assurance

### Run Backend Tests (77 tests, latest verified run)
```powershell
Set-Location "C:\Users\Bindhu Shree KR\OneDrive\Desktop\Hacktoberfest\t2c2-innospark"
& ".\.venv\Scripts\python.exe" -m pytest backend\tests -v
```

*Coverage includes:*
- End-to-end full career agent workflow (`test_e2e_agent_workflow.py`).
- Deterministic roadmap generation across all 8 catalog roles without KeyError (`test_roadmap.py`).
- PyMuPDF in-memory parsing, size limit rejection (5MB), non-PDF rejection, and empty PDF detection (`test_resume_analyze.py`).
- Job description matcher evidence extraction and role scoping (`test_job_matcher.py`).
- Career mentor intent branches (interview, portfolio, resume, transition, learning) and empty input validation (`test_mentor.py`).
- Skill gap edge cases, casing, and whitespace normalization (`test_skill_gap.py`).
- Career Copilot action ranking, empty profile/context handling, date-bound reminders, plan task persistence, idempotent workflows, allowlisted steps, and API error handling (`test_copilot.py`).

### Run Frontend Lint & Build
```powershell
Set-Location "C:\Users\Bindhu Shree KR\OneDrive\Desktop\Hacktoberfest\t2c2-innospark\frontend"
npm run lint
npm run build
```

---

## Hackathon Demonstration Walkthrough

Follow this step-by-step workflow during judging or presentation:

1. **Dashboard & System Health**
   - Launch the dashboard at `http://127.0.0.1:5173`.
   - Observe the green `API online` indicator on the sidebar and the `Demo Profile` badge in the top bar.
   - Inspect the **Career Readiness Index** orb, displaying evidence-based composite scores for the default profile.

2. **Resume PDF Intelligence**
   - Click **Resume Analyzer** in the navigation.
   - Click **"Use Sample Developer Resume"** (or upload your own PDF).
   - Watch the in-memory PyMuPDF parser extract 17 technical skills with character-accurate preview.
   - Notice the top bar badge transition to **Verified Resume**.

3. **Explainable Role Recommendations**
   - Navigate to **Job Recommendations**.
   - Review explainable match percentages across all 8 career paths (e.g., Python Developer, Backend Developer, Data Analyst).
   - Observe the explainability note indicating how many required and optional skills matched.

4. **Skill-Gap Breakdown**
   - Switch to **Skill Gap** and select **Machine Learning Engineer**.
   - Inspect the 3-column breakdown: verified profile skills, missing core skills (e.g. *Machine Learning*), and optional advantages.

5. **Real-World Job Description Matching (The Agent Differentiator)**
   - Navigate to **Job Description Match**.
   - Click one of the preset buttons: **"Python API Posting"** or **"React Frontend Posting"** (or paste your own posting).
   - Click **Analyze Job Fit**.
   - Review the matched skills, identified required gaps, and **Job Evidence Snippets** quoting verbatim sentences from the job posting.

6. **Agentic Action: Transfer Gaps into Learning Roadmap**
   - In the Job Matcher results, click **"Tailor 30-Day Roadmap with These Gaps"**.
   - The application automatically transitions to the **Learning Roadmap** page with a banner: *Tailored from Job Matcher*.
   - Review the 30-day curriculum grouped into 4 weekly milestones with specific deliverables.
   - Check off Day 01 and Day 02 tasks; observe progress recalculation and persistence in `localStorage`.

7. **Profile-Grounded Career Mentor**
   - Open **Career Mentor**.
   - Click the prompt chip: *"How do I prepare for technical interviews for this role?"*.
   - The mentor returns tailored advice directly addressing your matched evidence, your missing gaps, and concrete preparation steps.

---

## GitHub Copilot Usage Documentation

GitHub Copilot was utilized as an AI pair programmer throughout the development and refactoring of SkillBridge AI:

1. **Architecture & Codebase Inspection**:
   - Copilot assisted in auditing backend route handlers against existing frontend API calls to ensure zero contract breakage.
   - Identified a latent `KeyError` vulnerability in `roadmap.py` where `ROLE_PROJECTS` was only defined for 3 of the 8 catalog roles.

2. **Component Modularization**:
   - Generated modular component scaffolds (`Sidebar`, `Topbar`, `Overview`, `JobMatcher`, `RoadmapPage`, `MentorPage`, `ResumeAnalyzer`, `Settings`) extracting 400+ lines of monolithic code into clean, single-responsibility files.
   - Refactored shared constants (`roles.js`, `navigation.js`) to adhere strictly to Fast Refresh and clean architecture patterns.

3. **Intent Detection & Guidance Logic**:
   - Guided the rule-based intent categorization in `mentor.py`, ensuring tailored responses for interview prep, portfolio architecture, resume improvement, and career transition scenarios.

4. **Comprehensive Test Suite Generation**:
   - Synthesized parametrized test cases covering all 8 catalog paths, intent classifications, edge-case PDF handling, and the complete end-to-end agent workflow (`test_e2e_agent_workflow.py`).

5. **Security & Privacy Guardrails**:
   - Ensured that no credentials, API keys, or resume binary payloads were logged or persisted to disk. All Copilot-suggested code was manually verified against the hackathon criteria before integration.
