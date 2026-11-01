import { useState, useRef, useEffect } from 'react'
import { Icon } from './common/Icons'
import { NAVIGATION_ITEMS } from '../constants/navigation'

export function TceNavbar({
  page,
  navigate,
  dark,
  setDark,
  name = 'Rohit Sharma',
  experienceLevel = 'Aspiring Developer',
  setProfileName,
  setExperienceLevel,
  mobileNav,
  setMobileNav,
}) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(3)
  const profileMenuRef = useRef(null)
  const moreMenuRef = useRef(null)

  // Primary nav items shown directly in horizontal bar
  const primaryNavIds = ['overview', 'resume', 'recommendations', 'gap', 'roadmap', 'copilot', 'matcher']
  const primaryItems = NAVIGATION_ITEMS.filter((item) => primaryNavIds.includes(item.id))
  const secondaryItems = NAVIGATION_ITEMS.filter((item) => !primaryNavIds.includes(item.id))

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false)
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

  const isSecondaryActive = secondaryItems.some((item) => item.id === page)

  return (
    <header className="tce-global-header" role="banner">
      {/* Top Utility Header Strip (matches TCE headerTop) */}
      <div className="tce-header-top">
        <div className="tce-container-1440">
          <div className="tce-header-top-inner">
            <div className="tce-header-top-left">
              <span className="tce-top-tag">INNOSPARK 2026</span>
              <span className="tce-top-sep">|</span>
              <span className="tce-top-tagline">SkillBridge AI — Autonomous Career & Skills Intelligence</span>
            </div>

            <div className="tce-header-top-right">
              <button
                type="button"
                className="tce-top-text-link"
                onClick={() => navigate('mentor')}
              >
                AI Career Mentor
              </button>
              <span className="tce-top-sep">|</span>
              <button
                type="button"
                className="tce-top-text-link"
                onClick={() => navigate('roadmap')}
              >
                30-Day Curriculum
              </button>
              <span className="tce-top-sep">|</span>
              <button
                type="button"
                className="tce-top-text-link"
                onClick={() => navigate('settings')}
              >
                Settings
              </button>

              <div className="tce-top-socials">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="tce-social-btn"
                  title="GitHub Repository"
                  aria-label="GitHub Repository"
                >
                  <Icon name="external" size={11} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Corporate Navbar (matches TCE navbar) */}
      <nav className="tce-main-navbar" aria-label="Main Navigation">
        <div className="tce-container-1440 tce-navbar-inner">
          {/* Brand Logo */}
          <div className="tce-nav-brand-wrap" onClick={() => navigate('overview')} role="button" tabIndex={0}>
            <div className="tce-brand-badge-icon">
              <span className="tce-brand-symbol">SB</span>
            </div>
            <div className="tce-brand-text">
              <div className="tce-brand-title">
                SkillBridge <span className="tce-brand-accent">AI</span>
              </div>
              <div className="tce-brand-sub">CAREER INTELLIGENCE PLATFORM</div>
            </div>
          </div>

          {/* Center Navigation Links (TCE Horizontal Menu Style) */}
          <ul className="tce-nav-menu">
            {primaryItems.map((item) => {
              const isActive = page === item.id
              return (
                <li key={item.id} className="tce-nav-item">
                  <button
                    type="button"
                    className={`tce-nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => navigate(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span>{item.label}</span>
                    {item.badge && <span className={`tce-nav-pill pill-${item.badge.toLowerCase()}`}>{item.badge}</span>}
                  </button>
                </li>
              )
            })}

            {/* More Tools Dropdown */}
            <li className="tce-nav-item tce-dropdown-wrap" ref={moreMenuRef}>
              <button
                type="button"
                className={`tce-nav-link tce-dropdown-toggle ${isSecondaryActive ? 'active' : ''}`}
                onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                aria-expanded={isMoreMenuOpen}
              >
                <span>More Tools</span>
                <Icon name="arrow" size={12} className={`tce-chevron ${isMoreMenuOpen ? 'open' : ''}`} />
              </button>

              {isMoreMenuOpen && (
                <div className="tce-megamenu-dropdown">
                  {secondaryItems.map((item) => {
                    const isActive = page === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`tce-megamenu-item ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          navigate(item.id)
                          setIsMoreMenuOpen(false)
                        }}
                      >
                        <Icon name={item.icon} size={16} />
                        <span className="tce-dropdown-label">{item.label}</span>
                        {item.badge && <span className="tce-nav-pill">{item.badge}</span>}
                      </button>
                    )
                  })}
                  <div className="tce-dropdown-divider" />
                  <button
                    type="button"
                    className="tce-megamenu-item"
                    onClick={() => {
                      navigate('settings')
                      setIsMoreMenuOpen(false)
                    }}
                  >
                    <Icon name="settings" size={16} />
                    <span className="tce-dropdown-label">Settings & Profile</span>
                  </button>
                </div>
              )}
            </li>
          </ul>

          {/* Right Controls: Search, Theme Toggle, Notifications, Profile */}
          <div className="tce-nav-actions">
            {/* Quick Search */}
            <div className="tce-nav-search-box">
              <Icon name="search" size={15} className="tce-search-icon" />
              <input
                type="text"
                placeholder="Search skills, roles, jobs..."
                className="tce-search-field"
                aria-label="Search skills, roles, or jobs"
              />
              <span className="tce-search-kbd">Ctrl+K</span>
            </div>

            {/* Sun/Moon Theme Toggle */}
            <div
              className="theme-capsule-toggle"
              onClick={() => setDark(!dark)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setDark(!dark)}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span className={`theme-capsule-icon ${!dark ? 'active' : ''}`}>
                <Icon name="sun" size={15} />
              </span>
              <span className={`theme-capsule-icon ${dark ? 'active' : ''}`}>
                <Icon name="moon" size={15} />
              </span>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="topbar-icon-button notification-btn"
              aria-label={`Notifications (${notificationCount} unread)`}
              onClick={() => setNotificationCount(0)}
              title="Notifications"
            >
              <Icon name="bell" size={18} />
              {notificationCount > 0 && <span className="notification-badge">{notificationCount}</span>}
            </button>

            {/* Profile Dropdown Capsule */}
            <div className="profile-menu-container" ref={profileMenuRef}>
              <div
                className="user-profile-capsule tce-profile-capsule"
                tabIndex={0}
                role="button"
                aria-label="User profile options menu"
                aria-expanded={isProfileMenuOpen}
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                onKeyDown={(e) => e.key === 'Enter' && setIsProfileMenuOpen((prev) => !prev)}
              >
                <div className="user-avatar-wrapper">
                  <div className="user-avatar-img tce-avatar">
                    <svg viewBox="0 0 36 36" width="30" height="30" fill="none">
                      <circle cx="18" cy="18" r="18" fill="#072146" />
                      <circle cx="18" cy="14" r="6" fill="#0080C6" />
                      <path d="M7 32c0-6.075 4.925-11 11-11s11 4.925 11 11" fill="#F89420" />
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

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="tce-mobile-nav-toggle"
              onClick={() => setMobileNav(!mobileNav)}
              aria-label="Toggle navigation drawer"
            >
              <Icon name={mobileNav ? 'close' : 'menu'} size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu for Small Screens */}
        {mobileNav && (
          <div className="tce-mobile-dropdown-menu">
            <div className="tce-container-1440">
              <div className="tce-mobile-nav-grid">
                {NAVIGATION_ITEMS.map((item) => {
                  const isActive = page === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`tce-mobile-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        navigate(item.id)
                        setMobileNav(false)
                      }}
                    >
                      <Icon name={item.icon} size={16} />
                      <span>{item.label}</span>
                      {item.badge && <span className="tce-nav-pill">{item.badge}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
