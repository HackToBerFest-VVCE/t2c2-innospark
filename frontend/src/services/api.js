const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options)
  } catch {
    throw new Error('The SkillBridge API is unavailable. Start the FastAPI server and try again.')
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.detail || `Request failed with status ${response.status}.`)
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

export { API_BASE_URL }
