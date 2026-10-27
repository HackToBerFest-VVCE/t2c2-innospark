import { useState } from 'react'
import { Icon, PageIntro } from './common/Icons'
import { CATALOG_ROLES } from '../constants/roles'

const PROMPT_SUGGESTIONS = [
  'What should I learn next for my target role?',
  'How do I prepare for technical interviews for this role?',
  'What portfolio project will stand out on GitHub?',
  'How can I improve my resume bullets for this role?',
  'Am I ready to transition into this role?',
]

export function MentorPage({
  role,
  setRole,
  skills,
  answer,
  loading,
  error,
  ask,
  coverage,
  navigate,
}) {
  const [question, setQuestion] = useState('What should I learn next for my target role?')

  function handleSelectPrompt(prompt) {
    setQuestion(prompt)
    ask(prompt, role)
  }

  return (
    <>
      <PageIntro
        eyebrow="PROFILE-GROUNDED CAREER COACH"
        title="Career Mentor & Strategic Advisory"
        description="Receive strategic guidance grounded strictly in your resume evidence, confirmed skills, missing gaps, and target role requirements. Ask about interview prep, portfolio architecture, resume tailoring, or learning order."
        action={
          <span className="data-source">
            <i aria-hidden="true"></i> Grounded in Profile Evidence
          </span>
        }
      />

      <section className="card mentor-form" aria-label="Mentor Interaction">
        <div className="mentor-profile">
          <div className="avatar" aria-hidden="true">JS</div>
          <div>
            <strong>Jordan Smith · Target: {role}</strong>
            <span>
              {skills.length} verified profile skills · {coverage !== undefined ? `${Math.round(coverage)}% core coverage` : 'Catalog grounded'}
            </span>
          </div>

          <div style={{ marginLeft: 'auto' }}>
            <label htmlFor="mentor-role-select" className="sr-only">Change target role</label>
            <select
              id="mentor-role-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="role-dropdown"
              style={{ padding: '6px 10px', fontSize: '11px' }}
            >
              {CATALOG_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick prompt suggestions */}
        <div className="mentor-presets" style={{ marginBottom: '16px' }}>
          <span className="skill-label">QUICK COACHING PROMPTS:</span>
          <div className="preset-buttons" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
            {PROMPT_SUGGESTIONS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="tiny-chip"
                onClick={() => handleSelectPrompt(prompt)}
                disabled={loading}
              >
                <Icon name="message" size={11} /> {prompt}
              </button>
            ))}
          </div>
        </div>

        <label htmlFor="mentor-question-input">
          Your Career Question
          <textarea
            id="mentor-question-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder="Ask about learning priorities, interview preparation, portfolio ideas, or resume tailoring..."
          />
        </label>

        <div className="form-footer">
          <span className="small-muted">
            Advice references your evaluated {role} skills profile.
          </span>
          <button
            type="button"
            className="button primary"
            disabled={loading || !question.trim()}
            onClick={() => ask(question, role)}
          >
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true"></span> Formulating Guidance...
              </>
            ) : (
              <>
                <Icon name="message" size={16} /> Consult Career Mentor
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

      {/* Answer Section */}
      {answer && (
        <section className="card mentor-answer" aria-label="Mentor Guidance Response">
          <div className="card-heading">
            <div>
              <span className="eyebrow">STRATEGIC GUIDANCE · {answer.target_role}</span>
              <h2>{answer.response}</h2>
            </div>
          </div>

          <div className="mentor-coverage">
            Current Required-Skill Coverage for {answer.target_role}:{' '}
            <strong>{Math.round(answer.skill_coverage_percentage)}%</strong>
          </div>

          <h3>Actionable Next Steps</h3>
          <ol className="mentor-steps">
            {answer.next_steps?.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <div className="mentor-actions-footer" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="button secondary"
              onClick={() => navigate('roadmap')}
            >
              <Icon name="map" size={14} /> Open 30-Day Learning Roadmap
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => navigate('gap')}
            >
              <Icon name="target" size={14} /> View Detailed Skill Gaps
            </button>
          </div>

          <p className="small-muted" style={{ marginTop: '20px' }}>
            <Icon name="check" size={13} /> {answer.disclaimer}
          </p>
        </section>
      )}
    </>
  )
}
