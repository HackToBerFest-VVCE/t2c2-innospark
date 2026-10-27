import { useMemo, useState } from 'react'
import { Icon, PageIntro } from './common/Icons'

const STATUSES = [
  ['saved', 'Saved'],
  ['applied', 'Applied'],
  ['interview', 'Interview'],
  ['offer', 'Offer'],
  ['rejected', 'Rejected'],
  ['withdrawn', 'Withdrawn'],
]

const EMPTY_FORM = {
  company: '',
  job_title: '',
  job_url: '',
  status: 'saved',
  deadline: '',
  applied_date: '',
  follow_up_date: '',
  notes: '',
}

export function Applications({ applications, loading, error, create, updateStatus, remove }) {
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')

  const visibleApplications = useMemo(
    () => filter ? applications.filter((application) => application.status === filter) : applications,
    [applications, filter]
  )

  async function submit(event) {
    event.preventDefault()
    setFormError('')
    try {
      await create(form)
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch (submitError) {
      setFormError(submitError.message)
    }
  }

  return (
    <>
      <PageIntro
        eyebrow="APPLICATION PIPELINE"
        title="Keep every opportunity moving"
        description="Track real applications, interviews, deadlines, and follow-ups in one focused workspace. Nothing here is fabricated or auto-submitted."
        action={<button type="button" className="button primary" onClick={() => setShowForm(!showForm)}><Icon name="briefcase" size={16} /> {showForm ? 'Close form' : 'Add application'}</button>}
      />

      <div className="application-summary">
        {STATUSES.slice(0, 4).map(([value, label]) => (
          <button type="button" className={`application-stat ${filter === value ? 'active' : ''}`} key={value} onClick={() => setFilter(filter === value ? '' : value)}>
            <strong>{applications.filter((application) => application.status === value).length}</strong>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {showForm && (
        <form className="card application-form" onSubmit={submit}>
          <div className="card-heading"><h2>Add a real opportunity</h2><span className="data-source"><i aria-hidden="true"></i> Saved locally</span></div>
          <div className="application-form-grid">
            <label>Company<input required value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} placeholder="Company name" /></label>
            <label>Job title<input required value={form.job_title} onChange={(event) => setForm({ ...form, job_title: event.target.value })} placeholder="Role title" /></label>
            <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Job URL<input type="url" value={form.job_url} onChange={(event) => setForm({ ...form, job_url: event.target.value })} placeholder="https://..." /></label>
            <label>Deadline<input type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /></label>
            <label>Follow-up date<input type="date" value={form.follow_up_date} onChange={(event) => setForm({ ...form, follow_up_date: event.target.value })} /></label>
          </div>
          <label>Notes<textarea rows="3" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="What should you remember?" /></label>
          {formError && <div className="inline-error" role="alert"><Icon name="close" size={13} /> {formError}</div>}
          <button type="submit" className="button primary">Save application</button>
        </form>
      )}

      <section className="card applications-card" aria-label="Job applications">
        <div className="card-heading">
          <div><span className="eyebrow">YOUR PIPELINE</span><h2>{filter ? `${STATUSES.find(([value]) => value === filter)?.[1]} applications` : 'All applications'}</h2></div>
          <select aria-label="Filter applications by status" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">All statuses</option>{STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </div>
        {loading && <div className="empty-state">Loading your application pipeline...</div>}
        {!loading && error && <div className="inline-error" role="alert"><Icon name="close" size={13} /> {error}</div>}
        {!loading && !error && visibleApplications.length === 0 && <div className="empty-state"><Icon name="briefcase" size={28} /><h3>No applications here yet</h3><p>Add a real opportunity to track its next step, deadline, and follow-up.</p></div>}
        <div className="application-list">
          {visibleApplications.map((application) => (
            <article className="application-row" key={application.id}>
              <div className="application-company-mark">{application.company.slice(0, 2).toUpperCase()}</div>
              <div className="application-main"><strong>{application.job_title}</strong><span>{application.company}</span>{application.notes && <p>{application.notes}</p>}</div>
              <select aria-label={`Update status for ${application.job_title}`} value={application.status} onChange={(event) => updateStatus(application, event.target.value)}>{STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              <div className="application-dates">{application.deadline && <span>Due {application.deadline}</span>}{application.follow_up_date && <span>Follow up {application.follow_up_date}</span>}</div>
              <button type="button" className="icon-button" onClick={() => remove(application.id)} aria-label={`Delete ${application.job_title}`}><Icon name="close" size={15} /></button>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
