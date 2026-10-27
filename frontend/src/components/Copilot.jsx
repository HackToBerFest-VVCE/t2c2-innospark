import { useState } from 'react'
import { Icon, PageIntro } from './common/Icons'

const QUICK_PROMPTS = [
  'What should I focus on next?',
  'Which skill gap matters most for my target role?',
  'How should I prepare for an interview?',
  'What evidence should I build for my portfolio?',
]

const ACTION_LABELS = {
  accepted: 'Accepted',
  dismissed: 'Dismissed',
  postponed: 'Postponed',
  completed: 'Completed',
  suggested: 'Suggested',
}

export function Copilot({
  dashboard,
  loading,
  error,
  refresh,
  updateAction,
  updatePreferences,
  startWorkflow,
  updateWorkflowStep,
  createPlanTask,
  updatePlanTask,
  deletePlanTask,
  applications,
  navigate,
  ask,
  chatLoading,
  chatError,
}) {
  const [question, setQuestion] = useState('')
  const [selectedApplication, setSelectedApplication] = useState('')
  const [workflowError, setWorkflowError] = useState('')
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [planTask, setPlanTask] = useState({
    title: '',
    description: '',
    period: 'weekly',
    estimated_minutes: '',
    destination: 'roadmap',
  })
  const [planError, setPlanError] = useState('')
  const [editingPlanTask, setEditingPlanTask] = useState(null)
  const [messages, setMessages] = useState([])

  async function handleStartWorkflow() {
    if (!selectedApplication) return
    setWorkflowError('')
    try {
      await startWorkflow(Number(selectedApplication))
    } catch (workflowErrorValue) {
      setWorkflowError(workflowErrorValue.message)
    }
  }

  async function handleCreatePlanTask(event) {
    event.preventDefault()
    setPlanError('')
    try {
      await createPlanTask({
        ...planTask,
        estimated_minutes: planTask.estimated_minutes ? Number(planTask.estimated_minutes) : null,
      })
      setPlanTask({ title: '', description: '', period: 'weekly', estimated_minutes: '', destination: 'roadmap' })
      setShowPlanForm(false)
    } catch (planErrorValue) {
      setPlanError(planErrorValue.message)
    }
  }

  async function handleEditPlanTask(task) {
    const newTitle = editingPlanTask?.id === task.id ? editingPlanTask.title.trim() : task.title
    if (!newTitle) {
      setPlanError('Task title cannot be empty.')
      return
    }
    try {
      await updatePlanTask(task.id.replace('plan:', ''), { title: newTitle })
      setEditingPlanTask(null)
    } catch (planErrorValue) {
      setPlanError(planErrorValue.message)
    }
  }

  async function handleCompletePlanTask(task) {
    try {
      if (task.type === 'custom') {
        await updatePlanTask(task.id.replace('plan:', ''), { completed: true })
        return
      }
      if (task.type === 'roadmap') {
        navigate(task.destination)
        return
      }
      await updateAction(task.id, 'completed')
    } catch (planErrorValue) {
      setPlanError(planErrorValue.message)
    }
  }

  async function handleRemovePlanTask(task) {
    try {
      await deletePlanTask(task.id.replace('plan:', ''))
    } catch (planErrorValue) {
      setPlanError(planErrorValue.message)
    }
  }

  function submitQuestion(event) {
    event.preventDefault()
    handleAsk(question.trim())
  }

  async function handleAsk(prompt) {
    if (!prompt.trim() || chatLoading) return
    const userMessage = { role: 'user', content: prompt.trim() }
    const context = messages.slice(-6).map(({ role, content }) => ({ role, content }))
    setMessages((current) => [...current, userMessage])
    setQuestion('')
    try {
      const reply = await ask(prompt.trim(), context)
      if (reply) {
        setMessages((current) => [...current, {
          role: 'assistant',
          content: reply.response,
          destination: reply.destination,
          next_steps: reply.next_steps,
          basis: reply.basis,
        }])
      }
    } catch {
      // The parent surfaces API errors while retaining the user's question.
    }
  }

  const workflows = dashboard?.workflows || []

  return (
    <>
      <PageIntro
        eyebrow="CAREER COPILOT"
        title="Your next career move, made clearer"
        description="A single workspace for grounded recommendations, personal plans, application preparation, and progress. Actions are suggestions until you choose what to do."
        action={
          <button type="button" className="button secondary" onClick={refresh} disabled={loading}>
            <Icon name="refresh" size={15} /> Refresh
          </button>
        }
      />

      {loading && <div className="card copilot-state">Loading your saved career workspace…</div>}
      {!loading && error && (
        <div className="card copilot-state inline-error" role="alert">
          <Icon name="close" size={14} /> {error}
          <button type="button" className="button secondary compact" onClick={refresh}>Try again</button>
        </div>
      )}

      {!loading && !error && dashboard && (
        <>
          <section className="copilot-hero card">
            <div className="copilot-hero-icon"><Icon name="sparkle" size={25} /></div>
            <div className="copilot-hero-copy">
              <span className="eyebrow">PERSONALIZED CAREER SUMMARY</span>
              <h2>{dashboard.has_saved_data ? dashboard.target_role : 'Set your target role'}</h2>
              <p>{dashboard.summary}</p>
            </div>
            <div className="copilot-coverage">
              <strong>{dashboard.skill_coverage_percentage === null ? '—' : `${dashboard.skill_coverage_percentage}%`}</strong>
              <span>{dashboard.skill_coverage_percentage === null ? 'coverage unavailable' : 'required skill coverage'}</span>
            </div>
          </section>

          <div className="copilot-metrics">
            <article className="copilot-metric card">
              <span>ROADMAP PROGRESS</span>
              <strong>{dashboard.roadmap_progress.completed}/{dashboard.roadmap_progress.total}</strong>
              <button type="button" onClick={() => navigate('roadmap')}>Open roadmap <Icon name="arrow" size={13} /></button>
            </article>
            <article className="copilot-metric card">
              <span>PRIORITY SKILL GAPS</span>
              <strong>{dashboard.skill_coverage_percentage === null ? '—' : dashboard.missing_required_skills.length}</strong>
              <button type="button" onClick={() => navigate('gap')}>Review skill gaps <Icon name="arrow" size={13} /></button>
            </article>
            <article className="copilot-metric card">
              <span>APPLICATION REMINDERS</span>
              <strong>{dashboard.upcoming_reminders.length}</strong>
              <button type="button" onClick={() => navigate('applications')}>Review applications <Icon name="arrow" size={13} /></button>
            </article>
          </div>

          <section className="copilot-layout">
            <div className="copilot-main-column">
              <section className="card copilot-section">
                <div className="card-heading">
                  <div><span className="eyebrow">RANKED USING SAVED PROGRESS</span><h2>Recommended next actions</h2></div>
                </div>
                {dashboard.actions.length === 0 && (
                  <div className="empty-state">
                    <Icon name="sparkle" size={28} />
                    <h3>Nothing to recommend yet</h3>
                    <p>Add a target skill profile, save a job comparison, or track an application to get recommendations grounded in your data.</p>
                    <button type="button" className="button secondary" onClick={() => navigate('settings')}>Review career goals</button>
                  </div>
                )}
                <div className="copilot-action-list">
                  {dashboard.actions.slice(0, 6).map((action) => (
                    <article className="copilot-action" key={action.id}>
                      <div className="copilot-action-rank">{action.priority}</div>
                      <div className="copilot-action-content">
                        <div className="copilot-action-title">
                          <strong>{action.title}</strong>
                          <span className={`copilot-status status-${action.status}`}>{ACTION_LABELS[action.status] || action.status}</span>
                        </div>
                        <p>{action.reason}</p>
                        <span className="copilot-benefit">{action.expected_benefit}</span>
                        <div className="copilot-action-meta">
                          {action.effort_minutes !== null && <span><Icon name="clock" size={13} /> {action.effort_minutes} min estimate</span>}
                          {action.due_date && <span><Icon name="clock" size={13} /> Due {action.due_date}</span>}
                        </div>
                        <div className="copilot-action-controls">
                          <button type="button" className="button secondary compact" onClick={() => navigate(action.destination)}>Open {action.destination}</button>
                          {action.status !== 'accepted' && action.status !== 'completed' && (
                            <button type="button" className="text-button" onClick={() => updateAction(action.id, 'accepted')}>Accept</button>
                          )}
                          {action.status !== 'completed' && (
                            action.type === 'roadmap'
                              ? <button type="button" className="text-button" onClick={() => navigate(action.destination)}>Open task</button>
                              : <button type="button" className="text-button" onClick={() => updateAction(action.id, 'completed')}>Mark reviewed</button>
                          )}
                          {action.status !== 'dismissed' && (
                            <button type="button" className="text-button muted" onClick={() => updateAction(action.id, 'postponed')}>Later</button>
                          )}
                          <button type="button" className="text-button muted" onClick={() => updateAction(action.id, 'dismissed')}>Dismiss</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                {dashboard.ranking_rules?.length > 0 && (
                  <details className="copilot-rules">
                    <summary>How recommendations are ranked</summary>
                    <ul>{dashboard.ranking_rules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
                  </details>
                )}
              </section>

              <section className="copilot-plan-grid">
                <article className="card copilot-section">
                  <div className="copilot-plan-heading">
                    <div><span className="eyebrow">FITS YOUR DAILY STUDY TIME</span><h2>Today</h2></div>
                    <button type="button" className="button secondary compact" onClick={() => setShowPlanForm(!showPlanForm)}>{showPlanForm ? 'Close' : 'Add task'}</button>
                  </div>
                  {dashboard.daily_plan.length ? (
                    <ul className="copilot-plan-list">
                      {dashboard.daily_plan.map((item) => (
                        <li key={item.id}>
                          {item.type === 'custom' && editingPlanTask?.id === item.id ? (
                            <input className="copilot-edit-task" value={editingPlanTask.title} onChange={(event) => setEditingPlanTask({ ...editingPlanTask, title: event.target.value })} aria-label="Edit task title" />
                          ) : (
                            <button type="button" className="copilot-plan-link" onClick={() => navigate(item.destination)}>{item.title}</button>
                          )}
                          <span>{item.effort_minutes === null ? 'Effort unavailable' : `${item.effort_minutes} min`}</span>
                          {item.type === 'custom' && (
                            <button type="button" className="text-button" onClick={() => editingPlanTask?.id === item.id ? handleEditPlanTask(item) : setEditingPlanTask({ id: item.id, title: item.title })}>{editingPlanTask?.id === item.id ? 'Save' : 'Edit'}</button>
                          )}
                          <button type="button" className="text-button" onClick={() => handleCompletePlanTask(item)}>Done</button>
                          {item.type === 'custom' && <button type="button" className="text-button muted" onClick={() => handleRemovePlanTask(item)}>Remove</button>}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="small-muted">No active suggestions fit today. You can review postponed actions above.</p>}
                  {showPlanForm && (
                    <form className="copilot-plan-form" onSubmit={handleCreatePlanTask}>
                      <label>Task title<input required maxLength="160" value={planTask.title} onChange={(event) => setPlanTask({ ...planTask, title: event.target.value })} /></label>
                      <label>Description<input maxLength="500" value={planTask.description} onChange={(event) => setPlanTask({ ...planTask, description: event.target.value })} /></label>
                      <div className="copilot-plan-form-row">
                        <label>Plan for<select value={planTask.period} onChange={(event) => setPlanTask({ ...planTask, period: event.target.value })}><option value="daily">Today</option><option value="weekly">This week</option></select></label>
                        <label>Effort (minutes)<input type="number" min="5" max="240" value={planTask.estimated_minutes} onChange={(event) => setPlanTask({ ...planTask, estimated_minutes: event.target.value })} /></label>
                      </div>
                      <label>Related feature<select value={planTask.destination} onChange={(event) => setPlanTask({ ...planTask, destination: event.target.value })}><option value="gap">Skill Gap</option><option value="roadmap">Learning Roadmap</option><option value="portfolio">Portfolio</option><option value="interview">Interview Prep</option><option value="applications">Applications</option><option value="resume">Resume Analyzer</option><option value="matcher">Job Matcher</option></select></label>
                      {planError && <div className="inline-error" role="alert">{planError}</div>}
                      <button type="submit" className="button primary compact">Save plan task</button>
                    </form>
                  )}
                </article>
                <article className="card copilot-section">
                  <span className="eyebrow">BASED ON SAVED CAREER RECORDS</span>
                  <h2>This week</h2>
                  {dashboard.weekly_plan.length ? (
                    <ul className="copilot-plan-list">
                      {dashboard.weekly_plan.map((item) => (
                        <li key={item.id}>
                          {item.type === 'custom' && editingPlanTask?.id === item.id ? (
                            <input className="copilot-edit-task" value={editingPlanTask.title} onChange={(event) => setEditingPlanTask({ ...editingPlanTask, title: event.target.value })} aria-label="Edit task title" />
                          ) : (
                            <button type="button" className="copilot-plan-link" onClick={() => navigate(item.destination)}>{item.title}</button>
                          )}
                          <span>{item.due_date || 'Suggested'}</span>
                          {item.type === 'custom' && <button type="button" className="text-button" onClick={() => editingPlanTask?.id === item.id ? handleEditPlanTask(item) : setEditingPlanTask({ id: item.id, title: item.title })}>{editingPlanTask?.id === item.id ? 'Save' : 'Edit'}</button>}
                          {item.type === 'custom' && <button type="button" className="text-button" onClick={() => handleCompletePlanTask(item)}>Done</button>}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="small-muted">No weekly actions are available yet.</p>}
                </article>
              </section>

              <section className="card copilot-section">
                <div className="card-heading">
                  <div><span className="eyebrow">EXPLICIT, REVIEWABLE STEPS</span><h2>Application preparation workflows</h2></div>
                </div>
                <div className="copilot-workflow-start">
                  <label>
                    Choose a saved application
                    <select value={selectedApplication} onChange={(event) => setSelectedApplication(event.target.value)}>
                      <option value="">Select an application</option>
                      {applications.map((application) => (
                        <option key={application.id} value={application.id}>{application.job_title} · {application.company}</option>
                      ))}
                    </select>
                  </label>
                  <button type="button" className="button primary" onClick={handleStartWorkflow} disabled={!selectedApplication}>Start preparation workflow</button>
                </div>
                {workflowError && <div className="inline-error" role="alert">{workflowError}</div>}
                {!applications.length && <p className="small-muted">Track a real application first to create its checklist. Starting a workflow does not submit or update the application.</p>}
                {workflows.map((workflow) => (
                  <article className="copilot-workflow" key={workflow.application_id}>
                    <h3>{workflow.job_title} <span>· {workflow.company}</span></h3>
                    <ol>
                      {workflow.steps.map((step) => (
                        <li key={step.id} className={step.completed ? 'is-complete' : ''}>
                          <label>
                            <input
                              type="checkbox"
                              checked={step.completed}
                              onChange={(event) => updateWorkflowStep(workflow.application_id, step.id, event.target.checked)}
                            />
                            <span>{step.title}</span>
                          </label>
                          <button type="button" className="text-button" onClick={() => navigate(step.destination)}>Open</button>
                        </li>
                      ))}
                    </ol>
                  </article>
                ))}
              </section>
            </div>

            <aside className="copilot-side-column">
              <section className="card copilot-section copilot-chat">
                <div className="copilot-chat-heading"><Icon name="message" size={18} /><div><span className="eyebrow">PRIVATE WORKSPACE GUIDANCE</span><h2>Ask Career Copilot</h2></div></div>
                <p className="small-muted">Answers use stored role and progress summaries. No resume text, notes, or private application details are sent to an external AI service.</p>
                <div className="copilot-prompt-list">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button key={prompt} type="button" onClick={() => handleAsk(prompt)} disabled={chatLoading}>{prompt}</button>
                  ))}
                </div>
                <form onSubmit={submitQuestion}>
                  <label htmlFor="copilot-question">Ask a career question</label>
                  <textarea id="copilot-question" rows="3" maxLength="2000" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What should I focus on next?" />
                  <button type="submit" className="button primary" disabled={!question.trim() || chatLoading}>{chatLoading ? 'Thinking…' : 'Ask Copilot'}</button>
                </form>
                {chatError && <div className="inline-error" role="alert">{chatError}</div>}
                {messages.length > 0 && (
                  <div className="copilot-conversation" aria-live="polite">
                    {messages.map((message, index) => (
                      <div className={`copilot-message ${message.role}`} key={`${message.role}-${index}`}>
                        <strong>{message.role === 'user' ? 'You' : 'Copilot'}</strong>
                        <p>{message.content}</p>
                        {message.next_steps?.map((step) => <span key={step}>• {step}</span>)}
                        {message.basis && <small>{message.basis}</small>}
                        {message.destination && <button type="button" className="button secondary compact" onClick={() => navigate(message.destination)}>Open related feature</button>}
                      </div>
                    ))}
                    <small>Conversation context stays in this open workspace session and is not saved.</small>
                  </div>
                )}
              </section>

              <section className="card copilot-section">
                <div className="copilot-chat-heading"><Icon name="bell" size={17} /><div><span className="eyebrow">IN-APP ONLY</span><h2>Reminder preferences</h2></div></div>
                <p className="small-muted">Show dates due in the next 7 days or recently overdue (up to 30 days). No background scheduler, email, or push notifications are enabled.</p>
                <label className="copilot-reminder-toggle">
                  <input type="checkbox" checked={dashboard.reminders_enabled} onChange={(event) => updatePreferences(event.target.checked)} />
                  <span>Enable in-app deadline and follow-up reminders</span>
                </label>
                {dashboard.upcoming_reminders.length > 0 ? (
                  <ul className="copilot-reminder-list">
                    {dashboard.upcoming_reminders.map((item) => <li key={item.id}><strong>{item.title}</strong><span>{item.due_date}</span></li>)}
                  </ul>
                ) : <p className="small-muted">No saved deadlines or follow-ups are due within seven days.</p>}
              </section>

              <section className="card copilot-section">
                <span className="eyebrow">RECENT ACHIEVEMENTS</span>
                <h2>Progress you recorded</h2>
                {dashboard.recent_achievements.length ? (
                  <ul className="copilot-achievement-list">{dashboard.recent_achievements.map((item) => <li key={item.label}><Icon name="check-circle" size={15} />{item.label}</li>)}</ul>
                ) : <p className="small-muted">Completed achievements will appear after you save progress in your roadmap or other features.</p>}
              </section>
            </aside>
          </section>

          <details className="copilot-limitations">
            <summary>Privacy, ranking, and capability limits</summary>
            <ul>{dashboard.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
          </details>
        </>
      )}
    </>
  )
}
