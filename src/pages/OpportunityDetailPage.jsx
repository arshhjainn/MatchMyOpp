import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, Check, Clock3, ExternalLink, MapPin, Plus, Sparkles } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import ProductHeader from '../components/ProductHeader'
import { daysUntil, formatDeadline } from '../utils/dates'
import { useOpportunities } from '../hooks/useOpportunities'

export default function OpportunityDetailPage() {
  const { id } = useParams()
  const { opportunities, profile, applications, error, getOpportunity, addApplication } = useOpportunities()
  const cachedOpportunity = opportunities.find(item => String(item.id) === id) ?? null
  const [detail, setDetail] = useState({ id: null, item: null, loading: true, error: '' })
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    getOpportunity(id)
      .then(item => { if (active) setDetail({ id, item, loading: false, error: '' }) })
      .catch(cause => { if (active) setDetail(current => ({ id, item: current.id === id ? current.item : null, loading: false, error: cause.message })) })
    return () => { active = false }
  }, [id, getOpportunity])

  const detailMatches = detail.id === id
  const opportunity = detailMatches ? detail.item ?? cachedOpportunity : cachedOpportunity
  const loading = !detailMatches || detail.loading
  const detailError = detailMatches ? detail.error : ''

  const tracked = applications.some(application => String(application.opportunityId) === String(id))
  const handleTrack = async () => {
    setBusy(true)
    const result = await addApplication(opportunity.id)
    setNotice(result ? 'Added to your application tracker as Interested.' : '')
    setBusy(false)
  }

  if (loading && !opportunity) return <div className="min-h-screen bg-[#fbfaf9]"><ProductHeader /><main className="mx-auto max-w-3xl px-6 py-20 text-center text-gray-500">Loading opportunity…</main></div>
  if (!opportunity) return <div className="min-h-screen bg-[#fbfaf9]"><ProductHeader /><main className="mx-auto max-w-3xl px-6 py-20 text-center"><h1 className="text-3xl font-black">Opportunity not found</h1><p className="mt-2 text-sm text-gray-500">{detailError || 'This opportunity may no longer be available.'}</p><Link to="/discover" className="mt-5 inline-block font-bold text-[#E8192C]">Back to discover</Link></main></div>

  const days = daysUntil(opportunity.deadline)
  const matchReasons = opportunity.matchReasons ?? []
  const grades = opportunity.eligibleGrades ?? []
  const eligibilityStatus = opportunity.eligibilityStatus ?? 'eligible'
  return <div className="min-h-screen bg-[#fbfaf9] text-gray-900">
    <ProductHeader />
    <main className="mx-auto max-w-4xl px-5 py-9 md:px-8 md:py-14">
      <Link to="/discover" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#E8192C]"><ArrowLeft size={16} /> Back to discover</Link>
      <article className="mt-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_8px_40px_rgba(17,24,39,0.06)]">
        <div className="bg-[#21243d] px-6 py-8 text-white sm:px-10 sm:py-12">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-red-200">{opportunity.category}</span>
          <div className="mt-4 flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div><h1 className="max-w-2xl text-3xl font-black leading-tight sm:text-4xl">{opportunity.title}</h1><p className="mt-3 text-lg font-semibold text-white/75">{opportunity.amount}</p></div>
            <div className="shrink-0 rounded-2xl bg-white/10 px-4 py-3 text-center"><span className="block text-3xl font-black text-white">{opportunity.matchScore}%</span><span className="text-[10px] font-bold uppercase tracking-widest text-white/60">match</span></div>
          </div>
        </div>
        <div className="p-6 sm:p-10">
          <div className="grid gap-4 border-b border-gray-100 pb-6 sm:grid-cols-3">
            <div className="flex gap-3"><CalendarDays className="mt-0.5 text-[#E8192C]" size={18} /><div><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Deadline</p><p className="mt-1 text-sm font-semibold">{formatDeadline(opportunity.deadline)}</p>{Number.isFinite(days) && <p className="mt-1 text-xs text-[#E8192C]">{days > 0 ? `${days} days left` : 'Deadline passed'}</p>}</div></div>
            <div className="flex gap-3"><MapPin className="mt-0.5 text-[#E8192C]" size={18} /><div><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Location</p><p className="mt-1 text-sm font-semibold">{opportunity.location}</p></div></div>
            <div className="flex gap-3">{eligibilityStatus === 'eligible' ? <Check className="mt-0.5 text-emerald-600" size={18} /> : <Clock3 className="mt-0.5 text-amber-600" size={18} />}<div><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Eligibility</p><p className="mt-1 text-sm font-semibold">{eligibilityStatus === 'eligible' ? 'Eligible match' : 'Review eligibility'}</p></div></div>
          </div>
          <section className="py-7"><h2 className="text-lg font-extrabold">About this opportunity</h2><p className="mt-3 text-sm leading-7 text-gray-600">{opportunity.description}</p></section>
          {matchReasons.length > 0 && <section className="border-t border-gray-100 py-7"><h2 className="flex items-center gap-2 text-lg font-extrabold"><Sparkles size={18} className="text-[#E8192C]" />Why this matches you</h2><ul className="mt-4 space-y-3">{matchReasons.map(reason => <li key={reason} className="flex items-start gap-3 text-sm text-gray-600"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />{reason}</li>)}</ul></section>}
          <section className="border-t border-gray-100 py-7"><h2 className="text-lg font-extrabold">Eligibility details</h2><div className="mt-4 grid gap-3 text-sm text-gray-600 sm:grid-cols-2">{grades.length > 0 && <p><span className="font-semibold text-gray-800">Eligible grades:</span> {grades.join(', ')}</p>}{opportunity.minAge != null && <p><span className="font-semibold text-gray-800">Age range:</span> {opportunity.minAge}{opportunity.maxAge != null ? `–${opportunity.maxAge}` : '+'}</p>}{opportunity.requiredSkills.length > 0 && <p className="sm:col-span-2"><span className="font-semibold text-gray-800">Required skills:</span> {opportunity.requiredSkills.join(', ')}</p>}</div></section>
          <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-6">{opportunity.tags.map(tag => <span key={tag} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">{tag}</span>)}</div>
          {(error || notice) && <p role={error ? 'alert' : 'status'} className={`mt-6 rounded-xl px-4 py-3 text-sm ${error ? 'bg-red-50 text-[#C8111E]' : 'bg-emerald-50 text-emerald-800'}`}>{error || notice}</p>}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {profile && <button onClick={handleTrack} disabled={tracked || busy} className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 transition hover:border-[#E8192C] hover:text-[#E8192C] disabled:cursor-default disabled:opacity-60"><Plus size={17} />{tracked ? 'In application tracker' : busy ? 'Adding…' : 'Track application'}</button>}
            {opportunity.applicationUrl && <a href={opportunity.applicationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E8192C] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#C8111E]">Apply now <ExternalLink size={16} /></a>}
            <Link to="/applications" className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-gray-600 hover:text-[#E8192C]">Application tracker</Link>
          </div>
        </div>
      </article>
    </main>
  </div>
}
