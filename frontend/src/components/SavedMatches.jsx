import { PageIntro } from './common/Icons'

export function SavedMatches({ matches }) {
  return (
    <>
      <PageIntro
        eyebrow="JOB MATCH HISTORY"
        title="Review your saved opportunities."
        description="Keep the job matches that matter and revisit their skill gaps as your profile evolves."
      />
      {matches.length === 0 ? (
        <div className="card empty-inline">No saved job matches yet. Analyze a job description and choose Save Job Match.</div>
      ) : (
        <div className="saved-match-grid">
          {matches.map((match) => (
            <article className="card saved-match-card" key={match.id}>
              <span className="eyebrow">{match.created_at}</span>
              <h2>{match.title}</h2>
              {match.company && <p>{match.company}</p>}
              <strong>{match.result?.skill_coverage_percentage ?? 0}% skill coverage</strong>
              <div className="mini-chips">
                {(match.result?.missing_skills || []).map((skill) => <span className="tiny-chip" key={skill}>{skill}</span>)}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
