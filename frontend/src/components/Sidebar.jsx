import { Icon } from './common/Icons'
import { NAVIGATION_ITEMS } from '../constants/navigation'

export function Sidebar({ page, navigate, mobileNav, setMobileNav, dark = true }) {
  return (
    <>
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`} aria-label="Main Navigation">
        <div className="brand tce-sidebar-brand">
          <div className="tce-sidebar-brand-content">
            <img
              className="brand-logo-image tce-brand-logo"
              src={dark ? '/tataconsultingengineers-white.png' : '/tataconsultingengineers-blue.png'}
              alt="Tata Consulting Engineers"
            />
            <div className="tce-brand-submark-row">
              <span className="tce-brand-tagline">A TATA Enterprise</span>
              <img
                src={dark ? '/tata-logo.png' : '/tata-logo-blue.png'}
                alt="Tata"
                className="tce-brand-tata-mark"
              />
            </div>
          </div>
          <button
            type="button"
            className="icon-button mobile-close"
            onClick={() => setMobileNav(false)}
            aria-label="Close navigation menu"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="workspace-label">ENGINEERING PLATFORM</div>

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

        {/* TCE Engineering & Career Advisor Sidebar Card */}
        <div className="ai-assistant-card tce-assistant-card">
          <div className="assistant-card-header">
            <div className="assistant-icon-badge tce-badge-glow">
              <Icon name="sparkle" size={16} />
            </div>
            <strong>TCE Engineering Advisor</strong>
          </div>
          <p>Get career guidance aligned with Tata Consulting Engineers benchmarks.</p>
          <button
            type="button"
            className="ask-ai-button tce-ask-ai-btn"
            onClick={() => {
              navigate('mentor')
              if (mobileNav) setMobileNav(false)
            }}
          >
            <Icon name="sparkle" size={14} />
            <span>Consult Advisor</span>
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
            <span className="nav-label">Settings & Profile</span>
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
            <span className="nav-label">TCE Help & Support</span>
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
