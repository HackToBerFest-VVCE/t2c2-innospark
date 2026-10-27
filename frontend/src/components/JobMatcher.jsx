import { useState } from 'react'
import { Icon, PageIntro } from './common/Icons'
import { CATALOG_ROLES } from '../constants/roles'

const SAMPLE_JOB_DESCRIPTIONS = {
  python: `Senior Backend Engineer (Python / API)
We are seeking an engineer to build scalable REST APIs using Python and FastAPI.
Must have strong experience with SQL database schema design, query optimization, and PostgreSQL.
Required:
- 3+ years writing clean Python code
- Experience designing and securing REST APIs
- Comfortable collaborating with Git and GitHub
- Experience containerizing microservices with Docker is a big plus.`,

  frontend: `Frontend React Developer
Join our web product team to create responsive user interfaces with JavaScript, HTML, and CSS.
You will build component libraries with React, consume backend REST APIs, and manage branch releases with Git and GitHub.
Bonus points for familiarity with Docker containers and automated UI testing.`,

  fullstack: `Full Stack Software Engineer
Looking for a Full Stack Developer capable of delivering features from database to frontend.
Key requirements:
- Frontend: JavaScript, HTML, CSS, and modern React
- Backend: Python or Node REST APIs, relational databases using SQL
- Tools: Git and GitHub for daily code review and collaboration
- Good to have: Docker and container deployments.`,
}

export function JobMatcher({
  skills,
  role,
  setRole,
  result,
  loading,
  error,
  match,
  buildRoadmapFromGaps,
  askMentorAboutJob,
  saveMatch,
}) {
  const [description, setDescription] = useState('')
  const [selectedRole, setSelectedRole] = useState(role || 'Python Developer')
  const [saved, setSaved] = useState(false)

  function loadSample(key) {
    setDescription(SAMPLE_JOB_DESCRIPTIONS[key] || '')
  }

  const charCount = description.trim().length
  const canMatch = charCount >= 20 && !loading

  return (
    <>
      <PageIntro
        eyebrow="CAREER AGENT · REAL-WORLD JOB MATCHER"
        title="Benchmark Against Real Job Descriptions"
        description="Paste an actual job posting to discover explicit skill requirements, extract evidence quotes, evaluate match coverage, and automatically channel missing skills into your learning roadmap."
      />

      <section className="card matcher-form" aria-label="Job Description Input Form">
        <div className="matcher-presets">
          <span className="skill-label">LOAD REALISTIC SAMPLE POSTINGS:</span>
          <div className="preset-buttons">
            <button
              type="button"
              className="tiny-chip"
              onClick={() => {
                setSelectedRole('Python Developer')
                loadSample('python')
              }}
            >
              <Icon name="briefcase" size={12} /> Python API Posting
            </button>
            <button
              type="button"
              className="tiny-chip"
              onClick={() => {
                setSelectedRole('Frontend Developer')
                loadSample('frontend')
              }}
            >
              <Icon name="briefcase" size={12} /> React Frontend Posting
            </button>
            <button
              type="button"
              className="tiny-chip"
              onClick={() => {
                setSelectedRole('Full Stack Developer')
                loadSample('fullstack')
              }}
            >
              <Icon name="briefcase" size={12} /> Full Stack Posting
            </button>
          </div>
        </div>

        <div className="matcher-controls-row" style={{ marginTop: '16px' }}>
          <label htmlFor="matcher-role-select">
            Target Career Role
            <select
              id="matcher-role-select"
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value)
                if (setRole) setRole(e.target.value)
              }}
            >
              {CATALOG_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label htmlFor="matcher-text" style={{ marginTop: '14px' }}>
          Job Description Text
          <textarea
            id="matcher-text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste text from a job description (e.g. required skills, responsibilities, tech stack)..."
            rows={7}
          />
        </label>

        <div className="form-footer">
          <span className="small-muted">
            {charCount}/20 min chars · {skills.length} skills in profile · Zero data persisted
          </span>
          <button
            type="button"
            className="button primary"
            disabled={!canMatch}
            onClick={() => match(description, selectedRole)}
          >
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true"></span> Extracting Skills & Evidence...
              </>
            ) : (
              <>
                <Icon name="target" size={16} /> Analyze Job Fit
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="inline-error" role="alert">
            <Icon name="close" size={13} /> {error}
          </div>
        )}
      </section>

      {/* Match Results */}
      {result && (
        <section className="matcher-results" aria-label="Job Fit Results">
          <div className="card gap-hero">
            <div
              className="coverage-ring"
              style={{ '--progress': `${result.skill_coverage_percentage}%` }}
              role="progressbar"
              aria-valuenow={Math.round(result.skill_coverage_percentage)}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div>
                <strong>
                  {Math.round(result.skill_coverage_percentage)}
                  <small>%</small>
                </strong>
                <span>coverage</span>
              </div>
            </div>

            <div className="gap-summary">
              <span className="eyebrow">EVIDENCE-BASED FIT ANALYSIS</span>
              <h2>
                {result.missing_skills.length > 0
                  ? `Identified ${result.missing_skills.length} skill gap${result.missing_skills.length > 1 ? 's' : ''} for this opportunity.`
                  : 'Congratulations! Your profile satisfies all required skills mentioned in this posting.'}
              </h2>
              <p>
                Coverage is measured against the specific required skills detected in this job description.
              </p>

              <div className="gap-meta">
                <span>
                  <b>{result.matched_skills.length}</b> matched profile skills
                </span>
                <span>
                  <b>{result.missing_skills.length}</b> required gaps
                </span>
                <span>
                  <b>{result.detected_optional_skills?.length || 0}</b> optional tech detected
                </span>
              </div>

              {/* Agentic Workflow Actions */}
              <div className="agent-cta-row" style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="button primary"
                  onClick={() => buildRoadmapFromGaps(result.suggested_learning_skills, selectedRole)}
                >
                  <Icon name="map" size={16} /> Tailor 30-Day Roadmap with These Gaps
                </button>
                <button type="button" className="button secondary" onClick={() => { saveMatch?.(selectedRole, description); setSaved(true) }} disabled={saved}>
                  <Icon name="file" size={16} /> {saved ? 'Match Saved' : 'Save Job Match'}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => askMentorAboutJob(result, selectedRole)}
                >
                  <Icon name="message" size={16} /> Consult Career Mentor for this Role
                </button>
              </div>
            </div>
          </div>

          <div className="gap-columns">
            <section className="card skill-list-card" aria-label="Matched Skills">
              <div className="card-heading">
                <h2>Matched in Profile</h2>
                <span className="count-badge good">{result.matched_skills.length}</span>
              </div>
              {result.matched_skills.length > 0 ? (
                <div className="large-chip-list">
                  {result.matched_skills.map((s) => (
                    <span className="large-chip good" key={s}>
                      <Icon name="check" size={14} /> {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="small-muted">None of the detected skills match your current profile.</p>
              )}
            </section>

            <section className="card skill-list-card" aria-label="Missing Gaps">
              <div className="card-heading">
                <h2>Required Gaps to Learn</h2>
                <span className="count-badge missing">{result.missing_skills.length}</span>
              </div>
              {result.missing_skills.length > 0 ? (
                <div className="large-chip-list">
                  {result.missing_skills.map((s) => (
                    <span className="large-chip missing" key={s}>
                      <Icon name="target" size={14} /> {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="small-muted">No required skills missing for this posting!</p>
              )}
            </section>

            <section className="card skill-list-card" aria-label="Extracted Evidence">
              <div className="card-heading">
                <h2>Job Evidence Snippets</h2>
                <span className="count-badge optional">{result.matched_evidence.length}</span>
              </div>
              {result.matched_evidence.length > 0 ? (
                <div className="evidence-list">
                  {result.matched_evidence.map((item) => (
                    <div key={item.skill} className="evidence-item">
                      <strong>{item.skill}</strong>
                      <span>&ldquo;...{item.evidence}...&rdquo;</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="small-muted">Direct evidence quotes appear when recognized keywords are detected.</p>
              )}
            </section>
          </div>
        </section>
      )}
    </>
  )
}
