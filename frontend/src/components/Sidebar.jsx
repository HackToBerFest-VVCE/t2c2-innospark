import { Icon } from './common/Icons'
import { NAVIGATION_ITEMS } from '../constants/navigation'

export function Sidebar({ page, navigate, mobileNav, setMobileNav }) {
  return (
    <>
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`} aria-label="Main Navigation">
        <div className="brand">
          <img
            className="brand-logo-image"
            src="/skillbridge-logo.png"
            alt="SkillBridge AI — AI powered personalized career guidance"
          />
          <button
            type="button"
            className="icon-button mobile-close"
            onClick={() => setMobileNav(false)}
            aria-label="Close navigation menu"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="nav-list" aria-label="Sections">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive = page === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.id)
                  if (mobileNav) setMobileNav(false)
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon name={item.icon} size={18} />
                <span className="nav-label">{item.label}</span>
                {item.badge && <em className={`nav-badge badge-${item.badge.toLowerCase()}`}>{item.badge}</em>}
              </button>
            )
          })}
        </nav>

        {/* AI Career Assistant Sidebar Card */}
        <div className="ai-assistant-card">
          <div className="assistant-card-header">
            <div className="assistant-icon-badge">
              <Icon name="sparkle" size={16} />
            </div>
            <strong>AI Career Assistant</strong>
          </div>
          <p>Get personalized guidance for your career journey.</p>
          <button
            type="button"
            className="ask-ai-button"
            onClick={() => {
              navigate('mentor')
              if (mobileNav) setMobileNav(false)
            }}
          >
            <Icon name="sparkle" size={14} />
            <span>Ask AI</span>
            <span className="arrow-ne">↗</span>
          </button>
        </div>

        <div className="sidebar-bottom">
          <button
            type="button"
            className={`nav-item ${page === 'settings' ? 'active' : ''}`}
            onClick={() => {
              navigate('settings')
              if (mobileNav) setMobileNav(false)
            }}
            aria-current={page === 'settings' ? 'page' : undefined}
          >
            <Icon name="settings" size={18} />
            <span className="nav-label">Settings</span>
          </button>

          <button
            type="button"
            className="nav-item help-support-item"
            onClick={() => {
              navigate('mentor')
              if (mobileNav) setMobileNav(false)
            }}
          >
            <Icon name="help-circle" size={18} />
            <span className="nav-label">Help & Support</span>
          </button>
        </div>
      </aside>

      {mobileNav && (
        <button
          type="button"
          className="mobile-overlay"
          onClick={() => setMobileNav(false)}
          aria-label="Close menu overlay"
        />
      )}
    </>
  )
}
