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
  saveProject,
  savedProjects = [],
  updateProject,
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
          {project && <button type="button" className="button secondary" onClick={saveProject}>Save Project Plan</button>}
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
            <h3>Learning objectives</h3>
            <ul className="portfolio-checklist">
              {(project.learning_objectives || []).map((objective) => <li key={objective}>{objective}</li>)}
            </ul>
            <div className="small-muted">Estimated effort: {project.estimated_hours} hours · {project.difficulty}</div>
          </section>

          <section className="card">
            <div className="card-heading"><h2>Build milestones</h2><span className="count-badge good">{project.milestones.length}</span></div>
            <div className="portfolio-milestones">
              {project.milestones.map((milestone) => (
                <article key={milestone.phase}>
                  <span className="eyebrow">{milestone.phase}</span>
                  <strong>{milestone.title || milestone.phase}</strong>
                  <p>{milestone.deliverable}</p>
                  <div className="small-muted">{milestone.skills.join(' · ')}</div>
                  <div className="small-muted">{milestone.estimated_hours}h · Prerequisites: {milestone.prerequisites.join(', ') || 'None'}</div>
                  <div className="small-muted">{milestone.completion_criteria}</div>
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
      <section className="card portfolio-saved-projects">
        <div className="card-heading"><h2>Saved project plans</h2><span className="count-badge good">{savedProjects.length}</span></div>
        {savedProjects.length === 0 ? <p className="small-muted">Save a recommendation to track milestones and add verified project evidence later.</p> : savedProjects.map((saved) => (
          <article className="saved-project-row" key={saved.id}>
            <div><strong>{saved.title}</strong><span>{saved.target_role} · {saved.status}</span></div>
            <select value={saved.status} onChange={(event) => updateProject(saved.id, { status: event.target.value })}>
              <option value="planned">Planned</option><option value="in_progress">In Progress</option><option value="completed">Completed</option>
            </select>
            <label className="project-url-field">
              GitHub URL
              <input
                type="url"
                placeholder="https://github.com/..."
                value={saved.github_url || ''}
                onChange={(event) => updateProject(saved.id, { github_url: event.target.value })}
              />
            </label>
            <label className="project-url-field">
              Demo URL
              <input
                type="url"
                placeholder="https://..."
                value={saved.demo_url || ''}
                onChange={(event) => updateProject(saved.id, { demo_url: event.target.value })}
              />
            </label>
            <div className="project-milestone-progress">
              <span>{(saved.completed_milestones || []).length}/{saved.milestones?.length || 0} milestones</span>
              {saved.milestones?.map((milestone, index) => (
                <label key={milestone.phase}>
                  <input
                    type="checkbox"
                    checked={(saved.completed_milestones || []).includes(index)}
                    onChange={() => {
                      const completed = new Set(saved.completed_milestones || [])
                      if (completed.has(index)) completed.delete(index)
                      else completed.add(index)
                      updateProject(saved.id, { completed_milestones: [...completed] })
                    }}
                  />
                  {milestone.phase}
                </label>
              ))}
            </div>
          </article>
        ))}
      </section>
    </>
  )
}
