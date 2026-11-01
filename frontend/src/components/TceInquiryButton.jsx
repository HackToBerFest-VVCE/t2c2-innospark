import { useState } from 'react'
import { Icon } from './common/Icons'

export function TceInquiryButton({ navigate }) {
  const [isOpen, setIsOpen] = useState(false)
  const [quickQuestion, setQuickQuestion] = useState('')

  const handleAsk = (e) => {
    e.preventDefault()
    if (!quickQuestion.trim()) return
    navigate?.('mentor')
    setIsOpen(false)
    setQuickQuestion('')
  }

  return (
    <>
      <div className="tce-floating-inquiry-container">
        <button
          type="button"
          className="tce-businessbt"
          onClick={() => setIsOpen(true)}
          aria-label="SkillBridge AI Quick Advisor"
          title="Quick Career Advisor"
        >
          <span className="tce-businessbt-tooltip">AI Career Advisor</span>
          <span className="tce-businessbt-inner-icon">
            <Icon name="sparkle" size={24} />
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="tce-modal-overlay" onClick={() => setIsOpen(false)}>
          <div
            className="tce-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tce-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tce-modal-header">
              <div className="tce-modal-header-branding">
                <span className="tce-modal-badge">SKILLBRIDGE AI ADVISOR</span>
                <h3 id="tce-modal-title">Instant Career Mentoring</h3>
              </div>
              <button
                type="button"
                className="tce-modal-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close Advisor Dialog"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="tce-modal-body">
              <form onSubmit={handleAsk} className="tce-inquiry-form">
                <p className="tce-inquiry-subtext">
                  Ask our profile-grounded career mentor anything about your target role, skill gaps, or interview readiness.
                </p>

                <div className="tce-form-field">
                  <label htmlFor="quick-query">Your Career Query</label>
                  <textarea
                    id="quick-query"
                    rows={4}
                    required
                    placeholder="e.g. Which skills should I prioritize first to qualify for Backend Developer roles?"
                    value={quickQuestion}
                    onChange={(e) => setQuickQuestion(e.target.value)}
                  />
                </div>

                <div className="tce-quick-suggestions">
                  <span className="tce-sugg-label">Quick Prompts:</span>
                  <button
                    type="button"
                    className="tce-sugg-pill"
                    onClick={() => setQuickQuestion('How can I close my skill gaps in 30 days?')}
                  >
                    Close skill gaps in 30 days
                  </button>
                  <button
                    type="button"
                    className="tce-sugg-pill"
                    onClick={() => setQuickQuestion('What interview questions should I prepare for?')}
                  >
                    Interview preparation
                  </button>
                </div>

                <div className="tce-modal-actions">
                  <button
                    type="button"
                    className="tce-btn-secondary"
                    onClick={() => {
                      setIsOpen(false)
                      navigate?.('gap')
                    }}
                  >
                    View Skill Gap Matrix
                  </button>
                  <button type="submit" className="tce-btn-primary">
                    Launch AI Mentor →
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
