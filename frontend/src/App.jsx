import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  analyzeResume,
  askMentor,
  checkHealth,
  generateFocusedRoadmap,
  getProfile,
  getRoadmapProgress,
  getRoadmapProgressHistory,
  getRecommendations,
  getCareerIntelligence,
  getSavedJobMatches,
  getSkillGap,
  matchJobDescription,
  saveJobMatch,
  saveRoadmapProgress,
  updateProfile,
  generatePortfolioProject,
  savePortfolioProject,
  getPortfolioProjects,
  updatePortfolioProject,
  prepareInterview,
  evaluateInterviewAnswer,
  saveInterviewSession,
  getInterviewSessions,
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  optimizeResume,
  getResumeVersions,
  saveResumeVersion,
  deleteResumeVersion,
  getCopilotDashboard,
  updateCopilotAction,
  updateCopilotPreferences,
  startCopilotWorkflow,
  updateCopilotWorkflowStep,
  createCopilotPlanTask,
  updateCopilotPlanTask,
  deleteCopilotPlanTask,
  askCopilot,
} from './services/api'
import './App.css'

import { Sidebar } from './components/Sidebar'
import { NAVIGATION_ITEMS } from './constants/navigation'
import { Topbar } from './components/Topbar'
import { Overview } from './components/Overview'
import { ResumeAnalyzer } from './components/ResumeAnalyzer'
import { Recommendations } from './components/Recommendations'
import { SkillGapPage } from './components/SkillGapPage'
import { RoadmapPage } from './components/RoadmapPage'
import { JobMatcher } from './components/JobMatcher'
import { SavedMatches } from './components/SavedMatches'
import { MentorPage } from './components/MentorPage'
import { Settings } from './components/Settings'
import { PortfolioProjects } from './components/PortfolioProjects'
import { InterviewPrep } from './components/InterviewPrep'
import { Applications } from './components/Applications'
import { Copilot } from './components/Copilot'

import { SAMPLE_RESUME_FILE, SAMPLE_RESUME_RESULT } from './constants/sampleResume'

const DEFAULT_DEMO_SKILLS = SAMPLE_RESUME_RESULT.skills

function App() {
  const [page, setPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '')
      const match = NAVIGATION_ITEMS.find((item) => item.id === hash)
      if (match) return hash
      if (hash === 'settings') return 'settings'
    }
    return 'overview'
  })
  const [dark, setDark] = useState(() => localStorage.getItem('skillbridge-theme') !== 'light')
  const [mobileNav, setMobileNav] = useState(false)
  const [apiStatus, setApiStatus] = useState('checking')
  const [profileName, setProfileName] = useState('Rohit Sharma')
  const [experienceLevel, setExperienceLevel] = useState('Aspiring Developer')
  const [profileSaveState, setProfileSaveState] = useState('idle')

  const appShellRef = useRef(null)

  // Global persistent mouse parallax engine for all routes
  useEffect(() => {
    const shell = appShellRef.current
    if (!shell) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const touchDevice = window.matchMedia('(hover: none)')
    if (reducedMotion.matches || touchDevice.matches) return undefined

    const target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }
    let frame
    let running = false

    const applyTransforms = () => {
      const values = {
        '--cursor-x': `${current.x}`,
        '--cursor-y': `${current.y}`,
        '--spotlight-x': `${((current.x + 1) / 2) * 100}%`,
        '--spotlight-y': `${((current.y + 1) / 2) * 100}%`,
        '--parallax-bg-x': `${current.x * -16}px`,
        '--parallax-bg-y': `${current.y * -16}px`,
        '--parallax-circuits-x': `${current.x * -26}px`,
        '--parallax-circuits-y': `${current.y * -26}px`,
        '--parallax-main-x': `${current.x * 28}px`,
        '--parallax-main-y': `${current.y * 28}px`,
        '--parallax-tilt-x': `${current.y * -7}deg`,
        '--parallax-tilt-y': `${current.x * 7}deg`,
        '--hero-tilt-x': `${current.y * -14}deg`,
        '--hero-tilt-y': `${current.x * 14}deg`,
        '--parallax-card1-x': `${current.x * 58}px`,
        '--parallax-card1-y': `${current.y * 58}px`,
        '--parallax-card2-x': `${current.x * -48}px`,
        '--parallax-card2-y': `${current.y * -48}px`,
        '--parallax-card-x': `${current.x * 8}px`,
        '--parallax-card-y': `${current.y * 8}px`,
      }
      Object.entries(values).forEach(([prop, val]) => {
        shell.style.setProperty(prop, val)
        document.documentElement.style.setProperty(prop, val)
      })
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

    const handlePointerMove = (e) => {
      const width = window.innerWidth || document.documentElement.clientWidth
      const height = window.innerHeight || document.documentElement.clientHeight
      target.x = Math.max(-1, Math.min(1, (e.clientX / width) * 2 - 1))
      target.y = Math.max(-1, Math.min(1, (e.clientY / height) * 2 - 1))
      startAnimation()
    }

    const handlePointerLeave = () => {
      target.x = 0
      target.y = 0
      startAnimation()
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  // Profile and resume state (hydrated with demonstration developer resume by default)
  const [skills, setSkills] = useState(DEFAULT_DEMO_SKILLS)
  const [isRealResume, setIsRealResume] = useState(false)
  const [resume, setResume] = useState(SAMPLE_RESUME_FILE)
  const [resumeResult, setResumeResult] = useState(SAMPLE_RESUME_RESULT)
  const [resumeLoading, setResumeLoading] = useState(false)
  const [resumeError, setResumeError] = useState('')
  const fileInput = useRef(null)

  // Target role and gap analysis state
  const [selectedRole, setSelectedRole] = useState('Python Developer')
  const [gap, setGap] = useState(null)
  const [gapLoading, setGapLoading] = useState(false)
  const [gapError, setGapError] = useState('')

  // Roadmap state
  const [roadmap, setRoadmap] = useState(null)
  const [roadmapLoading, setRoadmapLoading] = useState(false)
  const [roadmapError, setRoadmapError] = useState('')
  const [dailyMinutes, setDailyMinutes] = useState(60)
  const [focusSkills, setFocusSkills] = useState(null)
  const [completed, setCompleted] = useState(() => {
    try {
      const saved = localStorage.getItem('skillbridge-completed-tasks:Python Developer')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })
  const [roadmapHistory, setRoadmapHistory] = useState([])
  const [roadmapHistoryError, setRoadmapHistoryError] = useState('')

  // Role recommendations
  const [recommendations, setRecommendations] = useState([])
  const [recommendationLoading, setRecommendationLoading] = useState(true)
  const [recommendationError, setRecommendationError] = useState('')
  const [careerIntelligence, setCareerIntelligence] = useState(null)
  const [careerIntelligenceLoading, setCareerIntelligenceLoading] = useState(false)
  const [careerIntelligenceError, setCareerIntelligenceError] = useState('')

  // Job matcher state
  const [jobMatch, setJobMatch] = useState(null)
  const [jobMatchLoading, setJobMatchLoading] = useState(false)
  const [jobMatchError, setJobMatchError] = useState('')
  const [savedMatches, setSavedMatches] = useState([])
  const [savedMatchesLoading, setSavedMatchesLoading] = useState(true)
  const [savedMatchesError, setSavedMatchesError] = useState('')

  // Application tracker state
  const [applications, setApplications] = useState([])
  const [applicationsLoading, setApplicationsLoading] = useState(true)
  const [applicationsError, setApplicationsError] = useState('')

  // Resume optimization state
  const [resumeOptimization, setResumeOptimization] = useState(null)
  const [resumeVersions, setResumeVersions] = useState([])
  const [resumeVersionsLoading, setResumeVersionsLoading] = useState(false)
  const [resumeVersionsError, setResumeVersionsError] = useState('')

  // Career Copilot state
  const [copilotDashboard, setCopilotDashboard] = useState(null)
  const [copilotLoading, setCopilotLoading] = useState(false)
  const [copilotError, setCopilotError] = useState('')
  const [copilotChatLoading, setCopilotChatLoading] = useState(false)
  const [copilotChatError, setCopilotChatError] = useState('')

  const refreshCopilot = useCallback(async () => {
    setCopilotLoading(true)
    setCopilotError('')
    try {
      setCopilotDashboard(await getCopilotDashboard())
    } catch (error) {
      setCopilotError(error.message)
    } finally {
      setCopilotLoading(false)
    }
  }, [])

  // Portfolio project state
  const [portfolioProject, setPortfolioProject] = useState(null)
  const [portfolioLoading, setPortfolioLoading] = useState(true)
  const [portfolioError, setPortfolioError] = useState('')
  const [savedProjects, setSavedProjects] = useState([])

  // Interview preparation state
  const [interviewPlan, setInterviewPlan] = useState(null)
  const [interviewLoading, setInterviewLoading] = useState(true)
  const [interviewError, setInterviewError] = useState('')
  const [interviewSessions, setInterviewSessions] = useState([])

  // Mentor state
  const [mentorAnswer, setMentorAnswer] = useState(null)
  const [mentorLoading, setMentorLoading] = useState(false)
  const [mentorError, setMentorError] = useState('')

  // Sync theme
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('skillbridge-theme', dark ? 'dark' : 'light')
  }, [dark])

  // Sync task completion in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`skillbridge-completed-tasks:${selectedRole}`, JSON.stringify([...completed]))
    } catch {
      // Storage error gracefully caught
    }
  }, [completed, selectedRole])

  useEffect(() => {
    if (page !== 'roadmap' && page !== 'overview') return undefined
    let ignore = false
    getRoadmapProgress(selectedRole)
      .then((progress) => {
        if (!ignore) setCompleted(new Set(progress.completed_days || []))
      })
      .catch((error) => {
        if (!ignore) setRoadmapError(`Could not load saved roadmap progress: ${error.message}`)
      })
    getRoadmapProgressHistory(selectedRole)
      .then((result) => {
        if (!ignore) {
          setRoadmapHistory(result.history || [])
          setRoadmapHistoryError('')
        }
      })
      .catch((error) => {
        if (!ignore) setRoadmapHistoryError(`Could not load roadmap activity: ${error.message}`)
      })
    return () => {
      ignore = true
    }
  }, [page, selectedRole])

  // Initial health check
  useEffect(() => {
    checkHealth()
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'))
    getProfile()
      .then((profile) => {
        if (profile.name !== undefined) setProfileName(profile.name)
        if (profile.experience_level) setExperienceLevel(profile.experience_level)
        if (profile.skills?.length) setSkills(profile.skills)
        if (profile.target_role) setSelectedRole(profile.target_role)
        if (profile.daily_minutes) setDailyMinutes(profile.daily_minutes)
      })
      .catch(() => {})
    getSavedJobMatches()
      .then((result) => setSavedMatches(result.matches || []))
      .catch((error) => setSavedMatchesError(error.message))
      .finally(() => setSavedMatchesLoading(false))
    getPortfolioProjects()
      .then((result) => setSavedProjects(result.projects || []))
      .catch((error) => setPortfolioError(error.message))
      .finally(() => setPortfolioLoading(false))
    getInterviewSessions()
      .then((result) => setInterviewSessions(result.sessions || []))
      .catch((error) => setInterviewError(error.message))
      .finally(() => setInterviewLoading(false))
    getApplications()
      .then((result) => setApplications(result.applications || []))
      .catch((error) => setApplicationsError(error.message))
      .finally(() => setApplicationsLoading(false))
  }, [])

  // Re-fetch recommendations when skills change
  useEffect(() => {
    if (skills.length === 0) {
      setRecommendations([])
      setRecommendationLoading(false)
      return undefined
    }
    let ignore = false
    setRecommendationLoading(true)
    getRecommendations(skills)
      .then((result) => {
        if (!ignore) {
          setRecommendations(result.recommendations || [])
          setRecommendationError('')
        }
      })
      .catch((error) => {
        if (!ignore) setRecommendationError(error.message)
      })
      .finally(() => {
        if (!ignore) setRecommendationLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [skills])

  useEffect(() => {
    let ignore = false
    setResumeVersionsLoading(true)
    getResumeVersions(selectedRole)
      .then((result) => {
        if (!ignore) {
          setResumeVersions(result.versions || [])
          setResumeVersionsError('')
        }
      })
      .catch((error) => {
        if (!ignore) setResumeVersionsError(error.message)
      })
      .finally(() => {
        if (!ignore) setResumeVersionsLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [selectedRole])

  useEffect(() => {
    if (!selectedRole || skills.length === 0) {
      setCareerIntelligence(null)
      setCareerIntelligenceLoading(false)
      return undefined
    }
    let ignore = false
    setCareerIntelligenceLoading(true)
    getCareerIntelligence({
      skills,
      target_role: selectedRole,
      daily_minutes: dailyMinutes,
      completed_days: [...completed],
      saved_matches: savedMatches,
      saved_projects: savedProjects,
      interview_sessions: interviewSessions,
    })
      .then((result) => {
        if (!ignore) {
          setCareerIntelligence(result)
          setCareerIntelligenceError('')
        }
      })
      .catch((error) => {
        if (!ignore) setCareerIntelligenceError(error.message)
      })
      .finally(() => {
        if (!ignore) setCareerIntelligenceLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [completed, dailyMinutes, interviewSessions, savedMatches, savedProjects, selectedRole, skills])

  // Fetch skill gap whenever role or skills change
  useEffect(() => {
    if (skills.length === 0) {
      setGap(null)
      setGapLoading(false)
      setGapError('')
      return undefined
    }
    let ignore = false
    setGapLoading(true)
    getSkillGap(selectedRole, skills)
      .then((gapData) => {
        if (!ignore) {
          setGap(gapData)
          setGapError('')
        }
      })
      .catch((err) => {
        if (!ignore) setGapError(err.message)
      })
      .finally(() => {
        if (!ignore) setGapLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [selectedRole, skills])

  const loadGap = useCallback(
    async (role = selectedRole) => {
      setSelectedRole(role)
    },
    [selectedRole]
  )

  const currentPage = useMemo(
    () => NAVIGATION_ITEMS.find((item) => item.id === page) || { id: page, label: 'Settings' },
    [page]
  )

  function navigate(id) {
    setPage(id)
    const currentHash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : ''
    if (id === 'copilot' && currentHash === id) refreshCopilot()
    if (typeof window !== 'undefined') {
      window.location.hash = id
    }
    setMobileNav(false)
    if (id === 'gap') loadGap(selectedRole)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Support direct route URL entry and browser back/forward navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '')
      const match = NAVIGATION_ITEMS.find((item) => item.id === hash)
      if (match) {
        setPage(hash)
        if (hash === 'copilot') refreshCopilot()
      } else if (hash === 'settings') {
        setPage('settings')
      }
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [refreshCopilot])

  function handleSelectFile(file) {
    setResumeError('')
    if (!file) return
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      setResumeError('Please choose a valid PDF file. Other file formats are not supported.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeError('That PDF is larger than 5 MB. Please select a file under 5 MB.')
      return
    }
    setResume(file)
    setResumeResult(null)
    setResumeOptimization(null)
    setSkills([])
    setGap(null)
    setRoadmap(null)
    setFocusSkills(null)
    setJobMatch(null)
    setIsRealResume(false)
  }

  async function handleAnalyzeResume(fileToAnalyze = null) {
    const file = fileToAnalyze || resume
    if (!file) return
    setResumeLoading(true)
    setResumeError('')
    setResumeResult(null)
    try {
      const result = await analyzeResume(file)

      // Calculate gap analysis immediately for the selected role
      let gapData = null
      try {
        gapData = await getSkillGap(selectedRole, result.skills || [])
        setGap(gapData)
      } catch {
        // Gap fallback caught
      }

      // Extract candidate name from file name or preview
      let candidateName = 'Rohit Sharma'
      if (result.preview) {
        const lines = result.preview.trim().split('\n').map((l) => l.trim()).filter(Boolean)
        const firstLine = (lines[0] || '').replace(/[^\w\s.-]/g, '').trim()
        if (
          firstLine &&
          firstLine.length >= 3 &&
          firstLine.length <= 40 &&
          !/resume|curriculum|cv|summary|developer|engineer/i.test(firstLine)
        ) {
          candidateName = firstLine
            .split(' ')
            .map((w) => (w.length > 1 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toUpperCase()))
            .join(' ')
        }
      }
      if (candidateName === 'Rohit Sharma' && file.name) {
        const cleanName = file.name
          .replace(/\.(pdf|docx|txt)$/i, '')
          .replace(/\.docx$/i, '')
          .replace(/[_-]resume.*$/i, '')
          .replace(/[_-]/g, ' ')
          .trim()
        if (cleanName && cleanName.length >= 3 && cleanName.length <= 40) {
          candidateName = cleanName
            .split(' ')
            .map((w) => (w.length > 1 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toUpperCase()))
            .join(' ')
        }
      }

      // Extract education degree and field
      let degree = 'B.Tech'
      let field = 'Computer Science'
      const eduText = (result.section_content?.education || result.preview || '').toLowerCase()
      if (/bachelor of engineering|b\.e\./.test(eduText)) degree = 'B.E.'
      else if (/b\.tech|bachelor of technology/.test(eduText)) degree = 'B.Tech'
      else if (/m\.tech|master of technology/.test(eduText)) degree = 'M.Tech'
      else if (/mca|master of computer applications/.test(eduText)) degree = 'MCA'
      else if (/b\.s\.|bachelor of science/.test(eduText)) degree = 'B.S.'
      else if (/m\.s\.|master of science/.test(eduText)) degree = 'M.S.'

      if (/information science/.test(eduText)) field = 'Information Science'
      else if (/computer science/.test(eduText)) field = 'Computer Science'
      else if (/information technology/.test(eduText)) field = 'Information Tech'
      else if (/artificial intelligence|machine learning|data science/.test(eduText)) field = 'AI & Data Science'

      // Extract years of experience
      let expText = '2+ years'
      const fullContent = (result.section_content?.experience || '') + ' ' + (result.preview || '')
      const expMatch = fullContent.match(/(\d+)\+?\s*(?:years?|yrs?)/i)
      if (expMatch) {
        expText = `${expMatch[1]}+ years`
      } else if (/intern/i.test(fullContent)) {
        expText = '1+ year'
      }

      // Compute skills breakdown
      const totalSkillsCount = result.skills ? result.skills.length : 12
      const softKeywords = ['teamwork', 'communication', 'problem solving', 'leadership', 'collaboration', 'agile']
      const detectedSoft = (result.skills || []).filter((s) => softKeywords.includes(s.toLowerCase()))
      const softCount = detectedSoft.length || Math.min(3, Math.floor(totalSkillsCount * 0.25))
      const hardCount = Math.max(1, totalSkillsCount - softCount)

      // Matched & missing skills
      const matchedList = gapData?.matched_required_skills?.length
        ? gapData.matched_required_skills
        : (result.skills || []).slice(0, 5)

      const missingList = gapData?.missing_required_skills?.length
        ? gapData.missing_required_skills
        : ['FastAPI', 'PostgreSQL', 'System Design', 'AWS']

      const partialList = gapData?.missing_optional_skills?.length
        ? gapData.missing_optional_skills.slice(0, 3).map((s) => `${s} (basic)`)
        : ['React (basic)', 'SQL (basic)', 'Docker (basic)']

      const score = gapData ? Math.round(gapData.skill_coverage_percentage) : (result.quality?.score || 78)

      // Current timestamp
      const now = new Date()
      const formattedTimestamp =
        now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ', ' +
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

      const enrichedResult = {
        ...result,
        name: candidateName,
        analysis_timestamp: formattedTimestamp,
        overall_score: score,
        extracted_skills_count: totalSkillsCount,
        hard_skills_count: hardCount,
        soft_skills_count: softCount,
        experience_text: expText,
        experience_subtitle: 'Relevant experience found',
        education_degree: degree,
        education_field: field,
        matched_skills: matchedList.slice(0, 5),
        matched_more_count: Math.max(0, matchedList.length - 5),
        partially_matched_skills: partialList,
        missing_skills: missingList,
        summary_text:
          result.section_content?.summary ||
          (result.preview ? result.preview.slice(0, 260) + '...' : '') ||
          'Experienced developer with hands-on technical foundations.',
      }

      setResumeResult(enrichedResult)
      setProfileName(candidateName)
      setExperienceLevel(degree ? `${degree} · ${field}` : 'Aspiring Developer')

      setSkills(result.skills || [])
      setIsRealResume(true)
      updateProfile({
          name: candidateName,
          target_role: selectedRole,
          daily_minutes: dailyMinutes,
          skills: result.skills || [],
          resume_quality: result.quality,
      }).catch(() => {})
    } catch (error) {
      setResumeError(error.message)
    } finally {
      setResumeLoading(false)
    }
  }

  async function handleOptimizeResume(jobDescription, resumeSummary = resumeResult?.summary_text || '') {
    if (!jobDescription || !jobDescription.trim()) {
      throw new Error('Add a job description before optimizing the resume.')
    }
    const result = await optimizeResume({
      target_role: selectedRole,
      skills,
      job_description: jobDescription,
      resume_summary: resumeSummary,
    })
    setResumeOptimization(result)
    return result
  }

  async function handleSaveResumeVersion(versionName, score, result) {
    const saved = await saveResumeVersion({
      target_role: selectedRole,
      version_name: versionName,
      summary: result?.changes_summary || 'Resume optimization draft',
      score,
      result,
    })
    setResumeVersions((current) => [saved, ...current])
    return saved
  }

  async function handleDeleteResumeVersion(versionId) {
    await deleteResumeVersion(versionId)
    setResumeVersions((current) => current.filter((item) => item.id !== versionId))
  }

  async function handleLoadSampleResume() {
    setResumeLoading(true)
    setResumeError('')
    try {
      const response = await fetch('/sample_resume.pdf')
      if (!response.ok) {
        throw new Error('Sample resume could not be retrieved.')
      }
      const blob = await response.blob()
      const sampleFile = new File([blob], 'sample_developer_resume.pdf', {
        type: 'application/pdf',
      })
      setResume(sampleFile)
      setResumeResult(null)
      await handleAnalyzeResume(sampleFile)
    } catch (error) {
      setResumeError(`Could not load sample resume: ${error.message}`)
      setResumeLoading(false)
    }
  }

  async function handleCreateRoadmap(customFocusSkills = null, targetRole = selectedRole) {
    setRoadmapLoading(true)
    setRoadmapError('')
    const activeFocus = customFocusSkills !== null ? customFocusSkills : focusSkills
    try {
      const generated = await generateFocusedRoadmap(
        targetRole,
        skills,
        dailyMinutes,
        activeFocus || undefined
      )
      setRoadmap(generated)
      const progress = await getRoadmapProgress(targetRole)
      setCompleted(new Set(progress.completed_days || []))
    } catch (error) {
      setRoadmapError(error.message)
    } finally {
      setRoadmapLoading(false)
    }
  }

  function handleBuildRoadmapFromGaps(suggestedSkills, role) {
    setSelectedRole(role)
    setFocusSkills(suggestedSkills)
    setPage('roadmap')
    handleCreateRoadmap(suggestedSkills, role)
  }

  async function handleMatchJob(description, role) {
    setJobMatchLoading(true)
    setJobMatchError('')
    try {
      const result = await matchJobDescription(description, skills, role || selectedRole)
      setJobMatch(result)
    } catch (error) {
      setJobMatchError(error.message)
    } finally {
      setJobMatchLoading(false)
    }
  }

  async function handleAskMentor(question, role = selectedRole) {
    setMentorLoading(true)
    setMentorError('')
    try {
      const answer = await askMentor(question, role, skills)
      setMentorAnswer(answer)
    } catch (error) {
      setMentorError(error.message)
    } finally {
      setMentorLoading(false)
    }

  }

  async function handleGeneratePortfolioProject() {
    setPortfolioLoading(true)
    setPortfolioError('')
    try {
      setPortfolioProject(await generatePortfolioProject(selectedRole, skills, {
        focusSkills: gap?.prioritized_gaps?.map((item) => item.skill) || [],
        jobRequirements: jobMatch?.detected_required_skills || [],
        experienceLevel,
        dailyMinutes,
      }))
    } catch (error) {
      setPortfolioError(error.message)
    } finally {
      setPortfolioLoading(false)
    }

  }

  async function handleSavePortfolioProject() {
    const saved = await savePortfolioProject({
      target_role: selectedRole,
      skills,
      focus_skills: gap?.prioritized_gaps?.map((item) => item.skill) || [],
      job_requirements: jobMatch?.detected_required_skills || [],
      experience_level: experienceLevel,
      daily_minutes: dailyMinutes,
    })
    setSavedProjects((current) => [saved, ...current])
  }

  async function handleUpdatePortfolioProject(id, values) {
    const updated = await updatePortfolioProject(id, values)
    setSavedProjects((current) => current.map((item) => item.id === id ? updated : item))
  }

  async function handlePrepareInterview(options = {}) {
    setInterviewLoading(true)
    setInterviewError('')
    try {
      setInterviewPlan(await prepareInterview(selectedRole, skills, {
        ...options,
        focusSkills: gap?.prioritized_gaps?.map((item) => item.skill) || [],
        jobRequirements: jobMatch?.detected_required_skills || [],
      }))
    } catch (error) {
      setInterviewError(error.message)
    } finally {
      setInterviewLoading(false)
    }

  }

  async function handleEvaluateInterviewAnswer(question, answer, criteria) {
    return evaluateInterviewAnswer(question, answer, criteria)
  }

  async function handleSaveInterviewSession(session) {
    const saved = await saveInterviewSession(session)
    setInterviewSessions((current) => [saved, ...current])
    return saved
  }

  async function handleSaveProfile() {
    setProfileSaveState('saving')
    try {
      await updateProfile({
        name: profileName.trim(),
        target_role: selectedRole,
        experience_level: experienceLevel,
        daily_minutes: dailyMinutes,
        skills,
      })
      setProfileSaveState('saved')
    } catch (error) {
      setProfileSaveState('error')
      throw error
    }
  }

  async function handleCreateApplication(application) {
    const saved = await createApplication(application)
    setApplications((current) => [saved, ...current])
  }

  async function handleUpdateApplication(application, status) {
    const updated = await updateApplication(application.id, { ...application, status })
    setApplications((current) => current.map((item) => item.id === updated.id ? updated : item))
  }

  async function handleDeleteApplication(id) {
    await deleteApplication(id)
    setApplications((current) => current.filter((item) => item.id !== id))
  }

  async function handleCopilotAction(actionId, status) {
    try {
      await updateCopilotAction(actionId, status)
      await refreshCopilot()
    } catch (error) {
      setCopilotError(error.message)
    }
  }

  async function handleCopilotPreferences(remindersEnabled) {
    try {
      await updateCopilotPreferences(remindersEnabled)
      await refreshCopilot()
    } catch (error) {
      setCopilotError(error.message)
    }
  }

  async function handleStartCopilotWorkflow(applicationId) {
    await startCopilotWorkflow(applicationId)
    await refreshCopilot()
  }

  async function handleCopilotWorkflowStep(applicationId, stepId, isComplete) {
    try {
      await updateCopilotWorkflowStep(applicationId, stepId, isComplete)
      await refreshCopilot()
    } catch (error) {
      setCopilotError(error.message)
    }
  }

  async function handleCreateCopilotPlanTask(task) {
    const saved = await createCopilotPlanTask(task)
    await refreshCopilot()
    return saved
  }

  async function handleUpdateCopilotPlanTask(taskId, values) {
    const updated = await updateCopilotPlanTask(taskId, values)
    await refreshCopilot()
    return updated
  }

  async function handleDeleteCopilotPlanTask(taskId) {
    await deleteCopilotPlanTask(taskId)
    await refreshCopilot()
  }

  async function handleAskCopilot(question, context = []) {
    setCopilotChatLoading(true)
    setCopilotChatError('')
    try {
      return await askCopilot(question, context)
    } catch (error) {
      setCopilotChatError(error.message)
      return null
    } finally {
      setCopilotChatLoading(false)
    }
  }

  function handleAskMentorAboutJob(jobResult, role) {
    setSelectedRole(role)
    setPage('mentor')
    const prompt = `What should I focus on to become competitive for this ${role} job posting?`
    handleAskMentor(prompt, role)
  }

  async function toggleTask(day) {
    const previous = new Set(completed)
    const next = new Set(completed)
    if (next.has(day)) next.delete(day)
    else next.add(day)
    setCompleted(next)
    try {
      await saveRoadmapProgress(selectedRole, [...next])
      setRoadmapError('')
      try {
        const history = await getRoadmapProgressHistory(selectedRole)
        setRoadmapHistory(history.history || [])
        setRoadmapHistoryError('')
      } catch (historyError) {
        setRoadmapHistoryError(`Could not refresh roadmap activity: ${historyError.message}`)
      }
    } catch (error) {
      setCompleted(previous)
      setRoadmapError(`Could not save roadmap progress: ${error.message}`)
    }
  }

  function handleResetWorkspace() {
    setResume(SAMPLE_RESUME_FILE)
    setResumeResult(SAMPLE_RESUME_RESULT)
    setSkills(DEFAULT_DEMO_SKILLS)
    setIsRealResume(false)
    setRoadmap(null)
    setFocusSkills(null)
    setJobMatch(null)
    setMentorAnswer(null)
    setCompleted(new Set())
    try {
      localStorage.removeItem(`skillbridge-completed-tasks:${selectedRole}`)
    } catch {
      // Ignored
    }
  }

  return (
    <div className="app-shell" ref={appShellRef}>
      {/* Global Interactive Ambient Parallax Backdrops across all routes */}
      <div className="global-spotlight" aria-hidden="true" />
      <div className="global-circuit-layer" aria-hidden="true">
        <svg className="global-circuit-svg" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="none">
          <path className="global-circuit-path p-1" d="M0 120 H300 V350 H600" />
          <path className="global-circuit-path p-2" d="M1440 180 H1100 V400 H850" />
          <path className="global-circuit-path p-3" d="M200 900 V650 H450 V500" />
          <path className="global-circuit-path p-1" d="M1250 900 V700 H950" />
          <circle cx="300" cy="120" r="3" className="global-circuit-dot" />
          <circle cx="600" cy="350" r="4" className="global-circuit-dot active" />
          <circle cx="1100" cy="180" r="3" className="global-circuit-dot" />
          <circle cx="850" cy="400" r="4" className="global-circuit-dot active" />
        </svg>
      </div>
      <Sidebar
        page={page}
        navigate={navigate}
        mobileNav={mobileNav}
        setMobileNav={setMobileNav}
        apiStatus={apiStatus}
        setApiStatus={setApiStatus}
        name={profileName}
        experienceLevel={experienceLevel}
      />

      <main className="main-area" id="main-content">
        <Topbar
          currentPage={currentPage}
          setMobileNav={setMobileNav}
          dark={dark}
          setDark={setDark}
          isRealResume={isRealResume}
          resumeResult={resumeResult}
          name={profileName}
          experienceLevel={experienceLevel}
          setProfileName={setProfileName}
          setExperienceLevel={setExperienceLevel}
        />

        <div className="content">
          {page === 'overview' && (
            <Overview
              navigate={navigate}
              gap={gap}
              roadmap={roadmap}
              skills={skills}
              recommendations={recommendations}
              role={selectedRole}
              setRole={setSelectedRole}
              refreshGap={loadGap}
              completedCount={completed.size}
              completed={completed}
              isRealResume={isRealResume}
              savedMatches={savedMatches}
              savedMatchesLoading={savedMatchesLoading}
              savedMatchesError={savedMatchesError}
              applications={applications}
              applicationsLoading={applicationsLoading}
              applicationsError={applicationsError}
              recommendationsLoading={recommendationLoading}
              recommendationsError={recommendationError}
              interviewSessions={interviewSessions}
              savedProjects={savedProjects}
              portfolioLoading={portfolioLoading}
              interviewLoading={interviewLoading}
              roadmapHistory={roadmapHistory}
              roadmapHistoryError={roadmapHistoryError}
              portfolioError={portfolioError}
              interviewError={interviewError}
              careerIntelligence={careerIntelligence}
              careerIntelligenceLoading={careerIntelligenceLoading}
              careerIntelligenceError={careerIntelligenceError}
            />
          )}

          {page === 'copilot' && (
            <Copilot
              dashboard={copilotDashboard}
              loading={copilotLoading}
              error={copilotError}
              refresh={refreshCopilot}
              updateAction={handleCopilotAction}
              updatePreferences={handleCopilotPreferences}
              startWorkflow={handleStartCopilotWorkflow}
              updateWorkflowStep={handleCopilotWorkflowStep}
              createPlanTask={handleCreateCopilotPlanTask}
              updatePlanTask={handleUpdateCopilotPlanTask}
              deletePlanTask={handleDeleteCopilotPlanTask}
              applications={applications}
              navigate={navigate}
              ask={handleAskCopilot}
              chatLoading={copilotChatLoading}
              chatError={copilotChatError}
            />
          )}

          {page === 'resume' && (
            <ResumeAnalyzer
              resume={resume}
              setResume={handleSelectFile}
              removeResume={() => {
                setResume(null)
                setResumeResult(null)
                setResumeOptimization(null)
                setSkills([])
                setGap(null)
                setRoadmap(null)
                setFocusSkills(null)
                setJobMatch(null)
                setIsRealResume(false)
              }}
              fileInput={fileInput}
              loading={resumeLoading}
              result={resumeResult}
              error={resumeError}
              analyze={() => handleAnalyzeResume()}
              optimizeResume={handleOptimizeResume}
              saveResumeVersion={handleSaveResumeVersion}
              deleteResumeVersion={handleDeleteResumeVersion}
              resumeOptimization={resumeOptimization}
              resumeVersions={resumeVersions}
              resumeVersionsLoading={resumeVersionsLoading}
              resumeVersionsError={resumeVersionsError}
              loadSampleResume={handleLoadSampleResume}
              skills={skills}
              setSkills={setSkills}
              role={selectedRole}
              setRole={setSelectedRole}
              gap={gap}
              gapLoading={gapLoading}
              gapError={gapError}
              refreshGap={loadGap}
              navigate={navigate}
              jobMatchLoading={jobMatchLoading}
              jobMatchError={jobMatchError}
              matchJob={handleMatchJob}
              isRealResume={isRealResume}
            />
          )}

          {page === 'recommendations' && (
            <Recommendations
              navigate={navigate}
              recommendations={recommendations}
              loading={recommendationLoading}
              error={recommendationError}
              setRole={setSelectedRole}
              refreshGap={loadGap}
            />
          )}

          {page === 'gap' && (
            <SkillGapPage
              role={selectedRole}
              setRole={setSelectedRole}
              skills={skills}
              gap={gap}
              loading={gapLoading}
              error={gapError}
              refresh={loadGap}
              roadmap={(prioritizedSkills) => handleBuildRoadmapFromGaps(prioritizedSkills, selectedRole)}
              navigate={navigate}
              resumeSkills={resumeResult?.skills || []}
              verifiedSkills={[]}
              isRealResume={isRealResume}
              jobMatch={jobMatch}
            />
          )}

          {page === 'roadmap' && (
            <RoadmapPage
              roadmap={roadmap}
              loading={roadmapLoading}
              error={roadmapError}
              minutes={dailyMinutes}
              setMinutes={setDailyMinutes}
              generate={() => handleCreateRoadmap()}
              completed={completed}
              toggleTask={toggleTask}
              resetProgress={async () => {
                const previous = new Set(completed)
                setCompleted(new Set())
                try {
                  await saveRoadmapProgress(selectedRole, [])
                  setRoadmapError('')
                  try {
                    const history = await getRoadmapProgressHistory(selectedRole)
                    setRoadmapHistory(history.history || [])
                    setRoadmapHistoryError('')
                  } catch (historyError) {
                    setRoadmapHistoryError(`Could not refresh roadmap activity: ${historyError.message}`)
                  }
                } catch (error) {
                  setCompleted(previous)
                  setRoadmapError(`Could not reset roadmap progress: ${error.message}`)
                }
              }}
              role={selectedRole}
              setRole={(nextRole) => {
                setSelectedRole(nextRole)
                setRoadmap(null)
                setCompleted(new Set())
              }}
              focusSkills={focusSkills}
              clearFocusSkills={() => setFocusSkills(null)}
            />
          )}

          {page === 'portfolio' && (
            <PortfolioProjects
              role={selectedRole}
              setRole={setSelectedRole}
              skills={skills}
              project={portfolioProject}
              loading={portfolioLoading}
              error={portfolioError}
              generate={handleGeneratePortfolioProject}
              saveProject={handleSavePortfolioProject}
              savedProjects={savedProjects}
              updateProject={handleUpdatePortfolioProject}
              focusSkills={gap?.prioritized_gaps?.map((item) => item.skill) || []}
            />
          )}

          {page === 'interview' && (
            <InterviewPrep
              role={selectedRole}
              setRole={setSelectedRole}
              plan={interviewPlan}
              loading={interviewLoading}
              error={interviewError}
              prepare={handlePrepareInterview}
              evaluateAnswer={handleEvaluateInterviewAnswer}
              saveSession={handleSaveInterviewSession}
              sessions={interviewSessions}
              jobMatch={jobMatch}
              focusSkills={gap?.prioritized_gaps?.map((item) => item.skill) || []}
            />
          )}

          {page === 'matcher' && (
            <JobMatcher
              skills={skills}
              role={selectedRole}
              setRole={setSelectedRole}
              result={jobMatch}
              loading={jobMatchLoading}
              error={jobMatchError}
              match={handleMatchJob}
              buildRoadmapFromGaps={handleBuildRoadmapFromGaps}
              askMentorAboutJob={handleAskMentorAboutJob}
              saveMatch={(title, company, description) => saveJobMatch(title, company, description, jobMatch).then((saved) => setSavedMatches((current) => [saved, ...current]))}
              reviewGaps={() => navigate('gap')}
            />
          )}

          {page === 'saved' && <SavedMatches matches={savedMatches} />}

          {page === 'applications' && (
            <Applications
              applications={applications}
              loading={applicationsLoading}
              error={applicationsError}
              create={handleCreateApplication}
              updateStatus={handleUpdateApplication}
              remove={handleDeleteApplication}
            />
          )}

          {page === 'mentor' && (
            <MentorPage
              role={selectedRole}
              setRole={setSelectedRole}
              skills={skills}
              answer={mentorAnswer}
              loading={mentorLoading}
              error={mentorError}
              ask={handleAskMentor}
              coverage={gap?.skill_coverage_percentage}
              navigate={navigate}
            />
          )}

          {page === 'settings' && (
            <Settings
              dark={dark}
              setDark={setDark}
              apiStatus={apiStatus}
              refreshApi={() => {
                setApiStatus('checking')
                checkHealth()
                  .then(() => setApiStatus('online'))
                  .catch(() => setApiStatus('offline'))
              }}
              reset={handleResetWorkspace}
              name={profileName}
              setName={setProfileName}
              role={selectedRole}
              setRole={setSelectedRole}
              experienceLevel={experienceLevel}
              setExperienceLevel={setExperienceLevel}
              dailyMinutes={dailyMinutes}
              setDailyMinutes={setDailyMinutes}
              saveProfile={handleSaveProfile}
              profileSaveState={profileSaveState}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
