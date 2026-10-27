import { useEffect, useRef } from 'react'
import { Icon, Loading, PageIntro } from './common/Icons'
import { CATALOG_ROLES } from '../constants/roles'

export function Overview({
  navigate,
  gap,
  roadmap,
  skills,
  recommendations,
  role,
  setRole,
  refreshGap,
  completedCount,
  completed = new Set(),
  isRealResume,
  savedMatches = [],
  savedMatchesLoading = false,
  savedMatchesError = '',
  applications = [],
  applicationsLoading = false,
  applicationsError = '',
  recommendationsLoading = false,
  recommendationsError = '',
}) {
  const heroRef = useRef(null)
  const magneticRef = useRef(null)
  const roadmapTaskCount = roadmap?.tasks?.length || 0
  const coverage = gap ? Math.round(gap.skill_coverage_percentage) : null
  const roadmapProgress = roadmapTaskCount
    ? Math.round((completedCount / roadmapTaskCount) * 100)
    : null
  const readinessAvailable = Boolean(gap) && roadmapProgress !== null
  const skillBreadth = Math.min(skills.length / 10, 1) * 100
  const readinessScore = readinessAvailable
    ? Math.round(coverage * 0.55 + roadmapProgress * 0.25 + skillBreadth * 0.2)
    : null
  const weeklyProgress = roadmap
    ? [1, 2, 3, 4].map((week) => {
        const start = (week - 1) * 7 + 1
        const end = week === 4 ? roadmapTaskCount : week * 7
        const total = Math.max(0, end - start + 1)
        const done = Array.from({ length: total }, (_, index) => start + index)
          .filter((day) => completed.has(day)).length
        return { week, done, total, percentage: total ? Math.round((done / total) * 100) : 0 }
      })
    : []
  const applicationCounts = applications.reduce((counts, application) => {
    counts[application.status] = (counts[application.status] || 0) + 1
    return counts
  }, {})
  const recentActivity = [
    ...savedMatches.slice(0, 3).map((match) => ({
      id: `match-${match.id}`,
      icon: 'target',
      tone: 'violet',
      title: `Saved ${match.title}`,
      detail: match.company ? `${match.company} · Job match saved` : 'Job match saved',
      timestamp: match.created_at,
      actionText: 'Review',
      action: () => navigate('saved'),
    })),
    ...applications.slice(0, 3).map((application) => ({
      id: `application-${application.id}`,
      icon: 'briefcase',
      tone: 'amber',
      title: `${application.job_title} at ${application.company}`,
      detail: `Application status: ${application.status}`,
      timestamp: application.updated_at,
      actionText: 'Open',
      action: () => navigate('applications'),
    })),
  ]
    .filter((item) => item.timestamp)
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
    .slice(0, 5)

  let readinessTier = 'Not enough data'
  let readinessColor = 'amber'
  if (readinessScore >= 80) {
    readinessTier = 'Role-Ready Contender'
    readinessColor = 'green'
  } else if (readinessScore >= 55) {
    readinessTier = 'Interview Contender'
    readinessColor = 'cyan'
  } else if (readinessScore >= 30) {
    readinessTier = 'Skill Builder'
    readinessColor = 'violet'
  }

  const missingSkills = gap?.missing_required_skills || []
  const matchedSkills = gap?.matched_required_skills || []

  useEffect(() => {
    const hero = heroRef.current
    const magnetic = magneticRef.current
    if (!hero || !magnetic) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const touchDevice = window.matchMedia('(hover: none)')
    if (reducedMotion.matches || touchDevice.matches) return undefined

    const target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }
    let frame
    let running = false

    const render = () => {
      current.x += (target.x - current.x) * 0.09
      current.y += (target.y - current.y) * 0.09
      hero.style.setProperty('--parallax-bg-x', `${-current.x * 8}px`)
      hero.style.setProperty('--parallax-bg-y', `${-current.y * 8}px`)
      hero.style.setProperty('--parallax-decor-x', `${current.x * 16}px`)
      hero.style.setProperty('--parallax-decor-y', `${current.y * 16}px`)
      hero.style.setProperty('--parallax-main-x', `${current.x * 25}px`)
      hero.style.setProperty('--parallax-main-y', `${current.y * 25}px`)
      hero.style.setProperty('--parallax-front-x', `${current.x * 35}px`)
      hero.style.setProperty('--parallax-front-y', `${current.y * 35}px`)
      hero.style.setProperty('--hero-rotate-x', `${current.y * -6}deg`)
      hero.style.setProperty('--hero-rotate-y', `${current.x * 6}deg`)
      const settling = Math.abs(target.x - current.x) > 0.001 || Math.abs(target.y - current.y) > 0.001
      if (settling) {
        frame = requestAnimationFrame(render)
      } else {
        running = false
        frame = undefined
      }
    }
    const startAnimation = () => {
      if (!running) {
        running = true
        frame = requestAnimationFrame(render)
      }
    }

    const handleMove = (event) => {
      const bounds = hero.getBoundingClientRect()
      target.x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1))
      target.y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1))
      startAnimation()
    }
    const reset = () => {
      target.x = 0
      target.y = 0
      startAnimation()
    }
    const handleMagneticMove = (event) => {
      const bounds = magnetic.getBoundingClientRect()
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 8
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 8
      magnetic.style.setProperty('--magnetic-x', `${x}px`)
      magnetic.style.setProperty('--magnetic-y', `${y}px`)
    }
    const resetMagnetic = () => {
      magnetic.style.setProperty('--magnetic-x', '0px')
      magnetic.style.setProperty('--magnetic-y', '0px')
    }

    hero.addEventListener('pointermove', handleMove)
    hero.addEventListener('pointerleave', reset)
    magnetic.addEventListener('pointermove', handleMagneticMove)
    magnetic.addEventListener('pointerleave', resetMagnetic)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      hero.removeEventListener('pointermove', handleMove)
      hero.removeEventListener('pointerleave', reset)
      magnetic.removeEventListener('pointermove', handleMagneticMove)
      magnetic.removeEventListener('pointerleave', resetMagnetic)
    }
  }, [])

  function handleRoleChange(newRole) {
    setRole(newRole)
    if (refreshGap) refreshGap(newRole)
  }

  return (
    <>
      <PageIntro
        eyebrow="CAREER READINESS INTELLIGENCE"
        title={
          <>
            Build your next <span className="gradient-text">breakthrough.</span>
          </>
        }
        description="Your evidence-based career navigator. Turn analyzed resume skills into targeted role matches, a tailored 30-day learning roadmap, and direct job fit analysis."
        action={
          <button
            type="button"
            className="button primary"
            onClick={() => navigate('resume')}
          >
            <Icon name="spark" size={16} />
            {isRealResume ? 'Update Resume PDF' : 'Upload Your Resume'}
            <Icon name="arrow" size={15} />
          </button>
        }
      />

      {/* Hero Banner with Role Selector */}
      <div className="welcome-banner parallax-hero" ref={heroRef}>
        <div className="parallax-layer parallax-layer-background" aria-hidden="true"></div>
        <div className="parallax-layer parallax-layer-decor parallax-orb-one" aria-hidden="true"></div>
        <div className="parallax-layer parallax-layer-decor parallax-orb-two" aria-hidden="true"></div>
        <div className="parallax-layer parallax-layer-foreground parallax-grid-lines" aria-hidden="true"></div>
        <div className="banner-glow parallax-layer-background" aria-hidden="true"></div>
        <div className="banner-icon parallax-layer-main" aria-hidden="true">
          <Icon name="spark" size={24} />
        </div>
        <div className="parallax-layer-decor">
          <strong>Target Career Path: {role}</strong>
          <p>
            {isRealResume
              ? `Profile evaluated from your uploaded resume against ${CATALOG_ROLES.length} standardized industry paths.`
              : 'Using demonstration profile. Upload your resume anytime for tailored results.'}
          </p>
        </div>
        <div className="banner-actions parallax-layer-foreground">
          <label htmlFor="overview-role-select" className="sr-only">Select target role</label>
          <select
            id="overview-role-select"
            className="role-dropdown"
            value={role}
            onChange={(e) => handleRoleChange(e.target.value)}
            aria-label="Switch target career role"
          >
            {CATALOG_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="text-button hero-magnetic-button"
            ref={magneticRef}
            onClick={() => navigate('gap')}
          >
            Deep gap analysis <Icon name="arrow" size={14} />
          </button>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <section className="stats-grid" aria-label="Key Readiness Indicators">
        <StatCard
          label="Skills Extracted"
          value={skills.length}
          detail={isRealResume ? 'Extracted from your resume PDF' : 'From demo profile baseline'}
          icon="spark"
          tone="cyan"
        />
        <StatCard
          label="Target Role Match"
          value={coverage !== null ? `${coverage}%` : '—'}
          detail={gap ? `${matchedSkills.length} required skills matched` : 'Analyze a resume to calculate'}
          icon="target"
          tone="violet"
        />
        <StatCard
          label="Priority Gaps"
          value={gap ? missingSkills.length : '—'}
          detail={missingSkills.length ? `Need: ${missingSkills.slice(0, 2).join(', ')}` : 'All required skills matched!'}
          icon="briefcase"
          tone="amber"
        />
        <StatCard
          label="Roadmap Progress"
          value={roadmapProgress !== null ? `${roadmapProgress}%` : '—'}
          detail={roadmap ? `${completedCount} of ${roadmapTaskCount} tasks completed` : 'Generate a plan to track progress'}
          icon="map"
          tone="green"
        />
        <StatCard
          label="Applications"
          value={applicationsLoading ? '…' : applications.length}
          detail={applications.length ? `${applicationCounts.interview || 0} in interview stage` : 'No applications tracked yet'}
          icon="briefcase"
          tone="amber"
        />
        <StatCard
          label="Saved Matches"
          value={savedMatchesLoading ? '…' : savedMatches.length}
          detail={savedMatches.length ? 'Opportunities saved for review' : 'No matches saved yet'}
          icon="target"
          tone="violet"
        />
      </section>

      {/* Middle Grid: Career Readiness Score & Recent Milestones */}
      <div className="dashboard-grid">
        <section className="card activity-card" aria-label="Career Readiness Score">
          <div className="card-heading">
            <div>
              <span className="eyebrow">COMPOSITE READINESS</span>
              <h2>Career Readiness Index</h2>
            </div>
            <span className={`readiness-pill ${readinessColor}`}>
              <Icon name="check" size={12} /> {readinessTier}
            </span>
          </div>

          <div className="progress-orb">
            <div
              className="orb-ring"
              style={{ '--progress': `${readinessScore}%` }}
              role="progressbar"
              aria-valuenow={readinessScore}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div>
                <strong>{readinessScore !== null ? `${readinessScore}%` : '—'}</strong>
                <span>readiness score</span>
              </div>
            </div>
            <div className="orb-copy">
              <strong>Evidence-Based Evaluation</strong>
              <p>
                {readinessAvailable
                  ? `Formula: 55% required-skill coverage + 25% roadmap completion + 20% skill breadth (${skills.length}/10 skills).`
                  : 'Analyze a resume and generate a roadmap to calculate a readiness score.'}
              </p>
              <div className="mini-legend">
                <span>
                  <i className="dot cyan"></i>Matched ({matchedSkills.length})
                </span>
                <span>
                  <i className="dot muted"></i>To Learn ({missingSkills.length})
                </span>
              </div>
            </div>
          </div>

          <div className="readiness-breakdown">
            <div className="breakdown-item">
              <span>Required Skills Coverage</span>
              <div className="bar-track">
                <div className="bar-fill cyan" style={{ width: `${coverage || 0}%` }}></div>
              </div>
              <small>{coverage !== null ? `${coverage}%` : '—'}</small>
            </div>
            <div className="breakdown-item">
              <span>Roadmap Completion</span>
              <div className="bar-track">
                <div className="bar-fill green" style={{ width: `${roadmapProgress || 0}%` }}></div>
              </div>
              <small>{roadmapProgress !== null ? `${roadmapProgress}%` : '—'}</small>
            </div>
          </div>
        </section>

        <section className="card activity-card" aria-label="Next Steps & Agent Actions">
          <div className="card-heading">
            <div>
              <span className="eyebrow">AGENT RECOMMENDATIONS</span>
              <h2>Next Strategic Steps</h2>
            </div>
            <span className="live-label">
              <i aria-hidden="true"></i> Profile Grounded
            </span>
          </div>

          <div className="activity-list">
            <Activity
              icon="file"
              title="Resume Profile"
              detail={isRealResume ? 'Resume evidence extracted from PDF' : 'Upload your PDF resume for personalized results'}
              tone="cyan"
              actionText="Inspect"
              onAction={() => navigate('resume')}
            />
            <Activity
              icon="briefcase"
              title="Job Matcher (Agent)"
              detail="Paste a real job posting to verify fit, evidence snippets, and missing keywords"
              tone="violet"
              actionText="Match Job"
              onAction={() => navigate('matcher')}
            />
            <Activity
              icon="map"
              title="30-Day Learning Plan"
              detail={roadmap ? `Active plan for ${role} (${completedCount}/30 complete)` : `Generate focused plan for ${role}`}
              tone="amber"
              actionText={roadmap ? 'Continue' : 'Generate'}
              onAction={() => navigate('roadmap')}
            />
            <Activity
              icon="message"
              title="AI Career Mentor"
              detail="Ask targeted questions grounded directly in your evaluated profile"
              tone="green"
              actionText="Ask Mentor"
              onAction={() => navigate('mentor')}
            />
          </div>
        </section>
      </div>

      <div className="dashboard-lower-grid">
        <section className="card dashboard-panel" aria-label="Next best actions">
          <div className="card-heading">
            <div>
              <span className="eyebrow">PERSONALIZED PRIORITIES</span>
              <h2>Next Best Actions</h2>
            </div>
            <span className="data-source"><i aria-hidden="true"></i> Based on your data</span>
          </div>
          <div className="next-action-list">
            {!isRealResume && (
              <DashboardAction icon="file" tone="cyan" title="Analyze your resume" detail="Upload a PDF to replace demonstration data with your evidence." actionText="Upload" onAction={() => navigate('resume')} />
            )}
            {isRealResume && missingSkills.length > 0 && (
              <DashboardAction icon="target" tone="amber" title={`Close ${missingSkills.length} priority skill gap${missingSkills.length === 1 ? '' : 's'}`} detail={`Start with ${missingSkills.slice(0, 2).join(' and ')} for ${role}.`} actionText="View gaps" onAction={() => navigate('gap')} />
            )}
            {!roadmap && gap && (
              <DashboardAction icon="map" tone="violet" title="Build your 30-day roadmap" detail={`Sequence learning tasks for ${role} using your current gaps.`} actionText="Build plan" onAction={() => navigate('roadmap')} />
            )}
            {roadmap && roadmapProgress < 100 && (
              <DashboardAction icon="book" tone="green" title="Continue your roadmap" detail={`${completedCount} of ${roadmapTaskCount} tasks complete.`} actionText="Continue" onAction={() => navigate('roadmap')} />
            )}
            {savedMatches.length === 0 && !savedMatchesLoading && (
              <DashboardAction icon="briefcase" tone="violet" title="Validate a real opportunity" detail="Paste a job description to compare requirements with your skills." actionText="Match job" onAction={() => navigate('matcher')} />
            )}
            {applications.length === 0 && (
              <DashboardAction icon="briefcase" tone="amber" title="Track an application" detail="Keep deadlines and follow-ups visible in your pipeline." actionText="Add application" onAction={() => navigate('applications')} />
            )}
          </div>
          {savedMatchesError && <div className="inline-error" role="alert"><Icon name="close" size={13} /> {savedMatchesError}</div>}
          {isRealResume && gap && roadmap && roadmapProgress === 100 && (
            <div className="dashboard-empty-note">Your current roadmap is complete. Explore recommendations or prepare for interviews.</div>
          )}
        </section>

        <section className="card dashboard-panel" aria-label="Profile snapshot">
          <div className="card-heading">
            <div>
              <span className="eyebrow">PROFILE SNAPSHOT</span>
              <h2>{role}</h2>
            </div>
            <button type="button" className="text-button" onClick={() => navigate('settings')}>Edit profile <Icon name="arrow" size={13} /></button>
          </div>
          <div className="profile-snapshot-grid">
            <div><strong>{skills.length}</strong><span>skills in profile</span></div>
            <div><strong>{matchedSkills.length}</strong><span>required matched</span></div>
            <div><strong>{missingSkills.length}</strong><span>priority gaps</span></div>
            <div><strong>{savedMatches.length}</strong><span>saved matches</span></div>
          </div>
          {skills.length > 0 ? (
            <div className="dashboard-skill-list">
              {skills.slice(0, 8).map((skill) => <span className="tiny-chip good" key={skill}>{skill}</span>)}
              {skills.length > 8 && <span className="tiny-chip muted">+{skills.length - 8} more</span>}
            </div>
          ) : (
            <div className="dashboard-empty-note">No analyzed skills are available yet.</div>
          )}
        </section>
      </div>

      <div className="dashboard-lower-grid">
        <section className="card dashboard-panel" aria-label="Weekly learning progress">
          <div className="card-heading">
            <div><span className="eyebrow">LEARNING MOMENTUM</span><h2>Weekly Progress</h2></div>
            {roadmap && <span className="data-source"><i aria-hidden="true"></i> {completedCount}/{roadmapTaskCount} tasks</span>}
          </div>
          {roadmap ? (
            <div className="weekly-progress-list">
              {weeklyProgress.map((week) => (
                <div className="weekly-progress-row" key={week.week}>
                  <span>Week {week.week}</span>
                  <div className="bar-track"><div className="bar-fill violet" style={{ width: `${week.percentage}%` }} /></div>
                  <strong>{week.done}/{week.total}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-note"><Icon name="map" size={18} /> Generate a roadmap to see actual weekly completion.</div>
          )}
        </section>

        <section className="card dashboard-panel" aria-label="Application statistics">
          <div className="card-heading">
            <div><span className="eyebrow">APPLICATION PIPELINE</span><h2>Application Stats</h2></div>
            <button type="button" className="text-button" onClick={() => navigate('applications')}>Open tracker <Icon name="arrow" size={13} /></button>
          </div>
          {applicationsLoading ? <Loading text="Loading applications..." /> : applicationsError ? (
            <div className="inline-error" role="alert"><Icon name="close" size={13} /> {applicationsError}</div>
          ) : applications.length ? (
            <div className="application-stat-grid">
              <div><strong>{applications.length}</strong><span>Total tracked</span></div>
              <div><strong>{applicationCounts.applied || 0}</strong><span>Applied</span></div>
              <div><strong>{applicationCounts.interview || 0}</strong><span>Interviews</span></div>
              <div><strong>{applicationCounts.offer || 0}</strong><span>Offers</span></div>
            </div>
          ) : <div className="dashboard-empty-note">No applications tracked yet.</div>}
        </section>
      </div>

      <section className="card dashboard-panel recent-activity-panel" aria-label="Recent activity">
        <div className="card-heading">
          <div><span className="eyebrow">WORKSPACE HISTORY</span><h2>Recent Activity</h2></div>
          <span className="data-source"><i aria-hidden="true"></i> Saved workspace data</span>
        </div>
        {recentActivity.length ? (
          <div className="recent-activity-list">
            {recentActivity.map((item) => <Activity key={item.id} {...item} onAction={item.action} />)}
          </div>
        ) : <div className="dashboard-empty-note">Saved matches and application updates will appear here.</div>}
      </section>

      {/* Recommended Career Paths */}
      <div className="section-heading">
        <div>
          <span className="eyebrow">PATHWAYS EXPLORER</span>
          <h2>Top Career Paths for Your Skills</h2>
        </div>
        <button
          type="button"
          className="text-button"
          onClick={() => navigate('recommendations')}
        >
          See all 8 roles <Icon name="arrow" size={14} />
        </button>
      </div>

      {recommendationsLoading ? <Loading text="Ranking career paths from your profile skills..." /> : recommendationsError ? (
        <div className="inline-error" role="alert"><Icon name="close" size={13} /> {recommendationsError}</div>
      ) : recommendations.length > 0 ? (
        <div className="role-preview">
          {recommendations.slice(0, 3).map((r) => (
            <RoleCard
              key={r.target_role}
              role={r}
              compact
              onSelect={() => {
                handleRoleChange(r.target_role)
                navigate('gap')
              }}
            />
          ))}
        </div>
      ) : (
        <div className="card empty-inline">
          Upload a resume or select a path to view live recommendations.
        </div>
      )}

      <p className="demo-note">
        <span className="data-source">
          <i aria-hidden="true"></i> Transparent deterministic evaluation. Match percentages are estimates based on resume evidence and confirmed profile skills, not guarantees of employment.
        </span>
      </p>
    </>
  )
}

function StatCard({ label, value, detail, icon, tone }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-top">
        <div className="stat-icon" aria-hidden="true">
          <Icon name={icon} size={17} />
        </div>
        <span className="stat-label">{label}</span>
      </div>
      <strong className="stat-value">{value}</strong>
      <span className="stat-detail">{detail}</span>
    </div>
  )
}

function Activity({ icon, title, detail, tone, actionText, onAction }) {
  return (
    <div className="activity-row">
      <div className={`activity-icon ${tone}`} aria-hidden="true">
        <Icon name={icon} size={16} />
      </div>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      {onAction && (
        <button
          type="button"
          className="ghost-button"
          onClick={onAction}
          aria-label={`${actionText} ${title}`}
        >
          {actionText} <Icon name="arrow" size={13} />
        </button>
      )}
    </div>
  )
}

function DashboardAction({ icon, title, detail, tone, actionText, onAction }) {
  return (
    <div className="dashboard-action">
      <div className={`activity-icon ${tone}`} aria-hidden="true"><Icon name={icon} size={16} /></div>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <button type="button" className="ghost-button" onClick={onAction}>
        {actionText} <Icon name="arrow" size={13} />
      </button>
    </div>
  )
}

export function RoleCard({ role, compact = false, onAction, onSelect }) {
  const matched = [
    ...(role.matched_required_skills || []),
    ...(role.matched_optional_skills || []),
  ]
  const missing = role.missing_required_skills || []

  return (
    <article className={`role-card cyan ${compact ? 'compact' : ''}`}>
      <div className="role-card-top">
        <div className="role-symbol" aria-hidden="true">
          <Icon name="briefcase" size={18} />
        </div>
        <span className="match-label">
          EST. MATCH <strong>{Math.round(role.match_percentage)}%</strong>
        </span>
      </div>

      <h3>{role.target_role}</h3>
      <p>{role.explanation}</p>

      <div className="role-skills">
        <div>
          <span className="skill-label">MATCHED EVIDENCE ({matched.length})</span>
          <div className="mini-chips">
            {matched.length > 0 ? (
              matched.slice(0, 4).map((skill) => (
                <span className="tiny-chip good" key={skill}>
                  {skill}
                </span>
              ))
            ) : (
              <span className="tiny-chip muted">None yet</span>
            )}
            {matched.length > 4 && (
              <span className="tiny-chip good">+{matched.length - 4} more</span>
            )}
          </div>
        </div>

        <div>
          <span className="skill-label">PRIORITY GAPS ({missing.length})</span>
          <div className="mini-chips">
            {missing.length > 0 ? (
              missing.map((skill) => (
                <span className="tiny-chip" key={skill}>
                  {skill}
                </span>
              ))
            ) : (
              <span className="tiny-chip good">Fully matched</span>
            )}
          </div>
        </div>
      </div>

      <div className="card-actions">
        {onSelect && (
          <button
            type="button"
            className="button secondary full-button"
            onClick={onSelect}
          >
            Analyze Gap <Icon name="arrow" size={14} />
          </button>
        )}
        {!compact && onAction && (
          <button
            type="button"
            className="button primary full-button"
            onClick={onAction}
          >
            View Full Role Analysis <Icon name="arrow" size={15} />
          </button>
        )}
      </div>
    </article>
  )
}
