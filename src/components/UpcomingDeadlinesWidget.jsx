import { AlarmClock, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useOpportunities } from '../hooks/useOpportunities'
import { DeadlineBadge } from './OpportunityInsights'
import { deadlineDays } from '../utils/deadlineRadar'
import localDemoOpportunities from '../data/opportunities.json'

export default function UpcomingDeadlinesWidget() {
  const { opportunities, saved } = useOpportunities()
  const unique = new Map(localDemoOpportunities.map(item => [String(item.id), { ...item, source: 'demo' }]))
  ;[...opportunities, ...saved].forEach(item => unique.set(String(item.id), { ...item, source: 'api' }))
  const soon = [...unique.values()].filter(item => deadlineDays(item.deadline) !== null && deadlineDays(item.deadline) >= 0)
    .sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 3)
  return <section className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_4px_20px_rgba(17,24,39,0.04)]" aria-labelledby="upcoming-deadlines-heading">
    <div className="flex items-center justify-between gap-3"><h2 id="upcoming-deadlines-heading" className="flex items-center gap-2 text-sm font-bold text-gray-900"><AlarmClock size={16} className="text-[#E8192C]" />Upcoming deadlines</h2><Link to="/deadlines" className="inline-flex items-center gap-1 text-xs font-bold text-[#E8192C] hover:text-[#C8111E]">Open Radar <ArrowRight size={13} /></Link></div>
    {soon.length ? <ul className="mt-3 divide-y divide-gray-100">{soon.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"><span className="flex min-w-0 items-center gap-2"><Link to={`/opportunities/${item.id}`} className="truncate text-sm font-semibold text-gray-700 hover:text-[#E8192C]">{item.title}</Link>{item.source === 'demo' && <span className="shrink-0 text-[10px] text-gray-400">sample</span>}</span><DeadlineBadge deadline={item.deadline} /></li>)}</ul> : <p className="mt-2 text-xs leading-5 text-gray-500">No dated active opportunities yet. Missing dates are left unlisted.</p>}
  </section>
}
