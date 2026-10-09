import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { CalendarDays, CheckCircle2, Heart, MapPin, Sparkles, X, ShieldCheck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import ProductHeader from '../components/ProductHeader'
import { formatDeadline } from '../utils/dates'
import { useOpportunities } from '../hooks/useOpportunities'
import { EligibilityBadge, MatchBreakdownModal, MatchScoreBadge, DeadlineBadge } from '../components/OpportunityInsights'
import { deadlineGroup } from '../utils/deadlineRadar'
import { scoreOpportunity, evaluateEligibility } from '../utils/opportunityInsights'
import UpcomingDeadlinesWidget from '../components/UpcomingDeadlinesWidget'

const coverImages = {
  'google-generation-scholars': 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=85',
  'mitacs-globalink-research': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1400&q=85',
  'mlh-fellowship-spring': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=85',
  'hackmit-2027': 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1400&q=85',
  'nsf-grfp-2027': 'https://images.unsplash.com/photo-1581093458791-9d15482442f4?auto=format&fit=crop&w=1400&q=85',
  'adobe-design-circle': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1400&q=85',
  'amazon-future-engineer': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85',
  'stanford-ai-hackathon': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1400&q=85',
  'unesco-youth-climate': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1400&q=85',
}

function SwipeCard({ opportunity, profile, onLike, onPass }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-240, 240], [-8, 8])
  const passOpacity = useTransform(x, [-140, -35], [1, 0])
  const likeOpacity = useTransform(x, [35, 140], [0, 1])
  const pointer = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const match = scoreOpportunity(opportunity, profile)
  const eligibility = evaluateEligibility(opportunity, profile)
  const matchReasons = match.reasons

  const startSwipe = event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (event.target.closest('button, a, select, input')) return
    pointer.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, startTime: performance.now(), dx: 0, active: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveSwipe = event => {
    const gesture = pointer.current
    if (!gesture || gesture.id !== event.pointerId) return
    const dx = event.clientX - gesture.startX
    const dy = event.clientY - gesture.startY
    if (!gesture.active && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      gesture.active = true
      setIsDragging(true)
    }
    if (gesture.active) {
      event.preventDefault()
      gesture.dx = dx
      x.set(dx)
    }
  }

  const finishSwipe = event => {
    const gesture = pointer.current
    if (!gesture || gesture.id !== event.pointerId) return
    pointer.current = null
    setIsDragging(false)
    if (!gesture.active) return

    const velocity = gesture.dx / Math.max(performance.now() - gesture.startTime, 1) * 1000
    const direction = gesture.dx > 0 ? 1 : -1
    if (Math.abs(gesture.dx) > 100 || Math.abs(velocity) > 650) {
      animate(x, direction * (window.innerWidth + 160), { duration: 0.2, ease: 'easeOut' }).then(async () => {
        const savedSwipe = direction > 0 ? await onLike() : await onPass()
        if (!savedSwipe) animate(x, 0, { type: 'spring', stiffness: 360, damping: 28 })
      })
    } else {
      animate(x, 0, { type: 'spring', stiffness: 360, damping: 28 })
    }
  }

  const cancelSwipe = () => {
    if (!pointer.current) return
    pointer.current = null
    setIsDragging(false)
    animate(x, 0, { type: 'spring', stiffness: 360, damping: 28 })
  }

  return (
    <motion.article
      layout
      style={{ x, rotate, touchAction: 'pan-y' }}
      onPointerDown={startSwipe}
      onPointerMove={moveSwipe}
      onPointerUp={finishSwipe}
      onPointerCancel={cancelSwipe}
      onKeyDown={event => {
        if (event.key === 'ArrowRight') onLike()
        if (event.key === 'ArrowLeft') onPass()
      }}
      tabIndex={0}
      role="group"
      aria-label={`${opportunity.title}. Swipe right or press right arrow to like; swipe left or press left arrow to pass.`}
      className={`relative w-full overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_12px_40px_rgba(17,24,39,0.1)] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      <motion.div style={{ opacity: likeOpacity }} className="pointer-events-none absolute right-6 top-6 z-20 -rotate-12 rounded-xl border-[3px] border-emerald-500 bg-white/90 px-4 py-2 text-xl font-black tracking-widest text-emerald-600">LIKE</motion.div>
      <motion.div style={{ opacity: passOpacity }} className="pointer-events-none absolute left-6 top-6 z-20 rotate-12 rounded-xl border-[3px] border-[#E8192C] bg-white/90 px-4 py-2 text-xl font-black tracking-widest text-[#E8192C]">PASS</motion.div>

      <div className="relative aspect-[16/9] overflow-hidden bg-[#21243d] sm:aspect-[2/1]">
        <img
          src={opportunity.imageUrl || coverImages[opportunity.id] || coverImages['google-generation-scholars']}
          alt={`${opportunity.category} opportunity at ${opportunity.organization}`}
          draggable="false"
          className="h-full w-full select-none object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15" />
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-gray-700 shadow-sm">{opportunity.featured}</span>
        <span className="absolute bottom-4 right-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm">{opportunity.category}</span>
      </div>

      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-500">{opportunity.organization} · {opportunity.tags.slice(0, 2).join(' & ')}</p>
            <h2 className="mt-1 text-2xl font-extrabold leading-tight text-gray-950 sm:text-3xl">
              <Link to={`/opportunities/${opportunity.id}`} onPointerDown={event => event.stopPropagation()} className="hover:text-[#E8192C]">{opportunity.title}</Link>
            </h2>
          </div>
          <div className="flex flex-wrap gap-2"><MatchScoreBadge opportunity={opportunity} profile={profile} /><EligibilityBadge opportunity={opportunity} profile={profile} compact /></div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 rounded-2xl bg-[#fbfaf9] p-4 sm:p-5">
          <div><p className="text-xs font-medium text-gray-500">Demo match compatibility</p><p className="mt-1 text-3xl font-black text-gray-900">{match.score}%</p></div>
          <div><p className="text-xs font-medium text-gray-500">Reward</p><p className="mt-2 text-base font-bold text-gray-900 sm:text-lg">{opportunity.amount}</p></div>
        </div>

        <section className="mt-6">
          <h3 className="text-base font-bold text-gray-900">About this opportunity</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">{opportunity.description}</p>
        </section>

        <section className="mt-6 border-t border-gray-100 pt-5">
          <h3 className="text-base font-bold text-gray-900">Why this matches you</h3>
          <ul className="mt-3 space-y-2.5">
            {matchReasons.map(reason => <li key={reason} className="flex items-start gap-2.5 text-sm text-gray-600"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" />{reason}</li>)}
            <li className="flex items-start gap-2.5 text-sm text-gray-600"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-amber-600" />Preliminary eligibility: {eligibility.status === 'possibly-eligible' ? 'some information is missing or unverified.' : eligibility.status === 'eligible' ? 'listed structured criteria appear satisfied.' : 'a structured requirement appears unmet.'}</li>
          </ul>
        </section>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-100 pt-4 text-xs font-medium text-gray-500">
          <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{opportunity.location}</span>
          <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />Deadline {formatDeadline(opportunity.deadline)}</span><DeadlineBadge deadline={opportunity.deadline} />
          <button type="button" onPointerDown={event => event.stopPropagation()} onClick={() => setShowBreakdown(true)} className="inline-flex items-center gap-1 font-bold text-[#E8192C] hover:text-[#C8111E]"><Sparkles size={14} />View Match Breakdown</button>
          <Link to={`/opportunities/${opportunity.id}`} onPointerDown={event => event.stopPropagation()} className="ml-auto font-bold text-[#E8192C] hover:text-[#C8111E]">More details</Link>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
          <button type="button" onPointerDown={event => event.stopPropagation()} onClick={onPass} className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 transition hover:border-[#E8192C] hover:text-[#E8192C]"><X size={17} />Pass</button>
          <span className="hidden text-xs font-medium text-gray-400 sm:inline">Swipe left or right</span>
          <button type="button" onPointerDown={event => event.stopPropagation()} onClick={onLike} className="inline-flex items-center gap-2 rounded-full bg-[#E8192C] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#C8111E]"><Heart size={17} />Like</button>
        </div>
      </div>
      {showBreakdown && <MatchBreakdownModal opportunity={opportunity} profile={profile} onClose={() => setShowBreakdown(false)} />}
    </motion.article>
  )
}

export default function DiscoverPage() {
  const { opportunities, profile, like, pass, loading, error, loadOpportunities, apiStatus } = useOpportunities()
  const [searchParams] = useSearchParams()
  const [category, setCategory] = useState(() => searchParams.get('category') || 'All')
  const [sort, setSort] = useState('match')
  const [eligibilityFilter, setEligibilityFilter] = useState('all')
  const [deadlineScope, setDeadlineScope] = useState('active')
  const categories = useMemo(() => ['All', ...new Set(opportunities.map(item => item.category).filter(Boolean))], [opportunities])
  const visible = useMemo(() => opportunities
    .filter(item => category === 'All' || item.category === category)
    .filter(item => deadlineScope === 'all' || (deadlineScope === 'expired' ? deadlineGroup(item.deadline) === 'closed' : deadlineGroup(item.deadline) !== 'closed'))
    .filter(item => eligibilityFilter === 'all' || evaluateEligibility(item, profile).status === eligibilityFilter)
    .sort((a, b) => sort === 'deadline' ? (a.deadline || '9999').localeCompare(b.deadline || '9999') : scoreOpportunity(b, profile).score - scoreOpportunity(a, profile).score),
  [opportunities, category, sort, eligibilityFilter, deadlineScope, profile])
  const current = visible[0]

  return <div className="min-h-screen bg-white text-gray-900">
    <ProductHeader />
    <main className="mx-auto max-w-3xl px-4 py-7 sm:px-6 sm:py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#E8192C]"><Sparkles size={15} /> Matched for you</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">Discover</h1>
        </div>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {categories.map(item => <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${category === item ? 'bg-[#E8192C] text-white' : 'border border-gray-200 bg-white text-gray-600 hover:border-[#E8192C]/50 hover:text-[#E8192C]'}`}>{item}</button>)}
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-3">
        <label className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-500">Eligibility
          <select aria-label="Filter by eligibility" value={eligibilityFilter} onChange={event => setEligibilityFilter(event.target.value)} className="ml-2 max-w-[70%] bg-transparent text-sm font-semibold text-gray-800 outline-none"><option value="all">All statuses</option><option value="eligible">Eligible</option><option value="possibly-eligible">Possibly eligible</option><option value="not-eligible">Not eligible</option></select>
        </label>
        <label className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-500">Deadlines
          <select aria-label="Filter active and expired opportunities" value={deadlineScope} onChange={event => setDeadlineScope(event.target.value)} className="ml-2 max-w-[70%] bg-transparent text-sm font-semibold text-gray-800 outline-none"><option value="active">Active only</option><option value="expired">Closed / expired</option><option value="all">All deadlines</option></select>
        </label>
        <label className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-500">Sort by
          <select aria-label="Sort opportunities" value={sort} onChange={event => setSort(event.target.value)} className="ml-2 max-w-[70%] bg-transparent text-sm font-semibold text-gray-800 outline-none"><option value="match">Highest match</option><option value="deadline">Earliest deadline</option></select>
        </label>
      </div>

      {!profile && <div className="mb-5 rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3 text-sm text-gray-700">
        <Link to="/onboarding" className="font-bold text-[#E8192C] hover:text-[#C8111E]">Complete your profile</Link> to personalize match scores and eligibility.
      </div>}

      <UpcomingDeadlinesWidget />

      {apiStatus === 'offline' && <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">The backend is unavailable. This feed requires a connection to the MatchMyOpp API.</div>}

      {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-[#C8111E]"><span>{error}</span><button onClick={loadOpportunities} className="font-bold underline">Retry</button></div>}
      <p className="mb-3 text-xs font-medium text-gray-400">{loading ? 'Loading opportunities…' : `${visible.length} opportunities in your feed`}</p>
      <AnimatePresence mode="wait">
        {current ? <SwipeCard key={current.id} opportunity={current} profile={profile} onLike={() => like(current.id)} onPass={() => pass(current.id)} /> : (
          <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-3xl border border-gray-100 bg-[#fbfaf9] px-6 py-16 text-center">
            <h2 className="text-2xl font-black text-gray-900">{loading ? 'Finding your matches…' : 'No opportunities in this feed yet'}</h2>
            <p className="mt-2 text-sm text-gray-500">{profile ? 'Check back later for new opportunities.' : 'Create or retrieve your student profile to load eligible matches.'}</p>
          </motion.div>
        )}
      </AnimatePresence>
      {current && <p className="mt-4 text-center text-sm font-medium text-gray-500">Swipe right if you’re interested <span className="px-1 text-gray-300">·</span> swipe left to pass</p>}
      <p className="mt-8 text-center text-sm text-gray-500">Know of an opportunity? <Link to="/opportunities/new" className="font-bold text-[#E8192C] hover:text-[#C8111E]">Submit it here</Link>.</p>
    </main>
  </div>
}
