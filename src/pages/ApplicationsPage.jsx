import { useMemo, useState } from 'react'
import { ArrowUpRight, CalendarDays, Check, Clock3, ExternalLink, FileCheck2, LoaderCircle, RefreshCw, Save } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductHeader from '../components/ProductHeader'
import { formatDeadline } from '../utils/dates'
import { deadlineCountdown, deadlineGroups, getDeadlineGroup } from '../utils/applicationDeadlines'
import { useOpportunities } from '../hooks/useOpportunities'

const statuses = ['Interested', 'Preparing', 'Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected', 'Withdrawn']
const statusStyles = {
  Interested: 'bg-gray-100 text-gray-700',
  Preparing: 'bg-amber-50 text-amber-800',
  Applied: 'bg-blue-50 text-blue-800',
  Shortlisted: 'bg-violet-50 text-violet-800',
  Interview: 'bg-indigo-50 text-indigo-800',
  Selected: 'bg-emerald-50 text-emerald-800',
  Rejected: 'bg-rose-50 text-rose-800',
  Withdrawn: 'bg-gray-100 text-gray-500',
}

function StatusBadge({ status }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusStyles[status] ?? 'bg-gray-100 text-gray-700'}`}>{status}</span>
}

function DeadlineBadge({ deadline }) {
  const group = getDeadlineGroup(deadline)
  const urgent = ['today', 'three-days'].includes(group)
  const overdue = group === 'overdue'
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${overdue ? 'bg-rose-50 text-rose-700' : urgent ? 'bg-amber-50 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
    <Clock3 size={13} aria-hidden="true" />{deadlineCountdown(deadline)}
  </span>
}

function ApplicationCard({ application, updateApplication, compact = false }) {
  const [notes, setNotes] = useState(application.notes ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState(application.status || 'Interested')
  const options = [...new Set([status, ...statuses])]

  const save = async changes => {
    setBusy(true)
    setMessage('')
    const result = await updateApplication(application.id, changes)
    setBusy(false)
    if (!result) {
      setMessage('Could not save. Please try again.')
      return false
    }
    if (changes.status) setStatus(changes.status)
    setMessage('Saved')
    return true
  }

  return <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_6px_24px_rgba(17,24,39,0.04)] sm:p-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          <DeadlineBadge deadline={application.deadline} />
          {application.reminderWindowsDue?.length > 0 && <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-[#C8111E]">Reminder window: {application.reminderWindowsDue.join(' or ')} days</span>}
        </div>
        <h2 className="mt-3 text-lg font-extrabold text-gray-950 sm:text-xl"><Link to={`/opportunities/${application.opportunityId}`} className="hover:text-[#E8192C]">{application.opportunityTitle}</Link></h2>
        {application.organization && <p className="mt-1 text-sm text-gray-500">{application.organization}</p>}
        <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500"><CalendarDays size={15} className="text-[#E8192C]" /> Deadline {formatDeadline(application.deadline)}</p>
        {application.createdAt && <p className="mt-1 text-xs text-gray-400">Added {formatDeadline(application.createdAt)}</p>}
        {application.submittedAt && <p className="mt-1 text-xs text-gray-400">Submitted {formatDeadline(application.submittedAt)}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap gap-3">
        <Link to={`/opportunities/${application.opportunityId}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:text-[#E8192C]">Details <ArrowUpRight size={15} /></Link>
        {application.applicationUrl && <a href={application.applicationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#E8192C] hover:text-[#C8111E]">Official page <ExternalLink size={14} /></a>}
      </div>
    </div>
    <div className={`mt-5 grid gap-4 border-t border-gray-100 pt-5 ${compact ? '' : 'sm:grid-cols-[220px_1fr]'}`}>
      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Application status
        <select value={status} disabled={busy} onChange={event => save({ status: event.target.value })} className="mt-2 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-gray-800 outline-none focus:border-[#E8192C] disabled:opacity-60">
          {options.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Notes
        <textarea value={notes} onChange={event => setNotes(event.target.value)} rows={compact ? 2 : 3} placeholder="Add a reminder or next step…" className="mt-2 block w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#E8192C]" />
      </label>
    </div>
    <div className="mt-3 flex min-h-9 flex-wrap items-center justify-end gap-3">
      {message && <span role="status" className={`mr-auto text-xs ${message === 'Saved' ? 'text-emerald-700' : 'text-red-700'}`}>{message}</span>}
      <button onClick={() => save({ notes })} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#21243d] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#16192e] disabled:opacity-60">{busy ? <LoaderCircle size={14} className="animate-spin" /> : message === 'Saved' ? <Check size={14} /> : <Save size={14} />}Save notes</button>
    </div>
  </article>
}

function SummaryCard({ label, value, detail, icon: Icon }) {
  return <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_6px_24px_rgba(17,24,39,0.04)] sm:p-5">
    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-gray-500">{label}</p><p className="mt-2 text-3xl font-black tracking-tight text-gray-950">{value}</p><p className="mt-1 text-xs text-gray-400">{detail}</p></div><span className="rounded-xl bg-red-50 p-2.5 text-[#E8192C]"><Icon size={18} /></span></div>
  </article>
}

function EmptyState({ filtered, onReset }) {
  return <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
    <FileCheck2 className="mx-auto text-gray-300" size={30} />
    <h2 className="mt-3 text-lg font-bold text-gray-900">{filtered ? 'No applications match these filters' : 'No applications tracked yet'}</h2>
    <p className="mt-1 text-sm text-gray-500">{filtered ? 'Try a different status or deadline filter.' : 'Track opportunities you’re interested in and keep your next steps together.'}</p>
    {filtered ? <button onClick={onReset} className="mt-5 inline-flex rounded-full border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 hover:border-[#E8192C] hover:text-[#E8192C]">Clear filters</button> : <Link to="/discover" className="mt-5 inline-flex rounded-full bg-[#E8192C] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#C8111E]">Discover opportunities</Link>}
  </div>
}

export default function ApplicationsPage() {
  const { profile, applications, applicationsLoading, applicationDashboard, deadlineFeed, error, loadApplications, updateApplication } = useOpportunities()
  const [view, setView] = useState('applications')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deadlineFilter, setDeadlineFilter] = useState('all')
  const hasFilters = statusFilter !== 'all' || deadlineFilter !== 'all'
  const filtered = useMemo(() => applications.filter(application => {
    if (statusFilter !== 'all' && application.status !== statusFilter) return false
    if (deadlineFilter !== 'all' && (application.deadlineGroup ?? getDeadlineGroup(application.deadline)) !== deadlineFilter) return false
    return true
  }), [applications, statusFilter, deadlineFilter])
  const submitted = applicationDashboard?.applications_submitted ?? applications.filter(item => ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected', 'Accepted'].includes(item.status)).length
  const shortlisted = applicationDashboard?.shortlisted ?? applications.filter(item => item.status === 'Shortlisted').length
  const availableStatuses = [...new Set([...statuses, ...applications.map(item => item.status).filter(Boolean)])]
  const upcoming = applications.filter(item => {
    const group = item.deadlineGroup ?? getDeadlineGroup(item.deadline)
    return ['today', 'three-days', 'seven-days'].includes(group)
  }).length
  const clearFilters = () => { setStatusFilter('all'); setDeadlineFilter('all') }

  return <div className="min-h-screen bg-[#fbfaf9] text-gray-900">
    <ProductHeader />
    <main className="mx-auto max-w-6xl px-5 py-9 md:px-8 md:py-12">
      <p className="flex items-center gap-2 text-sm font-bold text-[#E8192C]"><FileCheck2 size={16} /> YOUR NEXT STEPS</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-4xl font-black tracking-tight text-gray-950 sm:text-5xl">Application tracker.</h1><p className="mt-3 text-gray-500">Keep every opportunity, deadline, and next step in one place.</p></div>
        {profile && <button onClick={loadApplications} disabled={applicationsLoading} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-[#E8192C] hover:text-[#E8192C] disabled:opacity-60"><RefreshCw size={15} className={applicationsLoading ? 'animate-spin' : ''} /> Refresh</button>}
      </div>

      {profile && <section aria-label="Application summary" className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Tracked opportunities" value={applications.length} detail="Across all application stages" icon={FileCheck2} />
        <SummaryCard label="Applications submitted" value={submitted} detail="Applied or further along" icon={Check} />
        <SummaryCard label="Shortlisted" value={shortlisted} detail="Waiting on next steps" icon={ArrowUpRight} />
        <SummaryCard label="Upcoming deadlines" value={applicationDashboard?.upcoming_deadlines ?? upcoming} detail="Actionable applications due within 7 days" icon={Clock3} />
      </section>}

      {error && <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-[#C8111E]"><span>{error}</span><button onClick={loadApplications} className="font-bold underline">Retry</button></div>}

      {!profile ? <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center"><h2 className="text-lg font-bold">Set up or retrieve your profile</h2><p className="mt-1 text-sm text-gray-500">Your applications are connected to your student ID.</p><Link to="/onboarding" className="mt-5 inline-flex rounded-full bg-[#E8192C] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#C8111E]">Open profile</Link></div>
        : <>
          <section className="mt-7 rounded-2xl border border-red-100 bg-red-50/70 p-4 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-5">
            <div><p className="text-sm font-bold text-gray-900">Deadline reminders</p><p className="mt-1 text-sm text-gray-600">In-app deadline overview based on the dates and status in your tracker.</p></div>
            <p className="mt-3 text-xs font-medium text-gray-500 sm:mt-0">{deadlineFeed?.reminder_windows_days?.join(' · ') ?? '7 · 3 · 1'} day reminder windows. Email notifications are off.</p>
          </section>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Application views" className="inline-flex rounded-full border border-gray-200 bg-white p-1">
              <button role="tab" aria-selected={view === 'applications'} onClick={() => setView('applications')} className={`rounded-full px-4 py-2 text-sm font-bold transition ${view === 'applications' ? 'bg-[#21243d] text-white' : 'text-gray-600 hover:text-gray-900'}`}>Applications</button>
              <button role="tab" aria-selected={view === 'deadlines'} onClick={() => setView('deadlines')} className={`rounded-full px-4 py-2 text-sm font-bold transition ${view === 'deadlines' ? 'bg-[#21243d] text-white' : 'text-gray-600 hover:text-gray-900'}`}>Deadline radar</button>
            </div>
            {applicationsLoading && <span className="inline-flex items-center gap-2 text-sm text-gray-500"><LoaderCircle size={15} className="animate-spin" />Loading your applications…</span>}
          </div>

          {!applicationsLoading && !error && applications.length === 0 ? <div className="mt-6"><EmptyState /></div> : error && applications.length === 0 ? null : <>
            <div className="mt-5 grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:grid-cols-2 sm:p-5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Status
                <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="mt-2 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-gray-800 outline-none focus:border-[#E8192C]">
                  <option value="all">All statuses</option>{availableStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Deadline
                <select value={deadlineFilter} onChange={event => setDeadlineFilter(event.target.value)} className="mt-2 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-gray-800 outline-none focus:border-[#E8192C]">
                  <option value="all">All deadlines</option>{deadlineGroups.map(group => <option key={group.id} value={group.id}>{group.label}</option>)}
                </select>
              </label>
            </div>
            {filtered.length === 0 ? <div className="mt-5"><EmptyState filtered={hasFilters} onReset={clearFilters} /></div> : view === 'applications' ? <div role="tabpanel" className="mt-5 space-y-4">{filtered.map(item => <ApplicationCard key={item.id} application={item} updateApplication={updateApplication} />)}</div> : <section role="tabpanel" aria-label="Deadline reminders" className="mt-6 space-y-7">
              {deadlineGroups.map(group => {
                const groupItems = filtered.filter(item => (item.deadlineGroup ?? getDeadlineGroup(item.deadline)) === group.id)
                if (!groupItems.length) return null
                return <div key={group.id}>
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2"><div><h2 className="text-lg font-extrabold text-gray-950">{group.label}</h2><p className="mt-1 text-sm text-gray-500">{group.description}</p></div><span className="text-xs font-semibold text-gray-400">{groupItems.length} {groupItems.length === 1 ? 'application' : 'applications'}</span></div>
                  <div className="space-y-3">{groupItems.map(item => <ApplicationCard key={item.id} application={item} updateApplication={updateApplication} compact />)}</div>
                </div>
              })}
            </section>}
          </>}
        </>}
    </main>
  </div>
}
