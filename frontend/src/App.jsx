import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  analyzeResume,
  askMentor,
  checkHealth,
  generateFocusedRoadmap,
  getProfile,
  getRoadmapProgress,
  getRecommendations,
  getSavedJobMatches,
  getSkillGap,
  matchJobDescription,
  saveJobMatch,
  saveRoadmapProgress,
  updateProfile,
  generatePortfolioProject,
  prepareInterview,
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
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

import { SAMPLE_RESUME_FILE, SAMPLE_RESUME_RESULT } from './constants/sampleResume'

const DEFAULT_DEMO_SKILLS = SAMPLE_RESUME_RESULT.skills

function App() {
  const [page, setPage] = useState('resume')
  const [dark, setDark] = useState(() => localStorage.getItem('skillbridge-theme') !== 'light')
  const [mobileNav, setMobileNav] = useState(false)
  const [apiStatus, setApiStatus] = useState('checking')
  const [profileName, setProfileName] = useState('Rohit Sharma')
  const [experienceLevel, setExperienceLevel] = useState('Aspiring Developer')
  const [profileSaveState, setProfileSaveState] = useState('idle')

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
      const saved = localStorage.getItem('skillbridge-completed-tasks')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })

  // Role recommendations
  const [recommendations, setRecommendations] = useState([])
  const [recommendationLoading, setRecommendationLoading] = useState(true)
  const [recommendationError, setRecommendationError] = useState('')

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

  // Portfolio project state
  const [portfolioProject, setPortfolioProject] = useState(null)
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioError, setPortfolioError] = useState('')

  // Interview preparation state
  const [interviewPlan, setInterviewPlan] = useState(null)
  const [interviewLoading, setInterviewLoading] = useState(false)
  const [interviewError, setInterviewError] = useState('')

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
      localStorage.setItem('skillbridge-completed-tasks', JSON.stringify([...completed]))
    } catch {
      // Storage error gracefully caught
    }
  }, [completed])

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
    setMobileNav(false)
    if (id === 'gap') loadGap(selectedRole)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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

  async function handleCreateRoadmap(customFocusSkills = null) {
    setRoadmapLoading(true)
    setRoadmapError('')
    const activeFocus = customFocusSkills !== null ? customFocusSkills : focusSkills
    try {
      const generated = await generateFocusedRoadmap(
        selectedRole,
        skills,
        dailyMinutes,
        activeFocus || undefined
      )
      setRoadmap(generated)
      const progress = await getRoadmapProgress(selectedRole)
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
    handleCreateRoadmap(suggestedSkills)
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
      setPortfolioProject(await generatePortfolioProject(selectedRole, skills))
    } catch (error) {
      setPortfolioError(error.message)
    } finally {
      setPortfolioLoading(false)
    }
  }

  async function handlePrepareInterview() {
    setInterviewLoading(true)
    setInterviewError('')
    try {
      setInterviewPlan(await prepareInterview(selectedRole, skills))
    } catch (error) {
      setInterviewError(error.message)
    } finally {
      setInterviewLoading(false)
    }
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

  function handleAskMentorAboutJob(jobResult, role) {
    setSelectedRole(role)
    setPage('mentor')
    const prompt = `What should I focus on to become competitive for this ${role} job posting?`
    handleAskMentor(prompt, role)
  }

  function toggleTask(day) {
    const next = new Set(completed)
    if (next.has(day)) next.delete(day)
    else next.add(day)
    setCompleted(() => {
      return next
    })
    saveRoadmapProgress(selectedRole, [...next]).catch(() => {})
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
      localStorage.removeItem('skillbridge-completed-tasks')
    } catch {
      // Ignored
    }
  }

  return (
    <div className="app-shell">
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
            />
          )}

          {page === 'resume' && (
            <ResumeAnalyzer
              resume={resume}
              setResume={handleSelectFile}
              removeResume={() => {
                setResume(null)
                setResumeResult(null)
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
              jobMatch={jobMatch}
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
              roadmap={() => handleCreateRoadmap()}
              navigate={navigate}
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
              resetProgress={() => {
                setCompleted(new Set())
                saveRoadmapProgress(selectedRole, []).catch(() => {})
              }}
              role={selectedRole}
              setRole={setSelectedRole}
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
              saveMatch={(title, description) => saveJobMatch(title, '', description, jobMatch).then((saved) => setSavedMatches((current) => [saved, ...current]))}
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
