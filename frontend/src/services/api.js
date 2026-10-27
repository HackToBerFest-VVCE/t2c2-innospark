const DEFAULT_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'http://127.0.0.1:8000'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_URL

async function fetchWithTimeout(url, options) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15_000)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

function formatErrorDetail(detail) {
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object' && typeof item.msg === 'string') return item.msg
      return JSON.stringify(item)
    })
    return messages.filter(Boolean).join('; ')
  }
  if (detail && typeof detail === 'object') {
    if (typeof detail.message === 'string') return detail.message
    if (typeof detail.error === 'string') return detail.error
    return JSON.stringify(detail)
  }
  return ''
}

async function request(path, options = {}) {
  let response
  try {
    response = await fetchWithTimeout(`${API_BASE_URL}${path}`, options)
  } catch (primaryError) {
    // If the primary address failed, attempt the loopback counterpart
    const fallbackBase = API_BASE_URL.includes('localhost')
      ? API_BASE_URL.replace('localhost', '127.0.0.1')
      : API_BASE_URL.replace('127.0.0.1', 'localhost')
    try {
      response = await fetchWithTimeout(`${fallbackBase}${path}`, options)
    } catch (fallbackError) {
      if (primaryError.name === 'AbortError' || fallbackError.name === 'AbortError') {
        throw new Error('The SkillBridge API request timed out. Try again in a moment.')
      }
      throw new Error('The SkillBridge API is unavailable. Start the FastAPI server and try again.')
    }
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = formatErrorDetail(body.detail)
    throw new Error(detail || `Request failed with status ${response.status}.`)
  }
  return body
}

export function checkHealth() {
  return request('/api/health')
}

export function analyzeResume(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request('/api/resume/analyze', { method: 'POST', body: formData })
}

export async function downloadResumeReport(reportData) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/api/resume/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    })
  } catch {
    const fallbackBase = API_BASE_URL.includes('localhost')
      ? API_BASE_URL.replace('localhost', '127.0.0.1')
      : API_BASE_URL.replace('127.0.0.1', 'localhost')
    response = await fetch(`${fallbackBase}/api/resume/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    })
  }
  if (!response.ok) {
    throw new Error('Failed to generate report PDF.')
  }
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `SkillBridge_Career_Report_${(reportData.target_role || 'Developer').replace(/\s+/g, '_')}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

export function getSkillGap(targetRole, skills) {
  return request('/api/skills/gap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_role: targetRole, skills }),
  })
}

export function generateRoadmap(targetRole, skills, dailyMinutes = 60) {
  return generateFocusedRoadmap(targetRole, skills, dailyMinutes)
}

export function generateFocusedRoadmap(targetRole, skills, dailyMinutes = 60, focusSkills = undefined) {
  return request('/api/roadmap/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target_role: targetRole,
      skills,
      daily_minutes: dailyMinutes,
      ...(focusSkills ? { focus_skills: focusSkills } : {}),
    }),
  })
}

export function getRecommendations(skills) {
  return request('/api/roles/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skills }),
  })
}

export function getCareerIntelligence(payload) {
  return request('/api/intelligence/overview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function generatePortfolioProject(targetRole, skills, options = {}) {
  return request('/api/portfolio/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target_role: targetRole,
      skills,
      focus_skills: options.focusSkills || [],
      job_requirements: options.jobRequirements || [],
      experience_level: options.experienceLevel || 'exploring',
      daily_minutes: options.dailyMinutes || 60,
    }),
  })
}

export function savePortfolioProject(project) {
  return request('/api/portfolio/projects/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  })
}

export function getPortfolioProjects() {
  return request('/api/portfolio/projects')
}

export function updatePortfolioProject(id, values) {
  return request(`/api/portfolio/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
}

export function prepareInterview(targetRole, skills, options = {}) {
  return request('/api/interview/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target_role: targetRole,
      skills,
      question_count: options.questionCount || 6,
      difficulty: options.difficulty || 'Intermediate',
      focus_skills: options.focusSkills || [],
      job_requirements: options.jobRequirements || [],
    }),
  })
}

export function evaluateInterviewAnswer(question, answer, evaluationCriteria = []) {
  return request('/api/interview/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, answer, evaluation_criteria: evaluationCriteria }),
  })
}

export function saveInterviewSession(session) {
  return request('/api/interview/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  })
}

export function getInterviewSessions() {
  return request('/api/interview/sessions')
}

export function optimizeResume(payload) {
  return request('/api/resume/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function getResumeVersions(targetRole = '') {
  const query = targetRole ? `?target_role=${encodeURIComponent(targetRole)}` : ''
  return request(`/api/resume/versions${query}`)
}

export function saveResumeVersion(version) {
  return request('/api/resume/versions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(version),
  })
}

export function deleteResumeVersion(id) {
  return request(`/api/resume/versions/${id}`, { method: 'DELETE' })
}

export function getCopilotDashboard() {
  return request('/api/copilot/dashboard')
}

export function updateCopilotAction(id, status) {
  return request(`/api/copilot/actions/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
}

export function updateCopilotPreferences(remindersEnabled) {
  return request('/api/copilot/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reminders_enabled: remindersEnabled }),
  })
}

export function startCopilotWorkflow(applicationId) {
  return request(`/api/copilot/workflows/${applicationId}`, { method: 'POST' })
}

export function updateCopilotWorkflowStep(applicationId, stepId, completed) {
  return request(`/api/copilot/workflows/${applicationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step_id: stepId, completed }),
  })
}

export function createCopilotPlanTask(task) {
  return request('/api/copilot/plan-tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  })
}

export function updateCopilotPlanTask(taskId, values) {
  return request(`/api/copilot/plan-tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
}

export function deleteCopilotPlanTask(taskId) {
  return request(`/api/copilot/plan-tasks/${taskId}`, { method: 'DELETE' })
}

export function askCopilot(question, context = []) {
  return request('/api/copilot/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, context }),
  })
}

export function getApplications(status = '') {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return request(`/api/applications${query}`)
}

export function createApplication(application) {
  return request('/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(application),
  })
}

export function updateApplication(id, application) {
  return request(`/api/applications/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(application),
  })
}

export function deleteApplication(id) {
  return request(`/api/applications/${id}`, { method: 'DELETE' })
}

export function matchJobDescription(jobDescription, skills, targetRole = undefined) {
  return request('/api/jobs/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_description: jobDescription,
      skills,
      ...(targetRole ? { target_role: targetRole } : {}),
    }),
  })
}

export function askMentor(question, targetRole, skills) {
  return request('/api/mentor/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, target_role: targetRole, skills }),
  })
}

export function getProfile() {
  return request('/api/profile')
}

export function updateProfile(profile) {
  return request('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
}

export function getRoadmapProgress(targetRole) {
  return request(`/api/roadmap/progress/${encodeURIComponent(targetRole)}`)
}

export function getRoadmapProgressHistory(targetRole) {
  return request(`/api/roadmap/progress/${encodeURIComponent(targetRole)}/history`)
}

export function saveRoadmapProgress(targetRole, completedDays) {
  return request('/api/roadmap/progress', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_role: targetRole, completed_days: completedDays }),
  })
}

export function saveJobMatch(title, company, description, result) {
  return request('/api/jobs/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, company, description, result }),
  })
}

export function getSavedJobMatches() {
  return request('/api/jobs/matches')
}

export { API_BASE_URL }
