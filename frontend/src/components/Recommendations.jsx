import { useState, useMemo } from 'react'
import { Icon, Loading, PageIntro } from './common/Icons'
import { RoleCard } from './Overview'

export function Recommendations({ navigate, recommendations, loading, error, setRole, refreshGap }) {
  const [sortBy, setSortBy] = useState('match') // 'match' | 'name'

  const sortedRoles = useMemo(() => {
    const list = [...recommendations]
    if (sortBy === 'name') {
      return list.sort((a, b) => a.target_role.localeCompare(b.target_role))
    }
    return list.sort((a, b) => b.match_percentage - a.match_percentage)
  }, [recommendations, sortBy])

  function handleSelectRole(targetRole) {
    setRole(targetRole)
    if (refreshGap) refreshGap(targetRole)
    navigate('gap')
  }

  return (
    <>
      <PageIntro
        eyebrow="CAREER PATHWAY EXPLORER · 8 CATALOG ROLES"
        title="Explore Matched Career Paths"
        description="Rankings are computed by weighting required skill coverage (80%) and optional bonus technologies (20%). Every score includes clear explainability so you understand exactly why you matched."
        action={
          <div className="recommendation-controls">
            <label htmlFor="sort-select" className="sr-only">Sort roles</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="role-dropdown"
              aria-label="Sort career paths"
            >
              <option value="match">Sort by Highest Match</option>
              <option value="name">Sort Alphabetically</option>
            </select>
          </div>
        }
      />

      {error && (
        <div className="inline-error" role="alert">
          <Icon name="close" size={14} /> {error}
        </div>
      )}

      {loading ? (
        <Loading text="Ranking 8 career paths against your resume evidence profile..." />
      ) : sortedRoles.length > 0 ? (
        <>
          <div className="recommendation-grid">
            {sortedRoles.map((role) => (
              <RoleCard
                key={role.target_role}
                role={role}
                compact={false}
                onSelect={() => handleSelectRole(role.target_role)}
              />
            ))}
          </div>

          <p className="demo-note" style={{ marginTop: '28px' }}>
            <span className="data-source">
              <i aria-hidden="true"></i> Evaluated across 8 canonical industry profiles. Scores are deterministic estimates of syllabus overlap, not hiring probabilities.
            </span>
          </p>
        </>
      ) : (
        <div className="card empty-inline">
          Upload a resume to generate explainable role recommendations.
        </div>
      )}
    </>
  )
}
