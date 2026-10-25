# SkillBridge AI

SkillBridge AI is a personalized career-guidance platform for turning resume
evidence into practical next steps. It combines transparent backend rules with
a responsive React dashboard so a user can analyze a resume, compare roles,
match a real job description, and generate a focused 30-day learning plan.

## Features

- In-memory PDF resume parsing with PyMuPDF and keyword-based skill extraction.
- Eight deterministic career paths with explainable required/optional skill
  scoring.
- Skill-gap analysis for a selected role.
- Job-description matching with detected skills, required gaps, coverage, and
  evidence snippets from the pasted description.
- 30-day roadmap generation with four weekly groups and measurable deliverables.
- Roadmap focus skills can be supplied by the job matcher.
- Profile-grounded deterministic career mentor responses.
- Responsive React/Vite dashboard with light/dark themes and live API status.
- No resume files or resume text are saved permanently by the backend or browser.

Match percentages are rule-based estimates. They are not hiring probabilities
or guarantees of employment.

## Architecture

```text
frontend/
  src/App.jsx             React dashboard and page state
  src/services/api.js     Shared API client and request contracts
backend/
  app/main.py             FastAPI routes and PDF extraction
  app/skill_gap.py        Canonical role catalog and gap logic
  app/recommendations.py  Explainable role ranking
  app/job_matcher.py      Job-description skill/evidence matcher
  app/roadmap.py          Deterministic 30-day roadmap generator
  app/mentor.py           Profile-grounded mentor response logic
  tests/                  API and service regression tests
```

The role catalog lives in `backend/app/skill_gap.py` and is reused by
recommendations, matching, roadmap generation, and mentor guidance. There is
no paid API or required LLM integration.

## Setup

### Backend

The repository uses the existing Windows virtual environment:

```powershell
Set-Location "C:\Users\Bindhu Shree KR\OneDrive\Desktop\Hacktoberfest\t2c2-innospark"
& ".\.venv\Scripts\uvicorn.exe" backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

If setting up a fresh environment, install the runtime dependencies:

```powershell
python -m pip install fastapi uvicorn pymupdf python-multipart pytest
```

### Frontend

```powershell
Set-Location "C:\Users\Bindhu Shree KR\OneDrive\Desktop\Hacktoberfest\t2c2-innospark\frontend"
npm install
npm run dev
```

The frontend defaults to `http://127.0.0.1:8000`. To use another backend:

```powershell
$env:VITE_API_BASE_URL="http://127.0.0.1:8000"
npm run dev
```

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | API health and project name |
| POST | `/api/resume/analyze` | Upload a PDF using multipart field `file` |
| POST | `/api/roles/recommend` | Rank eight roles from a `skills` list |
| POST | `/api/skills/gap` | Compare skills with a target role |
| POST | `/api/jobs/match` | Match `job_description`, `skills`, and optional `target_role` |
| POST | `/api/roadmap/generate` | Generate a 30-day plan; accepts optional `focus_skills` |
| POST | `/api/mentor/ask` | Return deterministic guidance from `question`, `target_role`, and `skills` |

Example job matcher request:

```json
{
  "target_role": "Python Developer",
  "skills": ["Python", "Git"],
  "job_description": "Build Python REST APIs, write SQL, and collaborate with Git."
}
```

## Testing and quality checks

Run backend tests:

```powershell
Set-Location "C:\Users\Bindhu Shree KR\OneDrive\Desktop\Hacktoberfest\t2c2-innospark"
& ".\.venv\Scripts\python.exe" -m pytest backend\tests -q
```

Run frontend checks:

```powershell
Set-Location "C:\Users\Bindhu Shree KR\OneDrive\Desktop\Hacktoberfest\t2c2-innospark\frontend"
npm run lint
npm run build
```

## Hackathon demonstration workflow

1. Start FastAPI and Vite using the commands above.
2. Open the dashboard and confirm the API indicator is online.
3. Upload a text-based PDF resume in **Resume Analyzer**.
4. Review the detected skills and open **Job Recommendations** to see the
   live, explainable ranking across eight roles.
5. Open **Skill Gap**, select a target role, and inspect required versus
   optional skills.
6. Paste a genuine job description in **Job Description Match**. Review
   detected skills, matched profile skills, missing required skills, and
   evidence snippets.
7. Select **Build roadmap from these gaps** to create a 30-day plan focused on
   the matcher results.
8. Open **Career Mentor** and ask what to learn next. The response is grounded
   in the same analyzed profile and target role.
9. Mark roadmap tasks complete to demonstrate progress tracking.

### Screenshots

The responsive UI can be previewed live at `http://127.0.0.1:5173` after
starting Vite. No static screenshots are committed to this repository; capture
the running dashboard for the hackathon submission so the image reflects the
current build.

## GitHub Copilot usage

GitHub Copilot was used as a coding assistant to help inspect existing project
structure, suggest modular implementation patterns, generate initial test
scaffolding, and iterate on frontend/backend integration. All generated
changes were reviewed against the repository's API contracts, executed with
the local test/build commands, and adjusted where tests exposed mismatches.
Copilot did not receive credentials, resume files, or other secrets, and no
commit or push was performed automatically.
