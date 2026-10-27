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
  reviewGaps,
}) {
  const [description, setDescription] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [selectedRole, setSelectedRole] = useState(role || 'Python Developer')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fileError, setFileError] = useState('')

  function loadSample(key) {
    setDescription(SAMPLE_JOB_DESCRIPTIONS[key] || '')
    setFileError('')
  }

  const charCount = description.trim().length
  const canMatch = charCount >= 20 && charCount <= 20000 && !loading

  function handleFile(file) {
    setFileError('')
    if (!file) return
    if (!['text/plain', 'text/markdown'].includes(file.type) && !/\.(txt|md)$/i.test(file.name)) {
      setFileError('Unsupported file. Upload a .txt or .md job description.')
      return
    }

    if (file.size > 20000) {
      setFileError('This file is too large. Job descriptions must be 20,000 characters or fewer.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setDescription(String(reader.result || ''))
    reader.onerror = () => setFileError('The job description file could not be read.')
    reader.readAsText(file)
  }

  async function handleSave() {
    if (!saveMatch || saving || saved) return
    setSaving(true)
    setFileError('')
    try {
      await saveMatch(jobTitle || selectedRole, company, description)
      setSaved(true)
    } catch (saveError) {
      setFileError(`Could not save this comparison: ${saveError.message}`)
    } finally {
      setSaving(false)
    }
  }

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
          <label>
            Job Title (optional)
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Backend Engineer" />
          </label>
          <label>
            Company (optional)
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Labs" />
          </label>
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

        <label className="matcher-file-input" htmlFor="matcher-file">
          Upload text file (optional)
          <input id="matcher-file" type="file" accept=".txt,.md,text/plain,text/markdown" onChange={(e) => handleFile(e.target.files?.[0])} />
        </label>

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
            {charCount}/20–20,000 chars · {skills.length} skills in profile · Comparisons save only when requested
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
        {fileError && <div className="inline-error" role="alert"><Icon name="close" size={13} /> {fileError}</div>}
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
                  {result.final_match_score == null ? '—' : Math.round(result.final_match_score)}
                  <small>%</small>
                </strong>
                <span>match score</span>
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
                {result.profile_data_available
                  ? 'Final score uses 70% weighted required-skill coverage and 30% preferred-skill coverage.'
                  : 'Add profile or resume skills before comparing. A match score is not available without profile evidence.'}
              </p>

              <div className="gap-meta">
                <span><b>{result.matched_skills.length}</b> matched profile skills</span>
                <span>
                  <b>{result.missing_skills.length}</b> required gaps
                </span>
                <span>
                  <b>{result.required_skill_coverage_percentage == null ? '—' : `${Math.round(result.required_skill_coverage_percentage)}%`}</b> required coverage
                </span>
                <span><b>{result.preferred_skill_coverage_percentage == null ? '—' : `${Math.round(result.preferred_skill_coverage_percentage)}%`}</b> preferred coverage</span>
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
                <button type="button" className="button secondary" onClick={handleSave} disabled={saved || saving}>
                  <Icon name="file" size={16} /> {saved ? 'Match Saved' : 'Save Job Match'}
                </button>
                <button type="button" className="button secondary" onClick={reviewGaps}>
                  <Icon name="target" size={16} /> Review Skill Gaps
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
            <section className="card skill-list-card" aria-label="Requirement classification">
              <div className="card-heading"><h2>Requirement Classification</h2></div>
              <div className="requirement-list">
                {(result.requirement_details || []).map((item) => (
                  <div className="requirement-item" key={item.skill}>
                    <div>
                      <strong>{item.skill}</strong>
                      <span>{item.importance} · {item.category}</span>
                    </div>
                    <b className={`requirement-status ${item.status}`}>{item.status.replace('_', ' ')}</b>
                    <p>{item.explanation}</p>
                  </div>
                ))}
              </div>
              <p className="scoring-note">{result.scoring_explanation}</p>
            </section>
            <section className="card skill-list-card" aria-label="Actionable recommendations">
              <div className="card-heading"><h2>Recommended Next Steps</h2></div>
              {result.recommendations?.length ? (
                <div className="recommendation-list">
                  {result.recommendations.map((item) => <p key={item.skill}><Icon name="target" size={13} /> <b>{item.skill}</b> — {item.reason}</p>)}
                </div>
              ) : <p className="small-muted">No additional requirement gaps were identified.</p>}
              {result.experience_requirements?.length > 0 && (
                <div className="job-requirements"><b>Experience and qualifications found</b>{result.experience_requirements.map((item) => <span key={item}>{item}</span>)}</div>
              )}
              {result.soft_skills?.length > 0 && <p className="small-muted">Soft skills mentioned: {result.soft_skills.join(', ')}.</p>}
            </section>
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
