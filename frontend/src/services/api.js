const DEFAULT_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'http://127.0.0.1:8000'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_URL

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
    response = await fetch(`${API_BASE_URL}${path}`, options)
  } catch {
    // If the primary address failed, attempt the loopback counterpart
    const fallbackBase = API_BASE_URL.includes('localhost')
      ? API_BASE_URL.replace('localhost', '127.0.0.1')
      : API_BASE_URL.replace('127.0.0.1', 'localhost')
    try {
      response = await fetch(`${fallbackBase}${path}`, options)
    } catch {
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

export function generatePortfolioProject(targetRole, skills) {
  return request('/api/portfolio/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_role: targetRole, skills }),
  })
}

export function prepareInterview(targetRole, skills) {
  return request('/api/interview/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_role: targetRole, skills }),
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
