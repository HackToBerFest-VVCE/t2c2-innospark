import { useState } from 'react'
import { Icon, PageIntro } from './common/Icons'
import { API_BASE_URL } from '../services/api'
import { CATALOG_ROLES } from '../constants/roles'

export function Settings({
  dark,
  setDark,
  apiStatus,
  refreshApi,
  reset,
  name,
  setName,
  role,
  setRole,
  experienceLevel,
  setExperienceLevel,
  dailyMinutes,
  setDailyMinutes,
  saveProfile,
  profileSaveState,
}) {
  const [profileMessage, setProfileMessage] = useState('')

  async function handleSaveProfile(event) {
    event.preventDefault()
    setProfileMessage('')
    try {
      await saveProfile()
      setProfileMessage('Profile preferences saved.')
    } catch {
      setProfileMessage('Profile could not be saved. Check the API connection and try again.')
    }
  }

  return (
    <>
      <PageIntro
        eyebrow="PREFERENCES & PRIVACY CONTROLS"
        title="Workspace Configuration"
        description="Manage workspace theme, inspect API connection diagnostics, and control your local demonstration data."
      />

      <div className="settings-grid">
        <form className="card settings-card profile-settings-card" onSubmit={handleSaveProfile}>
          <span className="eyebrow">PERSONALIZED PROFILE</span>
          <h2>Make the workspace yours</h2>
          <p>These preferences shape your role analysis, roadmap, and coaching context.</p>
          <div className="profile-form-grid">
            <label>
              Display name
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" maxLength={80} />
            </label>
            <label>
              Experience level
              <select value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value)}>
                <option value="exploring">Exploring</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <label>
              Target role
              <select value={role} onChange={(event) => setRole(event.target.value)}>
                {CATALOG_ROLES.map((catalogRole) => <option key={catalogRole}>{catalogRole}</option>)}
              </select>
            </label>
            <label>
              Daily learning time
              <select value={dailyMinutes} onChange={(event) => setDailyMinutes(Number(event.target.value))}>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
                <option value={240}>240 minutes</option>
              </select>
            </label>
          </div>
          <div className="settings-form-footer">
            <span className={`save-feedback ${profileSaveState}`}>{profileMessage || (profileSaveState === 'saving' ? 'Saving...' : '')}</span>
            <button type="submit" className="button primary" disabled={profileSaveState === 'saving'}>
              <Icon name="check" size={15} /> Save profile
            </button>
          </div>
        </form>

        <section className="card settings-card" aria-label="System Preferences">
          <div className="settings-row">
            <div className="settings-icon" aria-hidden="true">
              <Icon name={dark ? 'moon' : 'sun'} />
            </div>
            <div>
              <strong>Color Theme</strong>
              <span>
                {dark ? 'Dark mode active (high contrast)' : 'Light mode active'}
              </span>
            </div>
            <button
              type="button"
              className="switch"
              aria-label="Toggle dark/light theme"
              aria-pressed={dark}
              onClick={() => setDark(!dark)}
            >
              <span className={dark ? 'on' : ''}></span>
            </button>
          </div>

          <div className="settings-row">
            <div className="settings-icon" aria-hidden="true">
              <Icon name="refresh" />
            </div>
            <div>
              <strong>API Connection</strong>
              <span>Endpoint: {API_BASE_URL}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`connection-label ${apiStatus}`}>
                <i aria-hidden="true"></i> {apiStatus}
              </span>
              <button
                type="button"
                className="icon-button"
                onClick={refreshApi}
                aria-label="Test API connection"
                title="Test API connection"
              >
                <Icon name="refresh" size={14} />
              </button>
            </div>
          </div>
        </section>

        <section className="card settings-card" aria-label="Data Privacy & Reset">
          <span className="eyebrow">DEMO CONTROLS</span>
          <h2>Reset Workspace</h2>
          <p>
            Clears your uploaded resume analysis, generated roadmap, and completed daily task progress. Resume files are never retained in browser storage or on backend disks.
          </p>
          <button
            type="button"
            className="button secondary"
            onClick={reset}
          >
            <Icon name="refresh" size={15} /> Reset Demo Workspace
          </button>
        </section>

        <section className="card settings-card full-span" style={{ gridColumn: '1 / -1' }} aria-label="Ethics and Standards">
          <span className="eyebrow">STANDARDS & ETHICS</span>
          <h2>Deterministic Guidance & Privacy Architecture</h2>
          <p>
            SkillBridge AI is designed with responsible, transparent AI principles:
          </p>
          <ul style={{ color: 'var(--muted)', fontSize: '11px', lineHeight: '1.7', paddingLeft: '20px' }}>
            <li>
              <b>Zero Permanent Storage:</b> Resume PDFs and extracted text are processed purely in-memory in RAM by PyMuPDF and immediately garbage-collected. No personally identifiable information (PII) is stored on server disks.
            </li>
            <li>
              <b>Explainable Scoring:</b> Role matches use transparent, audited weights (80% core required skills, 20% optional bonus technologies) rather than black-box scoring.
            </li>
            <li>
              <b>No False Employment Guarantees:</b> SkillBridge scores reflect curriculum and skill syllabus coverage. They are not hiring probabilities or employment guarantees.
            </li>
          </ul>
        </section>
      </div>
    </>
  )
}
