import { Bookmark } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductHeader from '../components/ProductHeader'
import OpportunityCard from '../components/OpportunityCard'
import { useOpportunities } from '../hooks/useOpportunities'

export default function SavedPage() {
  const { profile, saved, error, loadSaved } = useOpportunities()
  return <div className="min-h-screen bg-[#fbfaf9] text-gray-900">
    <ProductHeader />
    <main className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <p className="flex items-center gap-2 text-sm font-bold text-[#E8192C]"><Bookmark size={16} /> YOUR SHORTLIST</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl">Saved opportunities.</h1>
      <p className="mt-3 text-gray-500">Opportunities you liked are saved here for easy access.</p>
      {error && <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-[#C8111E]"><span>{error}</span><button onClick={loadSaved} className="font-bold underline">Retry</button></div>}
      {!profile ? <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center"><h2 className="text-lg font-bold">Set up your student profile first</h2><Link to="/onboarding" className="mt-5 inline-flex rounded-full bg-[#E8192C] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#C8111E]">Create profile</Link></div>
        : saved.length ? <div className="mt-8 grid gap-5 lg:grid-cols-2">{saved.map(item => <OpportunityCard key={item.id} opportunity={item} actions={false} />)}</div>
          : <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center"><Bookmark className="mx-auto text-gray-300" size={28} /><h2 className="mt-3 text-lg font-bold text-gray-900">No liked opportunities yet</h2><p className="mt-1 text-sm text-gray-500">Swipe right on an opportunity to save it here.</p><Link to="/discover" className="mt-5 inline-flex rounded-full bg-[#E8192C] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#C8111E]">Explore opportunities</Link></div>}
    </main>
  </div>
}
