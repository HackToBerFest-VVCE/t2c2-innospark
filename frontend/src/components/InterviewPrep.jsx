import { useMemo, useState } from 'react'
import { Icon, PageIntro } from './common/Icons'
import { CATALOG_ROLES } from '../constants/roles'

export function InterviewPrep({
  role, setRole, plan, loading, error, prepare, evaluateAnswer, saveSession, sessions = [], jobMatch, focusSkills = [],
}) {
  const [questionCount, setQuestionCount] = useState(6)
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [feedback, setFeedback] = useState({})
  const [evaluationLoading, setEvaluationLoading] = useState(false)
  const [evaluationError, setEvaluationError] = useState('')
  const [sessionSaved, setSessionSaved] = useState(false)
  const currentQuestion = plan?.questions?.[currentIndex]
  const completedCount = Object.keys(feedback).length
  const sessionScore = useMemo(() => {
    const scores = Object.values(feedback).map((item) => item.score)
    return scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0
  }, [feedback])

  async function submitAnswer() {
    if (!currentQuestion || !answers[currentQuestion.id]?.trim()) return
    setEvaluationLoading(true)
    setEvaluationError('')
    try {
      const result = await evaluateAnswer(currentQuestion.question, answers[currentQuestion.id], currentQuestion.evaluation_criteria)
      setFeedback((current) => ({ ...current, [currentQuestion.id]: result }))
    } catch (evaluationFailure) {
      setEvaluationError(evaluationFailure.message)
    } finally {
      setEvaluationLoading(false)
    }
  }

  async function completeSession() {
    await saveSession({
      target_role: plan.target_role,
      difficulty: plan.difficulty,
      question_count: plan.question_count,
      score: sessionScore,
      answers: plan.questions.map((question) => ({ question_id: question.id, answer: answers[question.id] || '', feedback: feedback[question.id] || null })),
      recurring_gaps: focusSkills,
    })
    setSessionSaved(true)
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
          <label>
            Interview length
            <select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))}>
              {[3, 6, 9, 12].map((count) => <option key={count} value={count}>{count} questions</option>)}
            </select>
          </label>
          <label>
            Difficulty
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
              <option>Foundational</option><option>Intermediate</option><option>Advanced</option>
            </select>
          </label>
          <button type="button" className="button primary" onClick={() => prepare({ questionCount, difficulty })} disabled={loading}>
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
              <div className="card-heading"><h2>Mock interview</h2><span className="count-badge good">{completedCount}/{plan.questions.length} evaluated</span></div>
              {currentQuestion && (
                <article className="interview-question">
                  <span className="eyebrow">{currentQuestion.type} · Question {currentQuestion.id} · {currentQuestion.source}</span>
                  <strong>{currentQuestion.question}</strong>
                  <p className="small-muted">Hint: {currentQuestion.hint}</p>
                  <textarea rows={7} value={answers[currentQuestion.id] || ''} onChange={(event) => setAnswers((current) => ({ ...current, [currentQuestion.id]: event.target.value }))} placeholder="Write your answer with context, action, reasoning, and result..." />
                  <div className="interview-action-row">
                    <button type="button" className="button primary" onClick={submitAnswer} disabled={evaluationLoading || !answers[currentQuestion.id]?.trim()}>{evaluationLoading ? 'Evaluating...' : 'Submit answer'}</button>
                    {currentIndex > 0 && <button type="button" className="button secondary" onClick={() => setCurrentIndex((index) => index - 1)}>Previous</button>}
                    {currentIndex < plan.questions.length - 1 && <button type="button" className="button secondary" onClick={() => setCurrentIndex((index) => index + 1)}>Next question</button>}
                  </div>
                  {evaluationError && <div className="inline-error" role="alert">{evaluationError}</div>}
                  {feedback[currentQuestion.id] && <div className="interview-feedback"><strong>Score: {Math.round(feedback[currentQuestion.id].score)}%</strong><p>{feedback[currentQuestion.id].coaching_feedback}</p><b>Strengths</b><p>{feedback[currentQuestion.id].strengths.join(' ') || 'Keep building specificity.'}</p><b>Missing concepts</b><p>{feedback[currentQuestion.id].missing_concepts.join(' ') || 'No major gaps flagged by this rubric.'}</p></div>}
                </article>
              )}
              {completedCount === plan.questions.length && !sessionSaved && <button type="button" className="button primary" onClick={completeSession}>Complete and save session</button>}
              {sessionSaved && <div className="notice-bar"><Icon name="check" size={15} /> Session saved. Continue practicing the recurring topics: {focusSkills.join(', ') || 'role fundamentals'}.</div>}
            </section>

            <aside className="card">
              <span className="eyebrow">FOCUSED STUDY PLAN</span>
              <h2>Before you interview</h2>
              <ol className="interview-study-plan">
                {plan.study_plan.map((step) => <li key={step}>{step}</li>)}
              </ol>
              {jobMatch?.detected_required_skills?.length > 0 && <p className="small-muted">This plan includes requirements from your latest job comparison.</p>}
              {sessions.length > 0 && <p className="small-muted">Completed sessions: {sessions.length}. Latest score: {Math.round(sessions[0].score)}%.</p>}
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
