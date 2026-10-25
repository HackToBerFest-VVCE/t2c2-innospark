import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  analyzeResume,
  askMentor,
  checkHealth,
  generateFocusedRoadmap,
  getRecommendations,
  getSkillGap,
  matchJobDescription,
} from './services/api'
import './App.css'

const roles = [
  'Python Developer',
  'Frontend Developer',
  'Data Analyst',
  'Backend Developer',
  'Full Stack Developer',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'QA Automation Engineer',
]

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" /><path d="M9 3v15M15 6v15" /></>,
    settings: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1-1.5.9-.1.2a2 2 0 1 1-4 0v-.2l-1.7-.9-.1.1a2 2 0 1 1-2.8-2.8l.1-.1-.9-1.6h-.2a2 2 0 1 1 0-4h.2l.9-1.7-.1-.1A2 2 0 1 1 9.3 4.8l.1.1 1.6-.9v-.2a2 2 0 1 1 4 0V4l1.6.9.1-.1a2 2 0 1 1 2.8 2.8l-.1.1.9 1.7h.2a2 2 0 1 1 0 4h-.2z" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
    moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" />,
    upload: <><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    spark: <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7Z" /><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7Z" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    external: <><path d="M14 3h7v7M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>,
    refresh: <><path d="M20 11a8.1 8.1 0 0 0-14.9-3L3 11M3 5v6h6M4 13a8.1 8.1 0 0 0 14.9 3L21 13m0 6v-6h-6" /></>,
    message: <><path d="M20 15a3 3 0 0 1-3 3H8l-4 3v-6a3 3 0 0 1-1-2V7a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3Z" /><path d="M8 9h8M8 13h5" /></>,
  }
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function App() {
  const [page, setPage] = useState('overview')
  const [dark, setDark] = useState(() => localStorage.getItem('skillbridge-theme') !== 'light')
  const [mobileNav, setMobileNav] = useState(false)
  const [apiStatus, setApiStatus] = useState('checking')
  const [skills, setSkills] = useState(['Python', 'FastAPI'])
  const [resume, setResume] = useState(null)
  const [resumeResult, setResumeResult] = useState(null)
  const [resumeLoading, setResumeLoading] = useState(false)
  const [resumeError, setResumeError] = useState('')
  const [selectedRole, setSelectedRole] = useState('Python Developer')
  const [gap, setGap] = useState(null)
  const [gapLoading, setGapLoading] = useState(false)
  const [gapError, setGapError] = useState('')
  const [roadmap, setRoadmap] = useState(null)
  const [roadmapLoading, setRoadmapLoading] = useState(false)
  const [roadmapError, setRoadmapError] = useState('')
  const [completed, setCompleted] = useState(new Set())
  const [dailyMinutes, setDailyMinutes] = useState(60)
  const [recommendations, setRecommendations] = useState([])
  const [recommendationLoading, setRecommendationLoading] = useState(true)
  const [recommendationError, setRecommendationError] = useState('')
  const [jobMatch, setJobMatch] = useState(null)
  const [jobMatchLoading, setJobMatchLoading] = useState(false)
  const [jobMatchError, setJobMatchError] = useState('')
  const [mentorAnswer, setMentorAnswer] = useState(null)
  const [mentorLoading, setMentorLoading] = useState(false)
  const [mentorError, setMentorError] = useState('')
  const fileInput = useRef(null)

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('skillbridge-theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    checkHealth().then(() => setApiStatus('online')).catch(() => setApiStatus('offline'))
  }, [])

  useEffect(() => {
    getRecommendations(skills)
      .then((result) => {
        setRecommendations(result.recommendations)
        setRecommendationError('')
      })
      .catch((error) => setRecommendationError(error.message))
      .finally(() => setRecommendationLoading(false))
  }, [skills])

  const currentPage = useMemo(() => navigation.find((item) => item.id === page), [page])

  function navigate(id) {
    setPage(id)
    setMobileNav(false)
    if (id === 'gap') loadGap(selectedRole)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function selectFile(file) {
    setResumeError('')
    setResumeResult(null)
    if (!file) return
    if (file.type !== 'application/pdf') {
      setResumeError('Please choose a PDF file. Other formats are not supported.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeError('That file is larger than 5 MB. Please choose a smaller PDF.')
      return
    }
    setResume(file)
  }

  async function handleResumeAnalyze() {
    if (!resume) return
    setResumeLoading(true)
    setResumeError('')
    try {
      const result = await analyzeResume(resume)
      setResumeResult(result)
      setSkills(result.skills)
    } catch (error) {
      setResumeError(error.message)
    } finally {
      setResumeLoading(false)
    }
  }

  const loadGap = useCallback(async (role = selectedRole) => {
    setSelectedRole(role)
    setGapLoading(true)
    setGapError('')
    try {
      setGap(await getSkillGap(role, skills))
    } catch (error) {
      setGapError(error.message)
    } finally {
      setGapLoading(false)
    }
  }, [selectedRole, skills])

  async function createRoadmap() {
    setRoadmapLoading(true)
    setRoadmapError('')
    try {
      setRoadmap(await generateFocusedRoadmap(
        selectedRole,
        skills,
        dailyMinutes,
        jobMatch?.suggested_learning_skills,
      ))
      setCompleted(new Set())
    } catch (error) {
      setRoadmapError(error.message)
    } finally {
      setRoadmapLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Icon name="spark" size={21} /></div>
          <div><strong>SkillBridge</strong><span>AI career navigator</span></div>
          <button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><Icon name="close" /></button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          {navigation.map((item) => (
            <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}>
              <Icon name={item.icon} /><span>{item.label}</span>{item.badge && <em>{item.badge}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="api-pill"><span className={`status-dot ${apiStatus}`}></span><span>API {apiStatus === 'checking' ? 'checking' : apiStatus}</span><button onClick={() => checkHealth().then(() => setApiStatus('online')).catch(() => setApiStatus('offline'))} aria-label="Refresh API status"><Icon name="refresh" size={14} /></button></div>
          <button className="nav-item" onClick={() => navigate('settings')}><Icon name="settings" /><span>Settings</span></button>
          <div className="profile"><div className="avatar">JS</div><div><strong>Jordan Smith</strong><span>Career explorer</span></div><span className="profile-more">•••</span></div>
        </div>
      </aside>
      {mobileNav && <button className="mobile-overlay" onClick={() => setMobileNav(false)} aria-label="Close menu overlay"></button>}
      <main className="main-area">
        <header className="topbar">
          <button className="menu-button icon-button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Icon name="menu" /></button>
          <div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{currentPage?.label}</strong></div>
          <div className="top-actions"><div className="demo-badge"><span></span> Demo workspace</div><button className="theme-toggle" onClick={() => setDark(!dark)} aria-label="Toggle theme"><Icon name={dark ? 'sun' : 'moon'} size={17} /></button></div>
        </header>
        <div className="content">
          {page === 'overview' && <Overview navigate={navigate} gap={gap} roadmap={roadmap} skills={skills} recommendations={recommendations} role={selectedRole} />}
          {page === 'resume' && <ResumeAnalyzer resume={resume} setResume={selectFile} removeResume={() => { setResume(null); setResumeResult(null) }} fileInput={fileInput} loading={resumeLoading} result={resumeResult} error={resumeError} analyze={handleResumeAnalyze} />}
          {page === 'recommendations' && <Recommendations navigate={navigate} recommendations={recommendations} loading={recommendationLoading} error={recommendationError} />}
          {page === 'gap' && <SkillGapPage role={selectedRole} setRole={setSelectedRole} skills={skills} gap={gap} loading={gapLoading} error={gapError} refresh={loadGap} roadmap={createRoadmap} />}
          {page === 'roadmap' && <RoadmapPage roadmap={roadmap} loading={roadmapLoading} error={roadmapError} minutes={dailyMinutes} setMinutes={setDailyMinutes} generate={createRoadmap} completed={completed} setCompleted={setCompleted} role={selectedRole} />}
          {page === 'matcher' && <JobMatcher skills={skills} role={selectedRole} result={jobMatch} loading={jobMatchLoading} error={jobMatchError} match={async (description) => { setJobMatchLoading(true); setJobMatchError(''); try { setJobMatch(await matchJobDescription(description, skills, selectedRole)) } catch (error) { setJobMatchError(error.message) } finally { setJobMatchLoading(false) } }} buildRoadmap={() => { setPage('roadmap'); createRoadmap() }} />}
          {page === 'mentor' && <MentorPage role={selectedRole} skills={skills} answer={mentorAnswer} loading={mentorLoading} error={mentorError} ask={async (question) => { setMentorLoading(true); setMentorError(''); try { setMentorAnswer(await askMentor(question, selectedRole, skills)) } catch (error) { setMentorError(error.message) } finally { setMentorLoading(false) } }} />}
          {page === 'settings' && <Settings dark={dark} setDark={setDark} apiStatus={apiStatus} reset={() => { setResume(null); setResumeResult(null); setRoadmap(null); setCompleted(new Set()); setSkills(['Python', 'FastAPI']) }} />}
        </div>
      </main>
    </div>
  )
}

const navigation = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'resume', label: 'Resume Analyzer', icon: 'file' },
  { id: 'recommendations', label: 'Job Recommendations', icon: 'briefcase', badge: 'Live' },
  { id: 'gap', label: 'Skill Gap', icon: 'target' },
  { id: 'roadmap', label: 'Learning Roadmap', icon: 'map' },
  { id: 'matcher', label: 'Job Description Match', icon: 'briefcase', badge: 'Live' },
  { id: 'mentor', label: 'Career Mentor', icon: 'message', badge: 'Live' },
]

function PageIntro({ eyebrow, title, description, action }) {
  return <div className="page-intro"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function Overview({ navigate, gap, roadmap, skills, recommendations, role }) {
  const overviewGap = gap || { missing_required_skills: [], matched_required_skills: [], skill_coverage_percentage: 0 }
  const completed = roadmap ? Math.round((roadmap.tasks.filter((task) => task.day <= 4).length / 30) * 100) : 0
  return <><PageIntro eyebrow="Monday, October 25, 2026" title={<>Build your next <span className="gradient-text">breakthrough.</span></>} description="Your career journey, made clearer. Turn your current skills into a focused plan for where you want to go." action={<button className="button primary" onClick={() => navigate('resume')}><Icon name="spark" size={16} /> Analyze a resume <Icon name="arrow" size={15} /></button>} />
    <div className="welcome-banner"><div className="banner-glow"></div><div className="banner-icon"><Icon name="spark" size={24} /></div><div><strong>Your profile workspace</strong><p>Build evidence toward becoming a <b>{role}</b>.</p></div><button className="text-button" onClick={() => navigate('roadmap')}>View roadmap <Icon name="arrow" size={14} /></button></div>
    <section className="stats-grid">
      <StatCard label="Skills detected" value={skills.length} detail={skills.length ? 'From analyzed resume' : 'Analyze a resume first'} icon="spark" tone="cyan" />
      <StatCard label="Top role match" value={recommendations.length ? `${Math.round(recommendations[0].match_percentage)}%` : '—'} detail={recommendations[0]?.target_role || 'Awaiting profile'} icon="briefcase" tone="violet" />
      <StatCard label="Skill coverage" value={gap ? `${Math.round(overviewGap.skill_coverage_percentage)}%` : '—'} detail={gap ? `${overviewGap.missing_required_skills.length} skills to focus on` : 'Open Skill Gap for analysis'} icon="target" tone="amber" />
      <StatCard label="Roadmap progress" value={roadmap ? `${completed}%` : '0%'} detail={roadmap ? 'Keep the momentum' : 'Not started yet'} icon="map" tone="green" />
    </section>
    <div className="dashboard-grid"><section className="card activity-card"><div className="card-heading"><div><span className="eyebrow">YOUR MOMENTUM</span><h2>Career progress</h2></div><button className="ghost-button" onClick={() => navigate('gap')}>View skill gap <Icon name="arrow" size={14} /></button></div><div className="progress-orb"><div className="orb-ring" style={{ '--progress': `${overviewGap.skill_coverage_percentage}%` }}><div><strong>{gap ? `${Math.round(overviewGap.skill_coverage_percentage)}%` : '—'}</strong><span>skill coverage</span></div></div><div className="orb-copy"><strong>{gap ? 'Your current snapshot' : 'Analyze to unlock progress'}</strong><p>{gap ? 'Close your remaining gaps to unlock stronger role matches.' : 'Upload a resume to create an evidence-based profile.'}</p><div className="mini-legend"><span><i className="dot cyan"></i>Matched {overviewGap.matched_required_skills.length}</span><span><i className="dot muted"></i>To learn {overviewGap.missing_required_skills.length}</span></div></div></div></section><section className="card activity-card"><div className="card-heading"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>Keep going</h2></div><span className="live-label"><i></i> Live plan</span></div><div className="activity-list"><Activity icon="file" title="Resume analysis" detail={skills.length ? 'Profile loaded from analyzed resume' : 'Upload a resume to begin'} tone="cyan" /><Activity icon="target" title="Skill gap reviewed" detail={gap ? `${gap.target_role} · ${Math.round(gap.skill_coverage_percentage)}% covered` : 'Open Skill Gap to load live analysis'} tone="violet" /><Activity icon="map" title="Roadmap ready" detail={roadmap ? 'Your 30-day plan is active' : 'Generate your first learning plan'} tone="amber" /></div><button className="button secondary full-button" onClick={() => navigate(roadmap ? 'roadmap' : 'gap')}>{roadmap ? 'Continue learning' : 'Create your roadmap'} <Icon name="arrow" size={15} /></button></section></div>
    <div className="section-heading"><div><span className="eyebrow">RECOMMENDED FOR YOU</span><h2>Roles worth exploring</h2></div><button className="text-button" onClick={() => navigate('recommendations')}>See all roles <Icon name="arrow" size={14} /></button></div>{recommendations.length ? <div className="role-preview">{recommendations.slice(0, 3).map((role) => <RoleCard key={role.target_role} role={role} compact />)}</div> : <div className="card empty-inline">Analyze a resume to receive live role recommendations.</div>}<p className="demo-note"><span className="data-source"><i></i> Live deterministic recommendations based on your analyzed skills.</span></p>
  </>
}

function StatCard({ label, value, detail, icon, tone }) {
  return <div className={`stat-card ${tone}`}><div className="stat-top"><div className="stat-icon"><Icon name={icon} size={17} /></div><span className="stat-label">{label}</span></div><strong className="stat-value">{value}</strong><span className="stat-detail">{detail}</span></div>
}

function Activity({ icon, title, detail, tone }) {
  return <div className="activity-row"><div className={`activity-icon ${tone}`}><Icon name={icon} size={16} /></div><div><strong>{title}</strong><span>{detail}</span></div><Icon name="arrow" size={15} /></div>
}

function ResumeAnalyzer({ resume, setResume, removeResume, fileInput, loading, result, error, analyze }) {
  const [dragging, setDragging] = useState(false)
  return <><PageIntro eyebrow="RESUME INTELLIGENCE" title="See your strengths clearly." description="Upload your resume and turn your experience into an actionable skills profile." /><div className="resume-layout"><section className="card upload-card"><div className={`dropzone ${dragging ? 'dragging' : ''} ${resume ? 'has-file' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); setResume(event.dataTransfer.files[0]) }} onClick={() => !resume && fileInput.current?.click()} role="button" tabIndex="0" onKeyDown={(event) => event.key === 'Enter' && fileInput.current?.click()}><input ref={fileInput} type="file" accept="application/pdf" hidden onChange={(event) => setResume(event.target.files[0])} />{resume ? <><div className="file-icon"><Icon name="file" size={24} /></div><strong>{resume.name}</strong><span>{formatBytes(resume.size)} · PDF document</span><button className="remove-file" onClick={(event) => { event.stopPropagation(); removeResume() }}>Remove file</button></> : <><div className="upload-icon"><Icon name="upload" size={25} /></div><strong>Drop your resume here</strong><span>or <u>browse files</u> from your computer</span><small>PDF only · maximum 5 MB</small></>}</div>{error && <div className="inline-error">{error}</div>}<button className="button primary full-button" disabled={!resume || loading} onClick={analyze}>{loading ? <><span className="spinner"></span> Analyzing your resume...</> : <><Icon name="spark" size={16} /> Analyze resume</>}</button><p className="privacy-note"><Icon name="check" size={14} /> Processed securely in memory · never stored</p></section><section className="card result-card">{result ? <><div className="card-heading"><div><span className="eyebrow">ANALYSIS COMPLETE</span><h2>Your skill snapshot</h2></div><span className="success-pill"><Icon name="check" size={13} /> Ready</span></div><div className="skill-count"><strong>{result.skills.length}</strong><span>skills detected</span></div><div className="chip-list">{result.skills.map((skill) => <span className="skill-chip" key={skill}>{skill}<Icon name="check" size={12} /></span>)}</div><div className="preview-box"><span>TEXT PREVIEW</span><p>{result.preview}</p></div></> : <EmptyResult />}</section></div></>
}

function EmptyResult() {
  return <div className="empty-result"><div className="empty-art"><Icon name="spark" size={26} /></div><h2>Your insights will appear here</h2><p>Upload a PDF resume to see detected skills and a short text preview.</p><div className="empty-line"></div><span className="small-muted">Your resume is processed only after you click analyze.</span></div>
}

function Recommendations({ navigate, recommendations, loading, error }) {
  return <><PageIntro eyebrow="ROLE EXPLORER · LIVE RULES" title="Where could you go next?" description="Ranked from your analyzed skills using transparent required and optional skill weights. These are estimates, not hiring probabilities." action={<span className="data-source"><i></i> Live API results</span>} />{error && <div className="inline-error">{error}</div>}{loading ? <Loading text="Ranking your role matches..." /> : recommendations.length ? <div className="recommendation-grid">{recommendations.map((role) => <RoleCard key={role.target_role} role={role} onAction={() => navigate('gap')} />)}</div> : <div className="card empty-inline">Analyze a resume first to generate role recommendations.</div>}</>
}

function RoleCard({ role, compact = false, onAction }) {
  const matched = [...role.matched_required_skills, ...role.matched_optional_skills]
  return <article className={`role-card cyan ${compact ? 'compact' : ''}`}><div className="role-card-top"><div className="role-symbol"><Icon name="briefcase" size={18} /></div><span className="match-label">EST. MATCH <strong>{role.match_percentage}%</strong></span></div><h3>{role.target_role}</h3><p>{role.explanation}</p><div className="role-skills"><div><span className="skill-label">MATCHED</span><div className="mini-chips">{matched.length ? matched.map((skill) => <span className="tiny-chip good" key={skill}>{skill}</span>) : <span className="tiny-chip muted">No matches yet</span>}</div></div><div><span className="skill-label">NEXT TO LEARN</span><div className="mini-chips">{role.missing_required_skills.map((skill) => <span className="tiny-chip" key={skill}>{skill}</span>)}</div></div></div>{!compact && <button className="button secondary full-button" onClick={onAction}>View skill gap <Icon name="arrow" size={15} /></button>}</article>
}

function SkillGapPage({ role, setRole, skills, gap, loading, error, refresh, roadmap }) {
  return <><PageIntro eyebrow="SKILL GAP ANALYSIS" title="Know what to learn next." description="Compare your current skills with the requirements for a target role, then turn the gaps into momentum." action={<button className="button primary" onClick={roadmap} disabled={!gap}><Icon name="map" size={16} /> Build learning plan <Icon name="arrow" size={15} /></button>} /><div className="toolbar"><label>Target role<select value={role} onChange={(event) => { setRole(event.target.value); refresh(event.target.value) }}>{roles.map((item) => <option key={item}>{item}</option>)}</select></label><span className="data-source"><i></i> Live skill rules</span></div>{error && <div className="inline-error">{error}</div>}{loading || !gap ? <Loading text={error ? 'Choose another role or retry the live analysis.' : 'Calculating your skill gap...'} /> : <><div className="gap-hero card"><div className="coverage-ring" style={{ '--progress': `${gap.skill_coverage_percentage}%` }}><div><strong>{Math.round(gap.skill_coverage_percentage)}<small>%</small></strong><span>coverage</span></div></div><div className="gap-summary"><span className="eyebrow">YOUR READINESS SNAPSHOT</span><h2>{gap.missing_required_skills.length ? `Close ${gap.missing_required_skills.length} focused gaps to move forward.` : 'You meet every required skill.'}</h2><p>Coverage is calculated from matched required skills divided by the role’s total required skills.</p><div className="gap-meta"><span><b>{gap.matched_required_skills.length}</b> matched required</span><span><b>{gap.missing_required_skills.length}</b> missing required</span><span><b>{gap.matched_optional_skills.length}</b> optional matched</span></div></div></div><div className="gap-columns"><SkillList title="Your current skills" skills={skills} icon="check" tone="good" empty="Analyze a resume to populate your skills." /><SkillList title="Priority skills to learn" skills={gap.missing_required_skills} icon="target" tone="missing" empty="No required gaps — great work." /><SkillList title="Optional advantages" skills={gap.matched_optional_skills} icon="spark" tone="optional" empty="No optional skills matched yet." /></div></>}</>
}

function SkillList({ title, skills, icon, tone, empty }) {
  return <section className="card skill-list-card"><div className="card-heading"><h2>{title}</h2><span className={`count-badge ${tone}`}>{skills.length}</span></div>{skills.length ? <div className="large-chip-list">{skills.map((skill) => <span className={`large-chip ${tone}`} key={skill}><Icon name={icon} size={14} />{skill}</span>)}</div> : <p className="small-muted">{empty}</p>}</section>
}

function RoadmapPage({ roadmap, loading, error, minutes, setMinutes, generate, completed, setCompleted, role }) {
  const toggleTask = (day) => setCompleted((current) => {
    const next = new Set(current)
    if (next.has(day)) next.delete(day)
    else next.add(day)
    return next
  })
  return <><PageIntro eyebrow="LEARNING ROADMAP" title="Small steps. Real momentum." description="A focused 30-day plan built around your skill gaps, with a deliverable for every day." action={roadmap && <span className="progress-pill"><span style={{ width: `${Math.round((completed.size / 30) * 100)}%` }}></span>{completed.size}/30 complete</span>} />{!roadmap ? <section className="card roadmap-empty"><div className="empty-art"><Icon name="map" size={28} /></div><h2>Your roadmap is waiting</h2><p>Choose how much time you can invest each day, then generate a plan tailored to your target role.</p><div className="roadmap-controls"><label>Daily learning time<select value={minutes} onChange={(event) => setMinutes(Number(event.target.value))}><option value="30">30 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option><option value="120">120 minutes</option></select></label><button className="button primary" onClick={generate} disabled={loading}>{loading ? <><span className="spinner"></span> Building plan...</> : <><Icon name="spark" size={16} /> Generate 30-day plan</>}</button></div>{error && <div className="inline-error">{error}</div>}<span className="demo-note"><span className="demo-dot"></span> Powered by your live {role} skill gap</span></section> : <><div className="roadmap-summary"><div className="card roadmap-summary-main"><div><span className="eyebrow">ACTIVE PLAN</span><h2>{roadmap.target_role} · 30 days</h2><p>{roadmap.daily_minutes} minutes per day · {roadmap.final_mini_project}</p></div><div className="big-progress"><strong>{Math.round((completed.size / 30) * 100)}%</strong><span>overall progress</span></div></div><div className="card mini-project"><span className="eyebrow">FINAL MINI-PROJECT</span><h3>Show what you know</h3><p>{roadmap.final_mini_project}</p><span className="project-tag"><Icon name="spark" size={13} /> Portfolio-ready</span></div></div><div className="weeks">{roadmap.weeks.map((week) => <section className="week-section" key={week.week}><div className="week-heading"><div><span className="week-number">0{week.week}</span><div><span className="eyebrow">WEEK {week.week}</span><h2>{week.goal}</h2></div></div><span className="week-count">{week.tasks.filter((task) => completed.has(task.day)).length}/{week.tasks.length} done</span></div><div className="task-list">{week.tasks.map((task) => <label className={`task-row ${completed.has(task.day) ? 'task-complete' : ''}`} key={task.day}><input type="checkbox" checked={completed.has(task.day)} onChange={() => toggleTask(task.day)} /><span className="check-box"><Icon name="check" size={13} /></span><span className="task-day">DAY {String(task.day).padStart(2, '0')}</span><span className="task-main"><strong>{task.topic}</strong><span>{task.learning_activity}</span><small><Icon name="check" size={12} /> {task.deliverable}</small></span><span className="task-time"><Icon name="clock" size={13} /> {task.estimated_minutes}m</span></label>)}</div></section>)}</div></>}</>
}

function JobMatcher({ skills, role, result, loading, error, match, buildRoadmap }) {
  const [description, setDescription] = useState('')
  return <><PageIntro eyebrow="JOB DESCRIPTION MATCH" title="Measure your fit for a real opportunity." description="Paste a job description to compare its known skills with your analyzed profile. SkillBridge shows the evidence it found and the gaps worth learning." /><section className="card matcher-form"><label>Target role<select defaultValue={role}><option>{role}</option></select></label><label>Job description<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Paste at least 20 characters from a job description..." rows="8" /></label><div className="form-footer"><span className="small-muted">{skills.length} analyzed skills available · no job text is stored</span><button className="button primary" disabled={loading || description.trim().length < 20} onClick={() => match(description)}>{loading ? <><span className="spinner"></span> Matching...</> : <><Icon name="target" size={16} /> Match description</>}</button></div>{error && <div className="inline-error">{error}</div>}</section>{result && <section className="matcher-results"><div className="card gap-hero"><div className="coverage-ring" style={{ '--progress': `${result.skill_coverage_percentage}%` }}><div><strong>{Math.round(result.skill_coverage_percentage)}<small>%</small></strong><span>coverage</span></div></div><div className="gap-summary"><span className="eyebrow">EVIDENCE-BASED MATCH</span><h2>{result.missing_skills.length ? `${result.missing_skills.length} required gaps found.` : 'Your required skills match.'}</h2><p>Coverage uses the required skills explicitly detected in this job description.</p><div className="gap-meta"><span><b>{result.matched_skills.length}</b> matched</span><span><b>{result.missing_skills.length}</b> required gaps</span><span><b>{result.detected_optional_skills.length}</b> optional detected</span></div></div></div><div className="gap-columns"><SkillList title="Matched skills" skills={result.matched_skills} icon="check" tone="good" empty="No analyzed skills match yet." /><SkillList title="Priority learning gaps" skills={result.missing_skills} icon="target" tone="missing" empty="No required gaps detected." /><section className="card skill-list-card"><div className="card-heading"><h2>Resume evidence</h2><span className="count-badge optional">{result.matched_evidence.length}</span></div>{result.matched_evidence.length ? <div className="evidence-list">{result.matched_evidence.map((item) => <p key={item.skill}><strong>{item.skill}</strong><span>{item.evidence}</span></p>)}</div> : <p className="small-muted">Evidence appears when a known skill is found in the description.</p>}</section></div><button className="button primary" onClick={buildRoadmap}><Icon name="map" size={16} /> Build roadmap from these gaps</button></section>}</>
}

function MentorPage({ role, skills, answer, loading, error, ask }) {
  const [question, setQuestion] = useState('What should I learn next for my target role?')
  return <><PageIntro eyebrow="CAREER MENTOR" title="Turn analysis into a next step." description="Ask a focused question and receive deterministic guidance grounded in your analyzed skills and target role." action={<span className="data-source"><i></i> Profile grounded</span>} /><section className="card mentor-form"><div className="mentor-profile"><div className="avatar">JS</div><div><strong>{role}</strong><span>{skills.length} analyzed skills · no paid AI service configured</span></div></div><label>Your question<textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows="4" /></label><button className="button primary" disabled={loading || !question.trim()} onClick={() => ask(question)}>{loading ? <><span className="spinner"></span> Thinking...</> : <><Icon name="message" size={16} /> Ask your mentor</>}</button>{error && <div className="inline-error">{error}</div>}</section>{answer && <section className="card mentor-answer"><span className="eyebrow">YOUR GUIDANCE</span><h2>{answer.response}</h2><div className="mentor-coverage">Current required-skill coverage: <strong>{Math.round(answer.skill_coverage_percentage)}%</strong></div><h3>Suggested next steps</h3><ol>{answer.next_steps.map((step) => <li key={step}>{step}</li>)}</ol><p className="small-muted">{answer.disclaimer}</p></section>}</>
}

function Settings({ dark, setDark, apiStatus, reset }) {
  return <><PageIntro eyebrow="PREFERENCES" title="Make SkillBridge yours." description="Tune your workspace and keep your career exploration experience comfortable." /><div className="settings-grid"><section className="card settings-card"><div className="settings-row"><div className="settings-icon"><Icon name={dark ? 'moon' : 'sun'} /></div><div><strong>Appearance</strong><span>Choose the theme that works for you.</span></div><button className="switch" aria-pressed={dark} onClick={() => setDark(!dark)}><span className={dark ? 'on' : ''}></span></button></div><div className="settings-row"><div className="settings-icon"><Icon name="refresh" /></div><div><strong>API connection</strong><span>Default: http://127.0.0.1:8000</span></div><span className={`connection-label ${apiStatus}`}><i></i>{apiStatus}</span></div></section><section className="card settings-card"><span className="eyebrow">DEMO WORKSPACE</span><h2>Reset your demo data</h2><p>Clear the local resume analysis, generated roadmap, and completed task state. Your files are never stored in browser storage.</p><button className="button secondary" onClick={reset}><Icon name="refresh" size={15} /> Reset workspace</button></section></div></>
}

function Loading({ text }) { return <div className="loading-state"><span className="spinner"></span>{text}</div> }
function formatBytes(bytes) { return `${(bytes / 1024 / 1024).toFixed(2)} MB` }

export default App
