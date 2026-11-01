export function TceFooter({ navigate }) {
  return (
    <footer className="tce-footer" role="contentinfo" aria-label="SkillBridge AI Footer">
      <div className="tce-footer-container">
        {/* Top Branding Strip */}
        <div className="tce-footer-brand-strip">
          <div className="tce-footer-brand-wrap">
            <div className="tce-brand-badge-icon">
              <span className="tce-brand-symbol">SB</span>
            </div>
            <div className="tce-footer-brand-text">
              <span className="tce-footer-title">SkillBridge <strong>AI</strong></span>
              <span className="tce-footer-sub">PERSONALIZED CAREER AGENT • INNOSPARK 2026</span>
            </div>
          </div>

          <div className="tce-footer-actions">
            <button
              type="button"
              className="tce-btn-accent"
              onClick={() => navigate?.('resume')}
            >
              Analyze Your Resume Now →
            </button>
          </div>
        </div>

        {/* 4 Multi-column Layout (matches TCE footer-wrp) */}
        <div className="tce-footer-grid">
          {/* Column 1: About Platform */}
          <div className="tce-footer-col">
            <h4 className="tce-footer-heading">ABOUT SKILLBRIDGE AI</h4>
            <p className="tce-footer-lead">
              SkillBridge AI transforms resume experience into transparent role recommendations, prioritized skill gaps, 30-day learning curricula, and profile-grounded career mentoring with zero-disk privacy.
            </p>
            <div className="tce-footer-stats-tag">
              <span className="tce-stat-bullet">•</span> Built with TCE Design Architecture
            </div>
          </div>

          {/* Column 2: Career Intelligence Tools */}
          <div className="tce-footer-col">
            <h4 className="tce-footer-heading">CAREER INTELLIGENCE</h4>
            <ul className="tce-footer-list">
              <li>
                <button type="button" onClick={() => navigate?.('resume')} className="tce-footer-link">
                  Resume Analyzer (PDF & Text)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate?.('recommendations')} className="tce-footer-link">
                  Role Recommendation Engine
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate?.('gap')} className="tce-footer-link">
                  Skill Gap Breakdown & Coverage
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate?.('roadmap')} className="tce-footer-link">
                  Interactive 30-Day Learning Curriculum
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate?.('matcher')} className="tce-footer-link">
                  Real-World Job Description Matcher
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Copilot & Mentoring */}
          <div className="tce-footer-col">
            <h4 className="tce-footer-heading">AGENTIC COPILOT & ADVICE</h4>
            <ul className="tce-footer-list">
              <li>
                <button type="button" onClick={() => navigate?.('copilot')} className="tce-footer-link">
                  Autonomous Career Copilot
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate?.('mentor')} className="tce-footer-link">
                  Profile-Grounded AI Mentor
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate?.('interview')} className="tce-footer-link">
                  Interactive Interview Simulator
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate?.('portfolio')} className="tce-footer-link">
                  Tailored Portfolio Projects
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate?.('applications')} className="tce-footer-link">
                  Application Lifecycle Tracker
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Architecture & Trust */}
          <div className="tce-footer-col">
            <h4 className="tce-footer-heading">ENGINEERING ARCHITECTURE</h4>
            <div className="tce-footer-tech-specs">
              <div className="tce-spec-row">
                <span className="tce-spec-label">Backend Engine:</span>
                <span className="tce-spec-val">FastAPI & Python 3.12</span>
              </div>
              <div className="tce-spec-row">
                <span className="tce-spec-label">Privacy Model:</span>
                <span className="tce-spec-val">In-Memory Zero-Disk Storage</span>
              </div>
              <div className="tce-spec-row">
                <span className="tce-spec-label">Test Coverage:</span>
                <span className="tce-spec-val">77 Comprehensive Pytest Specs</span>
              </div>
              <div className="tce-spec-row">
                <span className="tce-spec-label">UI/UX Pattern:</span>
                <span className="tce-spec-val">Tata Consulting Engineers (TCE)</span>
              </div>
            </div>
            <div className="tce-footer-career-cta">
              <button
                type="button"
                className="tce-footer-btn"
                onClick={() => navigate?.('mentor')}
              >
                Ask AI Career Mentor ↗
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Legal */}
        <div className="tce-footer-bottom">
          <div className="tce-copyright-text">
            © 2026 SkillBridge AI • InnoSpark Hackathon Project. All Rights Reserved.
          </div>
          <div className="tce-footer-legal-links">
            <button type="button" onClick={() => navigate?.('overview')} className="tce-legal-btn">
              Dashboard
            </button>
            <span className="tce-sep">•</span>
            <button type="button" onClick={() => navigate?.('settings')} className="tce-legal-btn">
              Settings
            </button>
            <span className="tce-sep">•</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="tce-legal-btn"
            >
              GitHub Source
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
