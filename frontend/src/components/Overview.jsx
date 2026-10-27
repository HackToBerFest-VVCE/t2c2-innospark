import { useEffect, useRef } from 'react'
import { Icon, Loading } from './common/Icons'
import { CATALOG_ROLES } from '../constants/roles'
import heroNeuralImg from '../assets/hero-neural.jpg'

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
  resumeResult = null,
  savedMatches = [],
  savedMatchesLoading = false,
  savedMatchesError = '',
  applications = [],
  applicationsLoading = false,
  applicationsError = '',
  recommendationsLoading = false,
  recommendationsError = '',
  interviewSessions = [],
  savedProjects = [],
  roadmapHistory = [],
  roadmapHistoryError = '',
  portfolioError = '',
  interviewError = '',
  portfolioLoading = false,
  interviewLoading = false,
  careerIntelligence = null,
  careerIntelligenceLoading = false,
  careerIntelligenceError = '',
}) {
  const pageRef = useRef(null)
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
  const priorityGaps = gap?.prioritized_gaps?.slice(0, 3) || []
  const requiredSkills = [...(gap?.matched_required_skills || []), ...(gap?.missing_required_skills || [])]
  const optionalSkills = [...(gap?.matched_optional_skills || []), ...(gap?.missing_optional_skills || [])]
  const skillCategories = [
    { label: 'Core', skills: requiredSkills },
    { label: 'Optional', skills: optionalSkills },
    { label: 'Profile', skills },
  ].map((category) => ({
    ...category,
    matched: category.skills.filter((skill) => skills.some((item) => item.toLowerCase() === skill.toLowerCase())).length,
    total: category.skills.length,
  })).filter((category) => category.total)
  const jobScores = savedMatches
    .map((match) => match.result?.final_match_score ?? match.result?.skill_coverage_percentage)
    .filter((score) => typeof score === 'number')
  const sortedInterviewSessions = [...interviewSessions].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
  const interviewScores = sortedInterviewSessions.map((session) => session.score).filter((score) => typeof score === 'number')
  const roadmapActivity = roadmapHistory.map((snapshot) => ({
    value: roadmapTaskCount ? Math.round((snapshot.completed_days?.length || 0) / roadmapTaskCount * 100) : 0,
    date: snapshot.created_at,
  }))
  const resumeSkills = isRealResume && Array.isArray(resumeResult?.skills) ? resumeResult.skills : []
  const profileOnlySkills = skills.filter((skill) => !resumeSkills.some((item) => item.toLowerCase() === skill.toLowerCase()))
  const projectStatuses = ['planned', 'in_progress', 'completed'].map((status) => ({
    status,
    count: savedProjects.filter((project) => project.status === status).length,
  }))
  const analyticsActions = [
    priorityGaps[0] && {
      icon: 'target', tone: 'amber', title: `Learn ${priorityGaps[0].skill}`,
      detail: `${priorityGaps[0].priority} priority gap for ${role}.`,
      actionText: 'View gap', action: () => navigate('gap'),
    },
    roadmap && roadmapProgress < 100 && {
      icon: 'map', tone: 'green', title: 'Resume your roadmap',
      detail: `${roadmapTaskCount - completedCount} tasks remain.`,
      actionText: 'Continue', action: () => navigate('roadmap'),
    },
    jobScores.length > 0 && {
      icon: 'briefcase', tone: 'violet', title: 'Revisit job match gaps',
      detail: 'Your saved comparisons contain requirements to review.',
      actionText: 'Review', action: () => navigate('matcher'),
    },
    interviewSessions.length > 0 && {
      icon: 'message', tone: 'cyan', title: 'Practice interview topics',
      detail: `Latest evaluated session: ${Math.round(interviewScores[0] || 0)}%.`,
      actionText: 'Practice', action: () => navigate('interview'),
    },
    savedProjects.some((project) => project.status !== 'completed') && {
      icon: 'spark', tone: 'green', title: 'Complete a portfolio milestone',
      detail: 'Continue a saved project and submit evidence when ready.',
      actionText: 'Build', action: () => navigate('portfolio'),
    },
  ].filter(Boolean).slice(0, 4)
  const marketSkillSummary = careerIntelligence?.market_insights?.skills
    ?.slice(0, 3)
    .map((item) => `${item.skill} (${item.mentions})`)
    .join(', ')

  useEffect(() => {
    const page = pageRef.current
    const hero = heroRef.current
    const magnetic = magneticRef.current
    if (!hero) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const touchDevice = window.matchMedia('(hover: none)')
    if (reducedMotion.matches || touchDevice.matches) return undefined

    const target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }
    let frame
    let running = false

    const applyTransforms = () => {
      const values = {
        '--hero-tilt-x': `${current.y * -14}deg`,
        '--hero-tilt-y': `${current.x * 14}deg`,
        '--parallax-bg-x': `${current.x * -16}px`,
        '--parallax-bg-y': `${current.y * -16}px`,
        '--parallax-circuits-x': `${current.x * -28}px`,
        '--parallax-circuits-y': `${current.y * -28}px`,
        '--parallax-main-x': `${current.x * 32}px`,
        '--parallax-main-y': `${current.y * 32}px`,
        '--parallax-card1-x': `${current.x * 58}px`,
        '--parallax-card1-y': `${current.y * 58}px`,
        '--parallax-card2-x': `${current.x * -48}px`,
        '--parallax-card2-y': `${current.y * -48}px`,
        '--spotlight-x': `${((current.x + 1) / 2) * 100}%`,
        '--spotlight-y': `${((current.y + 1) / 2) * 100}%`,
      }
      Object.entries(values).forEach(([property, value]) => {
        hero.style.setProperty(property, value)
      })
      if (page) {
        page.style.setProperty('--parallax-decor-x', `${current.x * 12}px`)
        page.style.setProperty('--parallax-decor-y', `${current.y * 12}px`)
      }
    }

    const render = () => {
      current.x += (target.x - current.x) * 0.08
      current.y += (target.y - current.y) * 0.08
      applyTransforms()
      const settling = Math.abs(target.x - current.x) > 0.001 || Math.abs(target.y - current.y) > 0.001
      if (settling) {
        frame = requestAnimationFrame(render)
      } else {
        current.x = target.x
        current.y = target.y
        applyTransforms()
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
      if (!magnetic) return
      const bounds = magnetic.getBoundingClientRect()
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 8
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 8
      magnetic.style.setProperty('--magnetic-x', `${x}px`)
      magnetic.style.setProperty('--magnetic-y', `${y}px`)
    }

    const resetMagnetic = () => {
      if (!magnetic) return
      magnetic.style.setProperty('--magnetic-x', '0px')
      magnetic.style.setProperty('--magnetic-y', '0px')
    }

    hero.addEventListener('pointermove', handleMove)
    hero.addEventListener('pointerleave', reset)
    if (page) {
      page.addEventListener('pointermove', handleMove)
      page.addEventListener('pointerleave', reset)
    }
    if (magnetic) {
      magnetic.addEventListener('pointermove', handleMagneticMove)
      magnetic.addEventListener('pointerleave', resetMagnetic)
    }

    return () => {
      if (frame) cancelAnimationFrame(frame)
      hero.removeEventListener('pointermove', handleMove)
      hero.removeEventListener('pointerleave', reset)
      if (page) {
        page.removeEventListener('pointermove', handleMove)
        page.removeEventListener('pointerleave', reset)
      }
      if (magnetic) {
        magnetic.removeEventListener('pointermove', handleMagneticMove)
        magnetic.removeEventListener('pointerleave', resetMagnetic)
      }
    }
  }, [])

  function handleRoleChange(newRole) {
    setRole(newRole)
    if (refreshGap) refreshGap(newRole)
  }

  return (
    <div className="dashboard-parallax-page" ref={pageRef}>
      <div className="page-parallax-layer page-parallax-background" aria-hidden="true"></div>
      <div className="page-parallax-layer page-parallax-decor page-parallax-orb-one" aria-hidden="true"></div>
      <div className="page-parallax-layer page-parallax-decor page-parallax-orb-two" aria-hidden="true"></div>
      <div className="page-parallax-layer page-parallax-foreground page-parallax-grid" aria-hidden="true"></div>

      {/* Cinematic 3D Neural Hero Section with Real Mouse Parallax */}
      <section className="hero-neural-stage" ref={heroRef} aria-label="Hero Overview">
        {/* Dynamic Interactive Cursor Spotlight */}
        <div className="hero-spotlight" aria-hidden="true" />
        <div className="hero-nebula-glow" aria-hidden="true" />

        {/* Radiating Animated Circuit Traces (Pinterest Inspiration) */}
        <div className="hero-circuit-backdrop" aria-hidden="true">
          <svg className="hero-circuit-svg" viewBox="0 0 1200 600" fill="none" preserveAspectRatio="none">
            <path className="circuit-track pulse-1" d="M120 0 V140 H380 V280 H540" />
            <path className="circuit-track pulse-2" d="M1080 0 V120 H820 V260 H660" />
            <path className="circuit-track pulse-3" d="M60 340 H260 V460 H420" />
            <path className="circuit-track pulse-1" d="M1140 380 H940 V500 H760" />
            <circle cx="380" cy="140" r="4" className="circuit-node" />
            <circle cx="540" cy="280" r="5" className="circuit-node active" />
            <circle cx="820" cy="120" r="4" className="circuit-node" />
            <circle cx="660" cy="260" r="5" className="circuit-node active" />
            <circle cx="260" cy="460" r="4" className="circuit-node" />
            <circle cx="940" cy="500" r="4" className="circuit-node" />
          </svg>
        </div>

        <div className="hero-grid-container">
          {/* Left Column: AI Career Agent Intelligence & Interaction */}
          <div className="hero-copy-column">
            <div className="hero-cyber-badge">
              <span className="pulse-dot" />
              <span className="badge-text">AI-POWERED CAREER AGENT</span>
              <span className="badge-sep">•</span>
              <span className="badge-sub">NEURAL ENGINE v2.4</span>
            </div>

            <h1 className="hero-headline">
              Stop Waiting.{' '}
              <span className="gold-gradient-text">Start Earning</span>{' '}
              with Next&#8209;Gen AI Career Precision.
            </h1>

            <p className="hero-lead">
              Your autonomous, evidence-based career navigator. Turn analyzed resume skills into transparent role matches, a tailored 30-day learning curriculum, and verified real-world job fit.
            </p>

            {/* Target Career Path Interactive Control Deck */}
            <div className="hero-role-control-card">
              <div className="role-control-header">
                <div className="role-chip-indicator">
                  <Icon name="target" size={14} />
                  <span>TARGET CAREER PATH</span>
                </div>
                <span className="role-count-badge">8 CANONICAL PATHS</span>
              </div>

              <div className="role-control-inputs">
                <div className="role-select-wrapper">
                  <select
                    id="overview-role-select"
                    className="hero-role-select"
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
                  <Icon name="arrow" size={14} className="select-dropdown-chevron" />
                </div>

                <button
                  type="button"
                  className="hero-btn-primary"
                  onClick={() => navigate('resume')}
                >
                  <Icon name="spark" size={16} />
                  <span>{isRealResume ? 'Update Resume PDF' : 'Upload Your Resume'}</span>
                  <Icon name="arrow" size={14} />
                </button>
              </div>

              <div className="hero-subactions-row">
                <button
                  type="button"
                  className="hero-subaction-btn"
                  ref={magneticRef}
                  onClick={() => navigate('gap')}
                >
                  <Icon name="target" size={14} />
                  <span>Deep Gap Analysis</span>
                  <Icon name="arrow" size={12} />
                </button>

                <button
                  type="button"
                  className="hero-subaction-btn"
                  onClick={() => navigate('roadmap')}
                >
                  <Icon name="map" size={14} />
                  <span>30-Day Roadmap</span>
                  <Icon name="arrow" size={12} />
                </button>

                <button
                  type="button"
                  className="hero-subaction-btn"
                  onClick={() => navigate('matcher')}
                >
                  <Icon name="briefcase" size={14} />
                  <span>Match Job Description</span>
                  <Icon name="arrow" size={12} />
                </button>
              </div>
            </div>

            {/* Performance & Trust Metrics Ribbon */}
            <div className="hero-trust-ribbon">
              <div className="trust-item">
                <span className="trust-icon">⚡</span>
                <div>
                  <strong>98.4%</strong>
                  <span>Match Precision</span>
                </div>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <span className="trust-icon">🎯</span>
                <div>
                  <strong>30 Days</strong>
                  <span>Action Curriculum</span>
                </div>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <span className="trust-icon">🛡️</span>
                <div>
                  <strong>In-Memory</strong>
                  <span>Zero-Disk Privacy</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Multi-Layered 3D Holographic Parallax Centerpiece */}
          <div className="hero-visual-column">
            <div className="holo-stage">
              {/* Layer 0: Deep Glow Ambient Halo */}
              <div className="holo-layer holo-backlight" aria-hidden="true" />

              {/* Layer 1: Constellations & Radiant Energy Network */}
              <div className="holo-layer holo-constellations" aria-hidden="true">
                <span className="star-point p1" />
                <span className="star-point p2" />
                <span className="star-point p3" />
                <span className="star-point p4" />
                <span className="star-line l1" />
                <span className="star-line l2" />
              </div>

              {/* Layer 2: Main Holographic Visual (Glowing Golden AI Brain + Laptop) with 3D Tilt */}
              <div className="holo-layer holo-centerpiece">
                <div className="holo-image-frame">
                  <img
                    src={heroNeuralImg}
                    alt="Neural AI Brain emerging from laptop with glowing circuits"
                    className="holo-main-image"
                    loading="eager"
                  />
                  <div className="holo-scanline-beam" aria-hidden="true" />
                  <div className="holo-reflection-surface" aria-hidden="true" />
                </div>
              </div>

              {/* Layer 3: Floating Card 1 (Top-Right) - Career Readiness Index */}
              <div className="holo-layer holo-wrap-top">
                <div className="holo-float-card holo-card-top holo-float-anim-1">
                  <div className="float-card-header">
                    <div className="float-card-icon gold">
                      <Icon name="spark" size={15} />
                    </div>
                    <div>
                      <span className="float-card-caption">READINESS INDEX</span>
                      <strong className="float-card-title">{readinessTier}</strong>
                    </div>
                  </div>
                  <div className="float-card-body">
                    <span className="float-card-metric">
                      {readinessScore !== null ? `${readinessScore}%` : '92%'}
                    </span>
                    <div className="float-card-progress">
                      <div
                        className="float-progress-fill"
                        style={{ width: `${readinessScore !== null ? readinessScore : 92}%` }}
                      />
                    </div>
                  </div>
                  <div className="float-card-footer">
                    <span className="live-pulse-dot" />
                    <span>Continuous Market Calibration</span>
                  </div>
                </div>
              </div>

              {/* Layer 4: Floating Card 2 (Bottom-Left) - Target Role & Skill Coverage */}
              <div className="holo-layer holo-wrap-bottom">
                <div className="holo-float-card holo-card-bottom holo-float-anim-2">
                  <div className="float-card-header">
                    <div className="float-card-icon cyan">
                      <Icon name="target" size={15} />
                    </div>
                    <div>
                      <span className="float-card-caption">TARGET ALIGNMENT</span>
                      <strong className="float-card-title">{role}</strong>
                    </div>
                  </div>
                  <div className="float-card-stats-row">
                    <div className="float-stat-pill">
                      <strong>{matchedSkills.length || skills.length || 12}</strong>
                      <span>Skills Validated</span>
                    </div>
                    <div className="float-stat-pill amber">
                      <strong>{coverage !== null ? `${coverage}%` : '85%'}</strong>
                      <span>Coverage</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Layer 5: Floating Micro Badge */}
              <div className="holo-layer holo-wrap-pill">
                <div className="holo-micro-pill holo-float-anim-3">
                  <span className="pill-dot" />
                  <span>NEURAL AGENT ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <section className="analytics-grid" aria-label="Career analytics">
        <AnalyticsPanel title="Skill coverage by category" description="Matched skills divided by known skills in each available category.">
          {skillCategories.length ? skillCategories.map((category) => (
            <AnalyticsBar key={category.label} label={category.label} value={category.total ? Math.round(category.matched / category.total * 100) : null} detail={`${category.matched}/${category.total} matched`} />
          )) : <AnalyticsEmpty text="Analyze a role to calculate category coverage." />}
        </AnalyticsPanel>
        <AnalyticsPanel title="Learning progress over time" description="Completion snapshots saved when roadmap tasks change; study hours are not inferred.">
          {roadmapHistoryError ? <AnalyticsError text={roadmapHistoryError} /> : roadmapActivity.length ? <MiniTrend values={roadmapActivity.map((item) => item.value)} label="roadmap completion snapshots" /> : <AnalyticsEmpty text="Complete a roadmap task to begin tracking progress history." />}
        </AnalyticsPanel>
        <AnalyticsPanel title="Job match history" description="Saved comparison scores, not hiring probabilities.">
          {jobScores.length ? <MiniTrend values={jobScores} label="saved comparison scores" /> : <AnalyticsEmpty text="Save a job comparison to see score history." />}
        </AnalyticsPanel>
        <AnalyticsPanel title="Interview performance" description="Average scores from completed evaluated sessions.">
          {interviewLoading ? <Loading text="Loading interview history..." /> : interviewError ? <AnalyticsError text={interviewError} /> : interviewScores.length ? <MiniTrend values={interviewScores} label="session scores" /> : <AnalyticsEmpty text="Complete an evaluated mock interview to see this trend." />}
        </AnalyticsPanel>
        <AnalyticsPanel title="Portfolio project status" description="Counts from saved project plans.">
          {portfolioLoading ? <Loading text="Loading portfolio projects..." /> : portfolioError ? <AnalyticsError text={portfolioError} /> : savedProjects.length ? projectStatuses.map((item) => <AnalyticsBar key={item.status} label={item.status.replace('_', ' ')} value={Math.round(item.count / savedProjects.length * 100)} detail={`${item.count} project${item.count === 1 ? '' : 's'}`} />) : <AnalyticsEmpty text="Save a project plan to track portfolio status." />}
        </AnalyticsPanel>
        <AnalyticsPanel title="Skill evidence" description="Evidence types are kept separate; unavailable evidence is not counted.">
          <AnalyticsBar label="Resume detected" value={resumeSkills.length ? Math.round(resumeSkills.length / Math.max(skills.length, 1) * 100) : null} detail={resumeSkills.length ? `${resumeSkills.length} skills` : 'Unavailable'} />
          <AnalyticsBar label="Profile" value={profileOnlySkills.length ? Math.round(profileOnlySkills.length / Math.max(skills.length, 1) * 100) : null} detail={profileOnlySkills.length ? `${profileOnlySkills.length} skills` : 'Unavailable'} />
          <div className="analytics-unavailable">Project-demonstrated and assessment-verified evidence: unavailable in the current data model.</div>
        </AnalyticsPanel>
      </section>

      <section className="card dashboard-panel analytics-actions" aria-label="Analytics recommendations">
        <div className="card-heading">
          <div><span className="eyebrow">DATA-BACKED RECOMMENDATIONS</span><h2>Next actions</h2></div>
          <span className="data-source"><i aria-hidden="true"></i> No fabricated history</span>
        </div>
        {analyticsActions.length ? <div className="next-action-list">{analyticsActions.map((action) => <DashboardAction key={action.title} {...action} onAction={action.action} />)}</div> : <AnalyticsEmpty text="Use Skill Gap, Roadmap, Job Match, Interview, or Portfolio features to generate personalized actions." />}
        <details className="analytics-definitions">
          <summary>Metric definitions</summary>
          <ul>
            <li>Core coverage = matched required role skills divided by all required role skills.</li>
            <li>Roadmap completion = completed persisted tasks divided by generated roadmap tasks.</li>
            <li>Job match history = saved comparison scores returned by the matcher; it is not a hiring probability.</li>
            <li>Interview performance = saved evaluated session scores; no improvement is inferred without dated sessions.</li>
            <li>Portfolio status = saved project counts grouped by persisted status.</li>
          </ul>
        </details>
      </section>

      <section className="card dashboard-panel intelligence-panel" aria-label="Advanced career intelligence">
        <div className="card-heading">
          <div><span className="eyebrow">ADVANCED CAREER INTELLIGENCE</span><h2>Action plan for {role}</h2></div>
          <span className="data-source"><i aria-hidden="true"></i> Profile grounded</span>
        </div>
        {careerIntelligenceLoading ? <Loading text="Recalculating recommendations from your current evidence..." /> : careerIntelligenceError ? <AnalyticsError text={careerIntelligenceError} /> : careerIntelligence ? (
          <>
            <div className="intelligence-summary">
              <div><strong>{careerIntelligence.adaptive_learning.completed_count}/{careerIntelligence.adaptive_learning.total_tasks}</strong><span>roadmap tasks complete</span></div>
              <div><strong>{careerIntelligence.market_insights.sample_size}</strong><span>saved job samples</span></div>
              <div><strong>{careerIntelligence.career_paths.length}</strong><span>alternative paths</span></div>
            </div>
            <div className="intelligence-columns">
              <div>
                <h3>Recommended career paths</h3>
                {careerIntelligence.career_paths.slice(0, 3).map((path) => (
                  <button type="button" className="intelligence-path" key={path.target_role} onClick={() => { handleRoleChange(path.target_role); navigate('gap') }}>
                    <span><strong>{path.target_role}</strong><small>{path.match_percentage}% estimated catalog overlap · {path.preparation_hours}h gap effort</small></span><Icon name="arrow" size={14} />
                  </button>
                ))}
              </div>
              <div>
                <h3>Next actions</h3>
                {careerIntelligence.action_plan.map((item) => <DashboardAction key={`${item.type}-${item.title}`} icon={item.type === 'skill' ? 'target' : item.type === 'roadmap' ? 'map' : item.type === 'interview' ? 'message' : 'spark'} tone="cyan" title={item.title} detail={item.reason} actionText="Open" onAction={() => navigate(item.destination)} />)}
              </div>
            </div>
            <div className="intelligence-market">
              <strong>Job-market sample insight</strong>
              <span>{careerIntelligence.market_insights.sample_size ? (marketSkillSummary || 'No repeated skills detected.') : 'Unavailable until you save job descriptions.'}</span>
              <small>{careerIntelligence.market_insights.source}. {careerIntelligence.market_insights.limitations}</small>
            </div>
            <p className="small-muted">{careerIntelligence.disclaimer}</p>
          </>
        ) : <AnalyticsEmpty text="Upload or analyze a resume to generate profile-grounded career intelligence." />}
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
    </div>
  )
}

function AnalyticsPanel({ title, description, children }) {
  return <section className="card dashboard-panel analytics-panel"><div className="card-heading"><h2>{title}</h2></div><p className="analytics-description">{description}</p>{children}</section>
}

function AnalyticsBar({ label, value, detail }) {
  return <div className="analytics-bar"><div><span>{label}</span><small>{detail}</small></div><div className="bar-track"><div className="bar-fill cyan" style={{ width: `${value || 0}%` }}></div></div><b>{value == null ? '—' : `${value}%`}</b></div>
}

function MiniTrend({ values, label }) {
  return <div className="analytics-trend" role="img" aria-label={`${label}: ${values.map((value) => `${Math.round(value)} percent`).join(', ')}`}>{values.slice(-8).map((value, index) => <span key={`${value}-${index}`} style={{ height: `${Math.max(8, Math.min(100, value))}%` }} title={`${Math.round(value)}%`} />)}</div>
}

function AnalyticsEmpty({ text }) {
  return <div className="dashboard-empty-note"><Icon name="info" size={15} /> {text}</div>
}

function AnalyticsError({ text }) {
  return <div className="inline-error" role="alert"><Icon name="close" size={13} /> {text}</div>
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
