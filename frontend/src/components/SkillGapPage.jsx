import { useState } from 'react'
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
  resumeSkills = [],
  verifiedSkills = [],
  isRealResume = false,
  jobMatch = null,
}) {
  const [expandedSkill, setExpandedSkill] = useState(null)
  const coverage = gap ? Math.round(gap.skill_coverage_percentage) : 0
  const missingCount = gap?.missing_required_skills?.length || 0
  const matchedCount = gap?.matched_required_skills?.length || 0
  const optionalCount = gap?.matched_optional_skills?.length || 0
  const prioritizedGaps = gap?.prioritized_gaps || []
  const prioritizedSkillNames = prioritizedGaps.map((item) => item.skill)

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
              onClick={() => roadmap(prioritizedSkillNames)}
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
      <p className="skill-source-note">
        Profile skills are matched from {isRealResume ? 'your uploaded resume' : 'the current profile/demo data'}.
        Assessment verification is shown separately when available.
      </p>
      {jobMatch?.missing_skills?.length > 0 && (
        <div className="job-gap-context card" role="status">
          <div>
            <span className="eyebrow">JOB POSTING CONTEXT</span>
            <strong>{jobMatch.missing_skills.length} requirements from your latest comparison need attention.</strong>
            <p>{jobMatch.missing_skills.join(', ')}</p>
          </div>
          <button type="button" className="button secondary" onClick={() => roadmap(jobMatch.suggested_learning_skills)}>
            <Icon name="map" size={14} /> Add to roadmap
          </button>
        </div>
      )}

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
              renderSkill={(skill) => (
                <span className="skill-source-label">
                  {verifiedSkills.some((item) => item.toLowerCase() === skill.toLowerCase())
                    ? 'Assessment verified'
                    : isRealResume && resumeSkills.some((item) => item.toLowerCase() === skill.toLowerCase())
                      ? 'Resume detected'
                      : 'Profile skill'}
                </span>
              )}
            />
            <SkillList
              title="Prioritized Gaps to Learn"
              skills={prioritizedGaps}
              icon="target"
              tone="missing"
              empty="No core gaps! You meet all baseline role requirements."
              renderSkill={(item) => (
                <div className="priority-gap-content">
                  <div className="priority-gap-heading">
                    <strong>{item.skill}</strong>
                    <span className={`priority-label ${item.priority.toLowerCase()}`}>{item.priority} priority</span>
                  </div>
                  <span className="priority-gap-why">{item.why_required}</span>
                  <span className="priority-gap-meta">
                    {item.estimated_hours} hours
                    {item.prerequisites.length ? ` · Prerequisite: ${item.prerequisites.join(', ')}` : ' · No prerequisites listed'}
                  </span>
                  {expandedSkill === item.skill && (
                    <div className="priority-gap-details">
                      <span><b>Exercise:</b> {item.exercise}</span>
                      <span><b>Resources:</b> {item.resources.join(', ') || 'Use the practical exercise above.'}</span>
                    </div>
                  )}
                  <div className="priority-gap-actions">
                    <button type="button" className="text-button" onClick={() => roadmap([item.skill])}>
                      Start Learning <Icon name="arrow" size={12} />
                    </button>
                    <button type="button" className="ghost-button" onClick={() => setExpandedSkill(expandedSkill === item.skill ? null : item.skill)}>
                      {expandedSkill === item.skill ? 'Hide details' : 'View details'}
                    </button>
                  </div>
                </div>
              )}
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

function SkillList({ title, skills, icon, tone, empty, renderSkill }) {
  return (
    <section className="card skill-list-card" aria-label={title}>
      <div className="card-heading">
        <h2>{title}</h2>
        <span className={`count-badge ${tone}`}>{skills.length}</span>
      </div>
      {skills.length > 0 ? (
        <div className="large-chip-list">
          {skills.map((skill, index) => (
            <div className={`large-chip ${tone} ${renderSkill ? 'large-chip-rich' : ''}`} key={`${title}-${renderSkill ? skill.skill : skill}-${index}`}>
              <Icon name={icon} size={14} />
              {renderSkill ? renderSkill(skill) : skill}
            </div>
          ))}
        </div>
      ) : (
        <p className="small-muted">{empty}</p>
      )}
    </section>
  )
}
