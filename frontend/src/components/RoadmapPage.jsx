import { Icon, PageIntro } from './common/Icons'
import { CATALOG_ROLES } from '../constants/roles'

export function RoadmapPage({
  roadmap,
  loading,
  error,
  minutes,
  setMinutes,
  generate,
  completed,
  toggleTask,
  resetProgress,
  role,
  setRole,
  focusSkills,
  clearFocusSkills,
}) {
  const completedCount = completed.size
  const totalTasks = roadmap?.tasks?.length || 30
  const progressPercent = Math.round((completedCount / totalTasks) * 100)

  return (
    <>
      <PageIntro
        eyebrow="30-DAY PERSONALIZED LEARNING ROADMAP"
        title="Turn Gaps into Daily Momentum"
        description="A structured 4-week, 30-day curriculum with daily practical deliverables, weekly review milestones, and an end-to-end portfolio project."
        action={
          roadmap && (
            <div className="roadmap-header-actions">
              <span className="progress-pill">
                <span style={{ width: `${progressPercent}%` }} aria-hidden="true"></span>
                {completedCount}/{totalTasks} complete ({progressPercent}%)
              </span>
              {completedCount > 0 && (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={resetProgress}
                  style={{ fontSize: '11px', marginLeft: '8px' }}
                >
                  Reset Progress
                </button>
              )}
            </div>
          )
        }
      />

      {/* Focus skills notification from Job Matcher */}
      {focusSkills && focusSkills.length > 0 && (
        <div className="notice-bar" role="status">
          <Icon name="spark" size={16} />
          <div style={{ flex: 1 }}>
            <strong>Tailored from Job Matcher:</strong> Priority focus placed on{' '}
            <b>{focusSkills.join(', ')}</b>.
          </div>
          <button
            type="button"
            className="remove-file"
            onClick={clearFocusSkills}
            aria-label="Clear job matcher focus"
          >
            Clear focus
          </button>
        </div>
      )}

      {!roadmap ? (
        <section className="card roadmap-empty" aria-label="Generate Roadmap">
          <div className="empty-art" aria-hidden="true">
            <Icon name="map" size={28} />
          </div>
          <h2>Your 30-Day Learning Plan is Ready to Build</h2>
          <p>
            Choose your target career path and daily time commitment. We will prioritize your verified skill gaps and build daily deliverables.
          </p>

          <div className="roadmap-controls">
            <label htmlFor="roadmap-role-select">
              Target Role
              <select
                id="roadmap-role-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {CATALOG_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="roadmap-time-select">
              Daily Time Commitment
              <select
                id="roadmap-time-select"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              >
                <option value={30}>30 minutes / day</option>
                <option value={60}>60 minutes / day (Recommended)</option>
                <option value={90}>90 minutes / day</option>
                <option value={120}>120 minutes / day</option>
              </select>
            </label>

            <button
              type="button"
              className="button primary"
              onClick={generate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true"></span> Sequencing 30-Day Plan...
                </>
              ) : (
                <>
                  <Icon name="spark" size={16} /> Generate 30-Day Plan
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="inline-error" role="alert">
              <Icon name="close" size={13} /> {error}
            </div>
          )}

          <span className="demo-note">
            <span className="demo-dot" aria-hidden="true"></span> Calibrated to verified {role} skill gaps
          </span>
        </section>
      ) : (
        <>
          {/* Active Plan Summary Bar */}
          <div className="roadmap-summary">
            <div className="card roadmap-summary-main">
              <div>
                <span className="eyebrow">ACTIVE LEARNING ROADMAP</span>
                <h2>{roadmap.target_role} · 30 Days</h2>
                <p>
                  {roadmap.daily_minutes} minutes/day · 4 weekly phases · Deliverable-driven curriculum
                </p>
                <div style={{ marginTop: '12px' }}>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={generate}
                    disabled={loading}
                    style={{ fontSize: '11px', padding: '6px 10px' }}
                  >
                    <Icon name="refresh" size={13} /> Regenerate Plan
                  </button>
                </div>
              </div>

              <div className="big-progress">
                <strong>{progressPercent}%</strong>
                <span>overall completion</span>
              </div>
            </div>

            <div className="card mini-project">
              <span className="eyebrow">CAPSTONE MINI-PROJECT</span>
              <h3>Portfolio Deliverable</h3>
              <p>{roadmap.final_mini_project}</p>
              <span className="project-tag">
                <Icon name="spark" size={13} /> Portfolio Ready
              </span>
            </div>
          </div>

          {/* Weekly Task Lists */}
          <div className="weeks">
            {roadmap.weeks.map((week) => {
              const weekDoneCount = week.tasks.filter((t) => completed.has(t.day)).length
              return (
                <section className="week-section" key={week.week} aria-label={`Week ${week.week}: ${week.goal}`}>
                  <div className="week-heading">
                    <div>
                      <span className="week-number">0{week.week}</span>
                      <div>
                        <span className="eyebrow">WEEK {week.week}</span>
                        <h2>{week.goal}</h2>
                      </div>
                    </div>
                    <span className="week-count">
                      {weekDoneCount}/{week.tasks.length} completed
                    </span>
                  </div>

                  <div className="task-list">
                    {week.tasks.map((task) => {
                      const isComplete = completed.has(task.day)
                      return (
                        <label
                          key={task.day}
                          className={`task-row ${isComplete ? 'task-complete' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isComplete}
                            onChange={() => toggleTask(task.day)}
                            aria-label={`Mark Day ${task.day}: ${task.topic} as ${isComplete ? 'incomplete' : 'complete'}`}
                          />
                          <span className="check-box" aria-hidden="true">
                            <Icon name="check" size={13} />
                          </span>

                          <span className="task-day">
                            DAY {String(task.day).padStart(2, '0')}
                          </span>

                          <span className="task-main">
                            <strong>{task.topic}</strong>
                            <span>{task.learning_activity}</span>
                            <small>
                              <Icon name="check" size={11} /> Deliverable: {task.deliverable}
                            </small>
                          </span>

                          <span className="task-time" title="Estimated daily time">
                            <Icon name="clock" size={13} /> {task.estimated_minutes}m
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
