import { useState } from 'react'
import { ArrowLeft, ArrowRight, LoaderCircle, Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import ProductHeader from '../components/ProductHeader'
import { api } from '../api/client'
import { useOpportunities } from '../hooks/useOpportunities'

const inputClass = 'mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#E8192C] focus:ring-2 focus:ring-[#E8192C]/10'

export default function CreateOpportunityPage() {
  const navigate = useNavigate()
  const { loadOpportunities } = useOpportunities()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', category: '', description: '', requiredSkills: '', eligibleGrades: '', minAge: '', maxAge: '', location: '', deadline: '', reward: '', applicationUrl: '' })
  const set = key => event => setForm(current => ({ ...current, [key]: event.target.value }))

  const submit = async event => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.createOpportunity({
        title: form.title.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        required_skills: form.requiredSkills.split(',').map(item => item.trim()).filter(Boolean),
        eligible_grades: form.eligibleGrades.split(',').map(item => item.trim()).filter(Boolean),
        min_age: form.minAge ? Number(form.minAge) : null,
        max_age: form.maxAge ? Number(form.maxAge) : null,
        location: form.location.trim(),
        deadline: form.deadline || null,
        reward: form.reward.trim(),
        application_url: form.applicationUrl.trim(),
      })
      await loadOpportunities()
      navigate('/discover')
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  return <div className="min-h-screen bg-[#fbfaf9] text-gray-900">
    <ProductHeader />
    <main className="mx-auto max-w-3xl px-5 py-9 sm:px-8 sm:py-12">
      <Link to="/discover" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#E8192C]"><ArrowLeft size={16} /> Back to discover</Link>
      <p className="mt-7 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#E8192C]"><Plus size={15} /> ORGANIZER SUBMISSION</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">Add an opportunity.</h1>
      <p className="mt-3 text-sm leading-6 text-gray-500">Share a real opportunity with students. The backend will use eligibility details to find the right matches.</p>
      <form onSubmit={submit} className="mt-7 space-y-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_12px_40px_rgba(17,24,39,0.05)] sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-gray-700">Opportunity title<input required className={inputClass} value={form.title} onChange={set('title')} placeholder="Young Innovators Challenge" /></label>
          <label className="text-sm font-semibold text-gray-700">Category<input required className={inputClass} value={form.category} onChange={set('category')} placeholder="STEM Competition" /></label>
        </div>
        <label className="block text-sm font-semibold text-gray-700">Description<textarea required rows={4} className={inputClass} value={form.description} onChange={set('description')} placeholder="What will students do or receive?" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-gray-700">Required skills<input className={inputClass} value={form.requiredSkills} onChange={set('requiredSkills')} placeholder="Robotics, Python, teamwork" /><span className="mt-1 block text-xs font-normal text-gray-400">Separate skills with commas.</span></label>
          <label className="text-sm font-semibold text-gray-700">Eligible grades<input className={inputClass} value={form.eligibleGrades} onChange={set('eligibleGrades')} placeholder="11th Grade, 12th Grade, Undergraduate" /><span className="mt-1 block text-xs font-normal text-gray-400">Separate grades with commas.</span></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-gray-700">Minimum age<input type="number" min="13" max="100" className={inputClass} value={form.minAge} onChange={set('minAge')} placeholder="Optional" /></label>
          <label className="text-sm font-semibold text-gray-700">Maximum age<input type="number" min="13" max="100" className={inputClass} value={form.maxAge} onChange={set('maxAge')} placeholder="Optional" /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-gray-700">Location<input required className={inputClass} value={form.location} onChange={set('location')} placeholder="Remote or city, country" /></label>
          <label className="text-sm font-semibold text-gray-700">Deadline<input type="date" className={inputClass} value={form.deadline} onChange={set('deadline')} /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-gray-700">Reward<input className={inputClass} value={form.reward} onChange={set('reward')} placeholder="$5,000 and mentorship" /></label>
          <label className="text-sm font-semibold text-gray-700">Application URL<input type="url" required className={inputClass} value={form.applicationUrl} onChange={set('applicationUrl')} placeholder="https://example.org/apply" /></label>
        </div>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-[#C8111E]">{error}</p>}
        <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E8192C] py-3.5 text-sm font-bold text-white transition hover:bg-[#C8111E] disabled:cursor-wait disabled:opacity-60">{busy ? <LoaderCircle size={17} className="animate-spin" /> : null}Submit opportunity<ArrowRight size={17} /></button>
      </form>
    </main>
  </div>
}
