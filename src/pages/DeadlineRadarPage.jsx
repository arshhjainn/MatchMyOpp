import { useMemo, useState } from 'react'
import { AlarmClock, ArrowDownWideNarrow, CircleHelp, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductHeader from '../components/ProductHeader'
import { DeadlineBadge, MatchScoreBadge, EligibilityBadge } from '../components/OpportunityInsights'
import { useOpportunities } from '../hooks/useOpportunities'
import { deadlineGroup, deadlineGroupLabel } from '../utils/deadlineRadar'
import { scoreOpportunity } from '../utils/opportunityInsights'
import localDemoOpportunities from '../data/opportunities.json'

const groups = ['closing', 'week', 'upcoming', 'unknown', 'closed']

export default function DeadlineRadarPage() {
  const { opportunities, saved, profile, loading, error, loadOpportunities } = useOpportunities()
  const [status, setStatus] = useState('active')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('deadline')
  const items = useMemo(() => {
    const unique = new Map(localDemoOpportunities.map(item => [String(item.id), { ...item, source: 'demo' }]))
    ;[...opportunities, ...saved].forEach(item => unique.set(String(item.id), { ...item, source: 'api' }))
    return [...unique.values()].map(item => ({ ...item, radarGroup: deadlineGroup(item.deadline) }))
  }, [opportunities, saved])
  const categories = ['All', ...new Set(items.map(item => item.category).filter(Boolean))]
  const visible = items.filter(item => status === 'all' || (status === 'active' ? item.radarGroup !== 'closed' : item.radarGroup === status))
    .filter(item => category === 'All' || item.category === category)
    .sort((a, b) => sort === 'match' ? scoreOpportunity(b, profile).score - scoreOpportunity(a, profile).score : (a.deadline || '9999').localeCompare(b.deadline || '9999'))
  const counts = Object.fromEntries(groups.map(group => [group, items.filter(item => item.radarGroup === group).length]))

  return <div className="min-h-screen bg-[#fbfaf9] text-gray-900"><ProductHeader /><main className="mx-auto max-w-6xl px-5 py-9 md:px-8 md:py-12">
    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#E8192C]"><AlarmClock size={15} />Deadline tracking</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Deadline Radar</h1><p className="mt-2 text-sm text-gray-500">Countdowns from opportunity deadlines. Locally bundled records are samples, not verified listings.</p></div><span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">Demo calculations · verify dates</span></div>
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">{groups.map(group => <button key={group} type="button" onClick={() => setStatus(group)} className={`rounded-2xl border p-4 text-left transition ${status === group ? 'border-[#E8192C] bg-red-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}><span className="text-xs font-semibold text-gray-500">{deadlineGroupLabel(group)}</span><span className="mt-1 block text-2xl font-black text-gray-900">{counts[group]}</span></button>)}</div>
    <div className="mt-5 flex flex-wrap gap-3 rounded-2xl border border-gray-100 bg-white p-4">
      <label className="text-xs font-semibold text-gray-500">Deadline status<select value={status} onChange={event => setStatus(event.target.value)} className="ml-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-800"><option value="active">All active</option>{groups.map(group => <option key={group} value={group}>{deadlineGroupLabel(group)}</option>)}<option value="all">All deadlines</option></select></label>
      <label className="text-xs font-semibold text-gray-500">Category<select value={category} onChange={event => setCategory(event.target.value)} className="ml-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-800">{categories.map(item => <option key={item}>{item}</option>)}</select></label>
      <label className="ml-auto text-xs font-semibold text-gray-500"><ArrowDownWideNarrow className="mr-1 inline" size={15} />Sort<select value={sort} onChange={event => setSort(event.target.value)} className="ml-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-800"><option value="deadline">Earliest deadline</option><option value="match">Highest match</option></select></label>
    </div>
    {error && <div role="alert" className="mt-4 flex justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-[#C8111E]">{error}<button onClick={loadOpportunities} className="font-bold underline">Retry</button></div>}
    {loading && <p className="mt-5 text-sm text-gray-500">Loading opportunity deadlines…</p>}
    {!loading && visible.length === 0 && <div className="mt-6 rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center"><CircleHelp className="mx-auto text-gray-300" size={30} /><h2 className="mt-3 text-lg font-bold">No opportunities in this deadline group</h2><p className="mt-1 text-sm text-gray-500">Try another filter or check back when opportunities are available.</p></div>}
    <div className="mt-6 space-y-3">{visible.map(item => <article key={item.id} className="grid gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_6px_24px_rgba(17,24,39,0.04)] sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-xs font-bold uppercase tracking-wider text-[#E8192C]">{item.category} · {deadlineGroupLabel(item.radarGroup)} {item.source === 'demo' && <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">Local sample</span>}</p><h2 className="mt-1 text-lg font-extrabold"><Link to={`/opportunities/${item.id}`} className="hover:text-[#E8192C]">{item.title}</Link></h2><p className="mt-1 text-sm text-gray-500">{item.organization} · {item.location}</p><div className="mt-3 flex flex-wrap gap-2"><MatchScoreBadge opportunity={item} profile={profile} compact /><EligibilityBadge opportunity={item} profile={profile} compact /></div></div><div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end"><DeadlineBadge deadline={item.deadline} /><span className="text-xs text-gray-400">Date not independently verified</span></div></article>)}</div>
    <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-gray-500"><Clock3 size={14} className="mt-0.5 shrink-0" />Countdowns use the device’s current date and time. Local records are samples; verify every deadline with the organizer. Missing dates remain unknown; expired opportunities are excluded from Discover by default.</p>
  </main></div>
}
