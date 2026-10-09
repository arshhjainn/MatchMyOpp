import { useState } from 'react'
import { ExternalLink, FileCheck2, LoaderCircle, Save } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductHeader from '../components/ProductHeader'
import { formatDeadline } from '../utils/dates'
import { useOpportunities } from '../hooks/useOpportunities'

const statuses = ['Interested', 'Preparing', 'Applied', 'Interview', 'Accepted', 'Rejected']

function ApplicationRow({ application, updateApplication }) {
  const [status, setStatus] = useState(application.status)
  const [notes, setNotes] = useState(application.notes)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const save = async changes => {
    setBusy(true)
    setMessage('')
    const result = await updateApplication(application.id, changes)
    setBusy(false)
    setMessage(result ? 'Saved' : 'Could not save')
  }

  return <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_6px_24px_rgba(17,24,39,0.04)] sm:p-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E8192C]">{application.deadline ? `Deadline ${formatDeadline(application.deadline)}` : 'Application tracker'}</p>
        <h2 className="mt-2 text-xl font-extrabold text-gray-950"><Link to={`/opportunities/${application.opportunityId}`} className="hover:text-[#E8192C]">{application.opportunityTitle}</Link></h2>
      </div>
      {application.applicationUrl && <a href={application.applicationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#E8192C] hover:text-[#C8111E]">Application page <ExternalLink size={14} /></a>}
    </div>
    <div className="mt-5 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-[220px_1fr]">
      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Status
        <select value={status} onChange={event => { setStatus(event.target.value); save({ status: event.target.value }) }} className="mt-2 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-gray-800 outline-none focus:border-[#E8192C]">
          {statuses.map(item => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Notes
        <textarea value={notes} onChange={event => setNotes(event.target.value)} rows={3} placeholder="Add a reminder or next step…" className="mt-2 block w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#E8192C]" />
      </label>
    </div>
    <div className="mt-3 flex items-center justify-end gap-3">
      {message && <span className={`text-xs ${message === 'Saved' ? 'text-emerald-700' : 'text-red-700'}`}>{message}</span>}
      <button onClick={() => save({ status, notes })} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#21243d] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#16192e] disabled:opacity-60">{busy ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}Save notes</button>
    </div>
  </article>
}

export default function ApplicationsPage() {
  const { profile, applications, error, loadApplications, updateApplication } = useOpportunities()
  return <div className="min-h-screen bg-[#fbfaf9] text-gray-900">
    <ProductHeader />
    <main className="mx-auto max-w-5xl px-5 py-10 md:px-8 md:py-14">
      <p className="flex items-center gap-2 text-sm font-bold text-[#E8192C]"><FileCheck2 size={16} /> YOUR NEXT STEPS</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-4xl font-black tracking-tight text-gray-950 sm:text-5xl">Application tracker.</h1><p className="mt-3 text-gray-500">Keep every opportunity and next step in one place.</p></div>{profile && <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-600">{applications.length} tracked</span>}</div>
      {error && <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-[#C8111E]"><span>{error}</span><button onClick={loadApplications} className="font-bold underline">Retry</button></div>}
      {!profile ? <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center"><h2 className="text-lg font-bold">Set up or retrieve your profile</h2><p className="mt-1 text-sm text-gray-500">Your applications are connected to your student ID.</p><Link to="/onboarding" className="mt-5 inline-flex rounded-full bg-[#E8192C] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#C8111E]">Open profile</Link></div>
        : applications.length ? <div className="mt-8 space-y-4">{applications.map(item => <ApplicationRow key={item.id} application={item} updateApplication={updateApplication} />)}</div>
          : <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center"><FileCheck2 className="mx-auto text-gray-300" size={30} /><h2 className="mt-3 text-lg font-bold text-gray-900">No applications tracked yet</h2><p className="mt-1 text-sm text-gray-500">Open an opportunity and add it to your tracker when you’re interested.</p><Link to="/discover" className="mt-5 inline-flex rounded-full bg-[#E8192C] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#C8111E]">Discover opportunities</Link></div>}
    </main>
  </div>
}
