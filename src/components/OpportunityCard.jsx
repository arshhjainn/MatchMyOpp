import { Bookmark, Heart, MapPin, Sparkles, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EligibilityBadge, MatchBreakdownModal, MatchScoreBadge, DeadlineBadge } from './OpportunityInsights'
import { useState } from 'react'
import { useOpportunities } from '../hooks/useOpportunities'

export default function OpportunityCard({ opportunity, saved, onSave, onLike, onPass, actions = true }) {
  const [showBreakdown, setShowBreakdown] = useState(false)
  const { profile } = useOpportunities()
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_8px_32px_rgba(17,24,39,0.06)] transition-shadow hover:shadow-[0_12px_40px_rgba(17,24,39,0.1)]">
      <div className="flex items-start justify-between gap-4 p-5 pb-3 sm:p-6 sm:pb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#E8192C]">{opportunity.category}</span>
          <h2 className="mt-2 text-xl font-extrabold leading-tight text-gray-950 sm:text-2xl">
            <Link to={`/opportunities/${opportunity.id}`} className="hover:text-[#E8192C]">{opportunity.title}</Link>
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">{opportunity.organization || opportunity.location}</p>
        </div>
        <MatchScoreBadge opportunity={opportunity} profile={profile} />
      </div>
      <div className="px-5 sm:px-6">
        <p className="line-clamp-2 text-sm leading-6 text-gray-600">{opportunity.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2"><EligibilityBadge opportunity={opportunity} profile={profile} compact /><DeadlineBadge deadline={opportunity.deadline} /></div>
        <button type="button" onClick={() => setShowBreakdown(true)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#E8192C] hover:text-[#C8111E]"><Sparkles size={15} />View match breakdown</button>
        {opportunity.applicationUrl && <a href={opportunity.applicationUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-bold text-[#E8192C] hover:text-[#C8111E]">View application <span aria-hidden="true" className="ml-1">↗</span></a>}
        <div className="mt-4 flex flex-wrap gap-2">
          {opportunity.tags.slice(0, 3).map(tag => <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{tag}</span>)}
        </div>
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-gray-100 py-4 text-xs text-gray-600"><span className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400" />{opportunity.location}</span><span className="text-gray-500">Preliminary checks only</span></div>
      </div>
      {actions && <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/70 px-5 py-3 sm:px-6">
        <button onClick={onPass} aria-label="Pass opportunity" className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-gray-400 hover:text-gray-900"><X size={18} /></button>
        <Link to={`/opportunities/${opportunity.id}`} className="text-sm font-bold text-gray-700 hover:text-[#E8192C]">View details</Link>
        <div className="flex items-center gap-2">
          <button onClick={onSave} aria-label={saved ? 'Remove from saved' : 'Save opportunity'} className={`flex h-10 w-10 items-center justify-center rounded-full border bg-white transition ${saved ? 'border-amber-300 text-amber-600' : 'border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600'}`}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /></button>
          <button onClick={onLike} aria-label="Like opportunity" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8192C] text-white transition hover:bg-[#C8111E]"><Heart size={18} /></button>
        </div>
      </div>}
      {showBreakdown && <MatchBreakdownModal opportunity={opportunity} profile={profile} onClose={() => setShowBreakdown(false)} />}
    </article>
  )
}
