import { Icon, Loading, PageIntro } from './common/Icons'
import { CATALOG_ROLES } from '../constants/roles'

export function SkillGapPage({
  role,
  setRole,
  skills,
  gap,
  loading,
  error,
  refresh,
  roadmap,
  navigate,
}) {
  const coverage = gap ? Math.round(gap.skill_coverage_percentage) : 0
  const missingCount = gap?.missing_required_skills?.length || 0
  const matchedCount = gap?.matched_required_skills?.length || 0
  const optionalCount = gap?.matched_optional_skills?.length || 0

  return (
    <>
      <PageIntro
        eyebrow="TARGET ROLE SKILL GAP ANALYSIS"
        title="Map Your Gaps to Clear Milestones"
        description="Transparently compare your resume evidence and confirmed skills against standard industry requirements. Know exactly what skills to master and what optional technologies give you an edge."
        action={
          <div className="page-intro-actions">
            <button
              type="button"
              className="button primary"
              onClick={roadmap}
              disabled={!gap || loading}
            >
              <Icon name="map" size={16} /> Build 30-Day Learning Plan
              <Icon name="arrow" size={15} />
            </button>
          </div>
        }
      />

      <div className="toolbar">
        <label htmlFor="skillgap-role-select">
          Target Role
          <select
            id="skillgap-role-select"
            value={role}
            onChange={(e) => {
              setRole(e.target.value)
              refresh(e.target.value)
            }}
          >
            {CATALOG_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <span className="data-source">
          <i aria-hidden="true"></i> Deterministic Industry Catalog
        </span>
      </div>

      {error && (
        <div className="inline-error" role="alert">
          <Icon name="close" size={13} /> {error}
        </div>
      )}

      {loading || !gap ? (
        <Loading text={error ? 'Select a role or retry analysis.' : `Calculating skill gap for ${role}...`} />
      ) : (
        <>
          <div className="gap-hero card">
            <div
              className="coverage-ring"
              style={{ '--progress': `${gap.skill_coverage_percentage}%` }}
              role="progressbar"
              aria-valuenow={coverage}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div>
                <strong>
                  {coverage}
                  <small>%</small>
                </strong>
                <span>coverage</span>
              </div>
            </div>

            <div className="gap-summary">
              <span className="eyebrow">READINESS SNAPSHOT · {gap.target_role}</span>
              <h2>
                {missingCount > 0
                  ? `Master ${missingCount} focused skill${missingCount > 1 ? 's' : ''} to meet 100% core role requirements.`
                  : 'You have satisfied all mandatory technical requirements for this role!'}
              </h2>
              <p>
                Calculated strictly by matched required skills divided by total mandatory skills for this role profile.
              </p>

              <div className="gap-meta">
                <span>
                  <b>{matchedCount}</b> matched core
                </span>
                <span>
                  <b>{missingCount}</b> missing core
                </span>
                <span>
                  <b>{optionalCount}</b> matched optional
                </span>
              </div>

              <div className="gap-actions-row" style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => navigate('mentor')}
                >
                  <Icon name="message" size={14} /> Ask Mentor How to Close Gaps
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => navigate('matcher')}
                >
                  <Icon name="briefcase" size={14} /> Compare Against a Job Posting
                </button>
              </div>
            </div>
          </div>

          <div className="gap-columns">
            <SkillList
              title="Your Profile Skills"
              skills={skills}
              icon="check"
              tone="good"
              empty="Upload a resume to populate extracted skills."
            />
            <SkillList
              title="Priority Core Gaps to Learn"
              skills={gap.missing_required_skills || []}
              icon="target"
              tone="missing"
              empty="No core gaps! You meet all baseline role requirements."
            />
            <SkillList
              title="Optional Edge Skills Matched"
              skills={gap.matched_optional_skills || []}
              icon="spark"
              tone="optional"
              empty="No optional skills matched yet for this specific path."
            />
          </div>
        </>
      )}
    </>
  )
}

function SkillList({ title, skills, icon, tone, empty }) {
  return (
    <section className="card skill-list-card" aria-label={title}>
      <div className="card-heading">
        <h2>{title}</h2>
        <span className={`count-badge ${tone}`}>{skills.length}</span>
      </div>
      {skills.length > 0 ? (
        <div className="large-chip-list">
          {skills.map((skill) => (
            <span className={`large-chip ${tone}`} key={skill}>
              <Icon name={icon} size={14} />
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="small-muted">{empty}</p>
      )}
    </section>
  )
}
