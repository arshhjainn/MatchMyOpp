import { Bookmark, CalendarDays, Check, Clock3, Heart, MapPin, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { daysUntil, formatDeadline } from '../utils/dates'

export default function OpportunityCard({ opportunity, saved, onSave, onLike, onPass, actions = true }) {
  const days = daysUntil(opportunity.deadline)
  const eligible = opportunity.eligibilityStatus === 'eligible' || (!opportunity.eligibilityStatus && opportunity.eligible)
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
        <div className="shrink-0 rounded-2xl bg-red-50 px-3 py-2 text-center">
          <div className="text-2xl font-black leading-none text-[#E8192C]">{opportunity.matchScore}%</div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">match</div>
        </div>
      </div>
      <div className="px-5 sm:px-6">
        <p className="line-clamp-2 text-sm leading-6 text-gray-600">{opportunity.description}</p>
        {opportunity.applicationUrl && <a href={opportunity.applicationUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-bold text-[#E8192C] hover:text-[#C8111E]">View application <span aria-hidden="true" className="ml-1">↗</span></a>}
        <div className="mt-4 flex flex-wrap gap-2">
          {opportunity.tags.slice(0, 3).map(tag => <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{tag}</span>)}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 py-4 text-xs text-gray-600 sm:grid-cols-3">
          <span className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400" />{opportunity.location}</span>
          <span className="flex items-center gap-1.5"><CalendarDays size={14} className="text-gray-400" />{formatDeadline(opportunity.deadline)}</span>
          <span className={`flex items-center gap-1.5 ${eligible ? 'text-emerald-700' : 'text-amber-700'}`}>
            {eligible ? <Check size={14} /> : <Clock3 size={14} />}{eligible ? 'You appear eligible' : 'Check eligibility'}
          </span>
        </div>
        {days <= 14 && <p className="mb-4 -mt-1 text-xs font-semibold text-[#E8192C]">{days <= 0 ? 'Deadline passed' : `Closes in ${days} days`}</p>}
      </div>
      {actions && <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/70 px-5 py-3 sm:px-6">
        <button onClick={onPass} aria-label="Pass opportunity" className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-gray-400 hover:text-gray-900"><X size={18} /></button>
        <Link to={`/opportunities/${opportunity.id}`} className="text-sm font-bold text-gray-700 hover:text-[#E8192C]">View details</Link>
        <div className="flex items-center gap-2">
          <button onClick={onSave} aria-label={saved ? 'Remove from saved' : 'Save opportunity'} className={`flex h-10 w-10 items-center justify-center rounded-full border bg-white transition ${saved ? 'border-amber-300 text-amber-600' : 'border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600'}`}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /></button>
          <button onClick={onLike} aria-label="Like opportunity" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8192C] text-white transition hover:bg-[#C8111E]"><Heart size={18} /></button>
        </div>
      </div>}
    </article>
  )
}
