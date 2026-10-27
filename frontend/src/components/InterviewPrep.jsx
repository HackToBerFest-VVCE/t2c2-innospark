import { useState } from 'react'
import { Icon, PageIntro } from './common/Icons'
import { CATALOG_ROLES } from '../constants/roles'

export function InterviewPrep({ role, setRole, plan, loading, error, prepare }) {
  const [completed, setCompleted] = useState(new Set())

  function toggleQuestion(id) {
    const next = new Set(completed)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setCompleted(next)
  }

  return (
    <>
      <PageIntro
        eyebrow="DETERMINISTIC INTERVIEW PREPARATION"
        title="Practice with a Clear Rubric"
        description="Get role-specific questions grounded in your current skill coverage, then rehearse answers against concrete criteria instead of guessing what good preparation looks like."
        action={<span className="data-source"><i aria-hidden="true"></i> No paid AI API required</span>}
      />

      <section className="card roadmap-empty" aria-label="Interview preparation controls">
        <div className="roadmap-controls">
          <label htmlFor="interview-role-select">
            Target Role
            <select id="interview-role-select" value={role} onChange={(event) => setRole(event.target.value)}>
              {CATALOG_ROLES.map((catalogRole) => <option key={catalogRole}>{catalogRole}</option>)}
            </select>
          </label>
          <button type="button" className="button primary" onClick={prepare} disabled={loading}>
            {loading ? <><span className="spinner" aria-hidden="true"></span> Preparing Questions...</> : <><Icon name="message" size={16} /> Prepare Interview</>}
          </button>
        </div>
        {error && <div className="inline-error" role="alert"><Icon name="close" size={13} /> {error}</div>}
      </section>

      {plan && (
        <>
          <section className="card interview-summary">
            <div>
              <span className="eyebrow">INTERVIEW SNAPSHOT · {plan.target_role}</span>
              <h2>{plan.readiness_note}</h2>
            </div>
            <div className="big-progress">
              <strong>{Math.round(plan.skill_coverage_percentage)}%</strong>
              <span>core coverage</span>
            </div>
          </section>

          <div className="interview-layout">
            <section className="card">
              <div className="card-heading">
                <h2>Practice questions</h2>
                <span className="count-badge good">{completed.size}/{plan.questions.length}</span>
              </div>
              <div className="interview-questions">
                {plan.questions.map((item) => (
                  <article key={item.id} className={completed.has(item.id) ? 'interview-question complete' : 'interview-question'}>
                    <label>
                      <input type="checkbox" checked={completed.has(item.id)} onChange={() => toggleQuestion(item.id)} />
                      <span>
                        <span className="eyebrow">{item.category} · Question {item.id}</span>
                        <strong>{item.question}</strong>
                      </span>
                    </label>
                    <ul>
                      {item.evaluation_criteria.map((criterion) => <li key={criterion}>{criterion}</li>)}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <aside className="card">
              <span className="eyebrow">FOCUSED STUDY PLAN</span>
              <h2>Before you interview</h2>
              <ol className="interview-study-plan">
                {plan.study_plan.map((step) => <li key={step}>{step}</li>)}
              </ol>
              <div className="notice-bar">
                <Icon name="info" size={15} />
                <span>Practice answers aloud. The checklist tracks preparation locally for this session and does not claim interview success.</span>
              </div>
            </aside>
          </div>
        </>
      )}
    </>
  )
}
