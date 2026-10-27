import { useState } from 'react'
import { Icon, PageIntro } from './common/Icons'
import { CATALOG_ROLES } from '../constants/roles'

export function PortfolioProjects({
  role,
  setRole,
  skills,
  project,
  loading,
  error,
  generate,
}) {
  const [copied, setCopied] = useState(false)

  async function copyBullets() {
    if (!project?.resume_bullets) return
    await navigator.clipboard.writeText(project.resume_bullets.map((bullet) => `- ${bullet}`).join('\n'))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <PageIntro
        eyebrow="PORTFOLIO PROJECT BUILDER"
        title="Turn Skill Gaps into Proof"
        description="Generate one focused, role-relevant project that teaches your missing skills and produces evidence you can show to a recruiter."
        action={<span className="data-source"><i aria-hidden="true"></i> Deterministic · Profile grounded</span>}
      />

      <section className="card roadmap-empty" aria-label="Portfolio project generator">
        <div className="roadmap-controls">
          <label htmlFor="portfolio-role-select">
            Target Role
            <select id="portfolio-role-select" value={role} onChange={(event) => setRole(event.target.value)}>
              {CATALOG_ROLES.map((catalogRole) => <option key={catalogRole}>{catalogRole}</option>)}
            </select>
          </label>
          <div className="small-muted">
            <strong>{skills.length}</strong> verified profile skill{skills.length === 1 ? '' : 's'}
          </div>
          <button type="button" className="button primary" onClick={generate} disabled={loading}>
            {loading ? <><span className="spinner" aria-hidden="true"></span> Designing Project...</> : <><Icon name="spark" size={16} /> Generate Project</>}
          </button>
        </div>
        {error && <div className="inline-error" role="alert"><Icon name="close" size={13} /> {error}</div>}
      </section>

      {project && (
        <div className="portfolio-project-grid">
          <section className="card">
            <span className="eyebrow">RECOMMENDED BUILD · {project.target_role}</span>
            <h2>{project.title}</h2>
            <p>{project.problem_statement}</p>
            <h3>Why this project?</h3>
            <p className="small-muted">{project.why_this_project}</p>
            <h3>Recommended stack</h3>
            <div className="large-chip-list">
              {project.recommended_stack.map((item) => <span className="large-chip optional" key={item}>{item}</span>)}
            </div>
            <h3>Priority skills</h3>
            <div className="large-chip-list">
              {project.priority_skills.map((item) => <span className="large-chip missing" key={item}><Icon name="target" size={14} />{item}</span>)}
            </div>
          </section>

          <section className="card">
            <div className="card-heading"><h2>Build milestones</h2><span className="count-badge good">{project.milestones.length}</span></div>
            <div className="portfolio-milestones">
              {project.milestones.map((milestone) => (
                <article key={milestone.phase}>
                  <span className="eyebrow">{milestone.phase}</span>
                  <p>{milestone.deliverable}</p>
                  <div className="small-muted">{milestone.skills.join(' · ')}</div>
                </article>
              ))}
            </div>
            <h3>Stretch goal</h3>
            <p className="small-muted">{project.stretch_goal}</p>
          </section>

          <section className="card">
            <div className="card-heading"><h2>GitHub launch checklist</h2></div>
            <ul className="portfolio-checklist">
              {project.github_checklist.map((item) => <li key={item}><Icon name="check" size={14} />{item}</li>)}
            </ul>
          </section>

          <section className="card">
            <div className="card-heading">
              <h2>Resume-ready bullets</h2>
              <button type="button" className="ghost-button" onClick={copyBullets}>{copied ? 'Copied' : 'Copy bullets'}</button>
            </div>
            <ul className="portfolio-checklist">
              {project.resume_bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
            </ul>
          </section>
        </div>
      )}
    </>
  )
}
