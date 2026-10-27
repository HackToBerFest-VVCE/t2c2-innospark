import { useState, useRef, useEffect } from 'react'
import { Icon } from './common/Icons'

export function Topbar({
  setMobileNav,
  dark,
  setDark,
  name = 'Rohit Sharma',
  experienceLevel = 'Aspiring Developer',
  setProfileName,
  setExperienceLevel,
}) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(3)
  const profileMenuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelectProfile(newName, newRole) {
    if (setProfileName) setProfileName(newName)
    if (setExperienceLevel) setExperienceLevel(newRole)
    setIsProfileMenuOpen(false)
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="menu-button icon-button"
          onClick={() => setMobileNav(true)}
          aria-label="Open navigation menu"
        >
          <Icon name="menu" />
        </button>

        <div className="search-container">
          <Icon name="search" size={16} className="search-icon" />
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search features, skills, or anything..."
            aria-label="Search features, skills, or anything"
          />
          <span className="search-shortcut">Ctrl + K</span>
        </div>
      </div>

      <div className="top-actions">
        {/* Sun & Moon Theme Toggle Capsule */}
        <div
          className="theme-capsule-toggle"
          onClick={() => setDark(!dark)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setDark(!dark)}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className={`theme-capsule-icon ${!dark ? 'active' : ''}`}>
            <Icon name="sun" size={15} />
          </span>
          <span className={`theme-capsule-icon ${dark ? 'active' : ''}`}>
            <Icon name="moon" size={15} />
          </span>
        </div>

        {/* Notification Bell with Red Badge '3' */}
        <button
          type="button"
          className="topbar-icon-button notification-btn"
          aria-label={`Notifications (${notificationCount} unread)`}
          onClick={() => setNotificationCount(0)}
          title="Click to mark notifications as read"
        >
          <Icon name="bell" size={18} />
          {notificationCount > 0 && <span className="notification-badge">{notificationCount}</span>}
        </button>

        {/* User Profile Capsule with Interactive Options Menu */}
        <div className="profile-menu-container" ref={profileMenuRef}>
          <div
            className="user-profile-capsule"
            tabIndex={0}
            role="button"
            aria-label="User profile options menu"
            aria-expanded={isProfileMenuOpen}
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            onKeyDown={(e) => e.key === 'Enter' && setIsProfileMenuOpen((prev) => !prev)}
          >
            <div className="user-avatar-wrapper">
              <div className="user-avatar-img">
                {/* Profile avatar graphic */}
                <svg viewBox="0 0 36 36" width="32" height="32" fill="none">
                  <circle cx="18" cy="18" r="18" fill="#1e293b" />
                  <circle cx="18" cy="14" r="6" fill="#38bdf8" />
                  <path d="M7 32c0-6.075 4.925-11 11-11s11 4.925 11 11" fill="#0284c7" />
                </svg>
              </div>
            </div>
            <div className="user-info">
              <span className="user-name">{name || 'Rohit Sharma'}</span>
              <span className="user-role">{experienceLevel || 'Aspiring Developer'}</span>
            </div>
            <Icon
              name="chevron-down"
              size={14}
              className={`user-chevron ${isProfileMenuOpen ? 'open' : ''}`}
            />
          </div>

          {/* User Profile Options Menu */}
          {isProfileMenuOpen && (
            <div className="user-profile-options-menu">
              <div className="profile-menu-header">SWITCH CANDIDATE PROFILE</div>
              <button
                type="button"
                className={`profile-option-row ${name === 'Rohit Sharma' ? 'active' : ''}`}
                onClick={() => handleSelectProfile('Rohit Sharma', 'Aspiring Developer')}
              >
                <div className="profile-opt-avatar">RS</div>
                <div className="profile-opt-text">
                  <strong>Rohit Sharma</strong>
                  <span>Aspiring Developer</span>
                </div>
                {name === 'Rohit Sharma' && <Icon name="check" size={14} className="profile-opt-check" />}
              </button>

              <button
                type="button"
                className={`profile-option-row ${name === 'Bindhu Shree KR' ? 'active' : ''}`}
                onClick={() => handleSelectProfile('Bindhu Shree KR', 'Software Engineer')}
              >
                <div className="profile-opt-avatar">BK</div>
                <div className="profile-opt-text">
                  <strong>Bindhu Shree KR</strong>
                  <span>Software Engineer</span>
                </div>
                {name === 'Bindhu Shree KR' && <Icon name="check" size={14} className="profile-opt-check" />}
              </button>

              <button
                type="button"
                className={`profile-option-row ${name === 'Jordan' ? 'active' : ''}`}
                onClick={() => handleSelectProfile('Jordan', 'beginner')}
              >
                <div className="profile-opt-avatar">JS</div>
                <div className="profile-opt-text">
                  <strong>Jordan</strong>
                  <span>beginner</span>
                </div>
                {name === 'Jordan' && <Icon name="check" size={14} className="profile-opt-check" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
