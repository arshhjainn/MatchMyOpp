import { useEffect, useRef } from 'react'
import { Check, CircleHelp, ExternalLink, Info, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { evaluateEligibility, scoreOpportunity } from '../utils/opportunityInsights'
import { deadlineLabel, deadlineDays } from '../utils/deadlineRadar'

const statusStyle = {
  eligible: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  'possibly-eligible': 'bg-amber-50 text-amber-800 ring-amber-100',
  'not-eligible': 'bg-red-50 text-red-700 ring-red-100',
}
const statusLabel = { eligible: 'Eligible · preliminary', 'possibly-eligible': 'Possibly eligible · preliminary', 'not-eligible': 'Not eligible · preliminary' }

export function MatchScoreBadge({ opportunity, profile, compact = false }) {
  const { score } = scoreOpportunity(opportunity, profile)
  return <span className={`inline-flex items-center rounded-full bg-red-50 font-bold text-[#E8192C] ring-1 ring-red-100 ${compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'}`} aria-label={`Demo match compatibility ${score} percent`}>{score}% match</span>
}

export function EligibilityBadge({ opportunity, profile, compact = false }) {
  const { status } = evaluateEligibility(opportunity, profile)
  const short = { eligible: 'Eligible', 'possibly-eligible': 'Possibly eligible', 'not-eligible': 'Not eligible' }[status]
  return <span className={`inline-flex items-center rounded-full ring-1 ${statusStyle[status]} ${compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'} font-semibold`} title="Preliminary frontend eligibility assessment">{short}</span>
}

export function DeadlineBadge({ deadline }) {
  const days = deadlineDays(deadline)
  const urgency = days === null ? 'bg-gray-100 text-gray-600' : days < 0 ? 'bg-gray-100 text-gray-500' : days <= 3 ? 'bg-red-50 text-[#C8111E]' : days <= 7 ? 'bg-amber-50 text-amber-800' : 'bg-gray-100 text-gray-600'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${urgency}`} title={deadline ? 'Deadline has not been independently verified' : 'No deadline was provided'}>{deadline ? `${deadlineLabel(deadline)} · unverified` : deadlineLabel(deadline)}</span>
}

export function EligibilityChecklist({ opportunity, profile, showHeading = true }) {
  const result = evaluateEligibility(opportunity, profile)
  return <section className="rounded-2xl border border-gray-100 bg-white p-5">
    {showHeading && <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold text-gray-900">Eligibility check</h3><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle[result.status]}`}>{statusLabel[result.status]}</span></div>}
    <ul className="mt-4 space-y-3">
      {result.checks.map((item, index) => <li key={`${item.label}-${index}`} className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${item.state === 'satisfied' ? 'bg-emerald-100 text-emerald-700' : item.state === 'unmet' ? 'bg-red-100 text-red-700' : item.state === 'missing' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`} aria-hidden="true">{item.state === 'satisfied' ? <Check size={13} /> : item.state === 'unmet' ? <X size={13} /> : <CircleHelp size={13} />}</span>
        <div><p className="text-sm font-semibold text-gray-800">{item.label}</p><p className="mt-0.5 text-xs leading-5 text-gray-500">{item.detail}</p></div>
      </li>)}
    </ul>
    <p className="mt-4 border-t border-gray-100 pt-3 text-xs leading-5 text-gray-500">{result.disclaimer}</p>
    {(!profile || result.checks.some(item => item.state === 'missing')) && <Link to="/onboarding" className="mt-3 inline-flex text-sm font-bold text-[#E8192C] hover:text-[#C8111E]">Update your profile <ExternalLink size={14} className="ml-1" /></Link>}
  </section>
}

export function MatchBreakdownModal({ opportunity, profile, onClose }) {
  const result = scoreOpportunity(opportunity, profile)
  const closeButton = useRef(null)
  const dialog = useRef(null)
  useEffect(() => {
    const previouslyFocused = document.activeElement
    closeButton.current?.focus()
    const handleKey = event => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab' && dialog.current) {
        const focusable = [...dialog.current.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        const first = focusable[0]
        const last = focusable.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => { window.removeEventListener('keydown', handleKey); previouslyFocused?.focus?.() }
  }, [onClose])
  const suggestions = [
    result.missingSkills.length ? `${profile ? 'Build or highlight' : 'Review'} these listed skills: ${result.missingSkills.join(', ')}.` : null,
    result.dimensions.find(item => item.key === 'education' && !item.available) ? 'Add your year or grade to evaluate education fit.' : null,
    result.dimensions.find(item => item.key === 'experience' && !item.available) ? 'If you have relevant experience, highlight it in your application; this profile does not collect experience yet.' : null,
    result.dimensions.find(item => item.key === 'preferences' && !item.available) ? 'Add your location to compare travel and remote preferences.' : null,
  ].filter(Boolean)
  const canUpdateProfile = result.profileMissing || result.dimensions.some(item => !item.available && item.key !== 'experience')
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-gray-950/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="match-breakdown-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-gray-100 bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E8192C]">Match Detective · demo calculation</p><h2 id="match-breakdown-title" className="mt-1 text-xl font-black text-gray-950">Why {opportunity.title} fits</h2></div><button ref={closeButton} type="button" onClick={onClose} aria-label="Close match breakdown" className="rounded-full p-2 text-gray-500 hover:bg-gray-100"><X size={19} /></button></div>
      <div className="mt-5 flex items-center gap-4 rounded-2xl bg-[#fbfaf9] p-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-2xl font-black text-[#E8192C]">{result.score}%</div><div><p className="font-bold text-gray-900">Match compatibility</p><p className="mt-1 text-sm leading-5 text-gray-500">A deterministic estimate from the profile details and opportunity criteria available in the frontend.</p></div></div>
      <div className="mt-5 space-y-4">
        {result.dimensions.map(item => <div key={item.key}><div className="mb-1.5 flex items-center justify-between gap-3"><span className="text-sm font-semibold text-gray-800">{item.label}</span><span className="text-xs font-bold text-gray-500">{item.available ? `${item.value}%` : 'Not enough profile data'}</span></div><div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${item.available ? 'bg-[#E8192C]' : 'bg-gray-300'}`} style={{ width: `${item.available ? item.value : 0}%` }} /></div>{item.matched?.length > 0 && <p className="mt-1 text-xs text-emerald-700">Matches: {item.matched.join(', ')}</p>}</div>)}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4"><h3 className="text-sm font-bold text-emerald-800">Your strengths</h3><p className="mt-1.5 text-sm text-gray-600">{result.matchedSkills.length ? result.matchedSkills.join(', ') : profile ? 'No listed required skills matched yet.' : 'Complete your profile to identify matched skills.'}</p></div><div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4"><h3 className="text-sm font-bold text-amber-900">{profile ? 'Required skills not in your profile' : 'Skills to verify'}</h3><p className="mt-1.5 text-sm text-gray-600">{result.missingSkills.length ? result.missingSkills.join(', ') : 'No missing listed skills from the data available.'}</p></div></div>
      <div className="mt-4 rounded-2xl border border-gray-100 p-4"><h3 className="text-sm font-bold text-gray-900">Suggested next steps</h3>{suggestions.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">{suggestions.map(item => <li key={item}>{item}</li>)}</ul> : <p className="mt-1.5 text-sm text-gray-600">Keep your profile current and review the official requirements before applying.</p>}</div>
      <ul className="mt-5 space-y-2">{result.reasons.map(reason => <li key={reason} className="flex gap-2 text-sm text-gray-600"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />{reason}</li>)}</ul>
      <div className="mt-5 flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900"><Info size={15} className="mt-0.5 shrink-0" />This is a demo calculation, not an AI or external recommendation. Compatibility is separate from eligibility and does not predict selection.</div>
      {canUpdateProfile && <Link to="/onboarding" onClick={onClose} className="mt-4 inline-flex rounded-full bg-[#E8192C] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#C8111E]">Update your profile</Link>}
    </section>
  </div>
}
