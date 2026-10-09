import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, LoaderCircle, Search, UserRound } from 'lucide-react'
import { motion } from 'framer-motion'
import { LogoMark } from './LandingPage'
import { useOpportunities } from '../hooks/useOpportunities'

const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#E8192C] focus:ring-2 focus:ring-[#E8192C]/10'
const interests = ['Computer Science', 'Engineering', 'Business', 'Design', 'Medicine', 'Law', 'Mathematics', 'Arts', 'Social Sciences', 'Sustainability', 'AI / ML', 'Entrepreneurship']
const skillOptions = ['Python', 'JavaScript', 'Java', 'Data Analysis', 'Machine Learning', 'Robotics', 'Design', 'Research', 'Public Speaking', 'Leadership']

function TagPicker({ label, options, selected, onToggle }) {
  return <fieldset>
    <legend className="mb-2 text-sm font-semibold text-gray-800">{label}</legend>
    <div className="flex flex-wrap gap-2">
      {options.map(item => <button key={item} type="button" aria-pressed={selected.includes(item)} onClick={() => onToggle(item)} className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${selected.includes(item) ? 'border-[#E8192C] bg-[#E8192C] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-[#E8192C]/50 hover:text-[#E8192C]'}`}>{item}</button>)}
    </div>
  </fieldset>
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { profile, saveProfile, retrieveProfile, error, clearError } = useOpportunities()
  const [form, setForm] = useState(() => ({
    student_id: profile?.student_id ?? '',
    name: profile?.name ?? '',
    email: profile?.email ?? '',
    email_reminders_enabled: profile?.email_reminders_enabled ?? false,
    age: profile?.age ?? '',
    grade: profile?.grade ?? '',
    location: profile?.location ?? '',
  }))
  const [skills, setSkills] = useState(() => profile?.skills ?? [])
  const [selectedInterests, setSelectedInterests] = useState(() => profile?.interests ?? [])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const updateField = key => event => {
    clearError()
    setMessage('')
    setForm(current => ({ ...current, [key]: event.target.value }))
  }

  const toggle = (setter, values, value) => setter(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value])

  const handleRetrieve = async () => {
    if (!form.student_id.trim()) {
      setMessage('Enter your student ID to retrieve your profile.')
      return
    }
    setBusy(true)
    setMessage('')
    clearError()
    try {
      const loaded = await retrieveProfile(form.student_id.trim())
      setForm({
        student_id: loaded.student_id ?? '',
        name: loaded.name ?? '',
        email: loaded.email ?? '',
        email_reminders_enabled: loaded.email_reminders_enabled ?? false,
        age: loaded.age ?? '',
        grade: loaded.grade ?? '',
        location: loaded.location ?? '',
      })
      setSkills(loaded.skills ?? [])
      setSelectedInterests(loaded.interests ?? [])
      setMessage('Your saved profile has been loaded.')
    } catch {
      // The API error is shown by the shared error message below.
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = async event => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    clearError()
    const grade = form.grade.trim()
    const studentProfile = {
      student_id: form.student_id.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      email_reminders_enabled: form.email_reminders_enabled,
      age: Number(form.age),
      year: grade,
      grade,
      location: form.location.trim(),
      skills,
      interests: selectedInterests,
    }
    try {
      await saveProfile(studentProfile)
      navigate('/discover')
    } catch {
      // The shared error message tells the student what the API returned.
    } finally {
      setBusy(false)
    }
  }

  return <div className="min-h-screen bg-white text-gray-900">
    <header className="flex h-[68px] items-center justify-between border-b border-gray-100 px-6 md:px-10">
      <LogoMark />
      <Link to="/discover" className="text-sm font-semibold text-gray-600 transition hover:text-[#E8192C]">Discover opportunities <ArrowUpRight size={15} className="ml-1 inline" /></Link>
    </header>

    <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-9">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E8192C]">Your starting point</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">Build your student profile.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">Share your background and interests to see opportunities that fit your goals and eligibility.</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-7 rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_12px_40px_rgba(17,24,39,0.06)] sm:p-8">
        <div className="rounded-2xl bg-[#fbfaf9] p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2"><UserRound size={17} className="text-[#E8192C]" /><h2 className="text-sm font-bold text-gray-900">Student details</h2></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-gray-700 sm:col-span-2">Student ID
              <div className="mt-1.5 flex gap-2">
                <input className={inputClass} required value={form.student_id} onChange={updateField('student_id')} placeholder="e.g. student_001" autoComplete="off" />
                <button type="button" onClick={handleRetrieve} disabled={busy || !form.student_id.trim()} aria-label="Retrieve saved profile" className="flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 transition hover:border-[#E8192C] hover:text-[#E8192C] disabled:cursor-not-allowed disabled:opacity-50"><Search size={16} /><span className="hidden sm:inline">Retrieve</span></button>
              </div>
            </label>
            <label className="text-sm font-semibold text-gray-700">Full name
              <input className={`${inputClass} mt-1.5`} required value={form.name} onChange={updateField('name')} placeholder="Your name" autoComplete="name" />
            </label>
            <label className="text-sm font-semibold text-gray-700 sm:col-span-2">Email address
              <input className={`${inputClass} mt-1.5`} type="email" maxLength={254} required={form.email_reminders_enabled} value={form.email} onChange={updateField('email')} placeholder="you@example.com" autoComplete="email" aria-describedby="email-reminder-help" />
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 sm:col-span-2">
              <input className="mt-0.5 size-4 accent-[#E8192C]" type="checkbox" checked={form.email_reminders_enabled} onChange={event => { clearError(); setMessage(''); setForm(current => ({ ...current, email_reminders_enabled: event.target.checked })) }} />
              <span><span className="font-semibold text-gray-900">Email me about upcoming deadlines</span><span id="email-reminder-help" className="mt-1 block text-xs leading-5 text-gray-500">We’ll send reminders 7, 3, and 1 day before deadlines for opportunities you’re tracking. You can turn this off by updating your profile.</span></span>
            </label>
            <label className="text-sm font-semibold text-gray-700">Age
              <input className={`${inputClass} mt-1.5`} required type="number" min="13" max="100" value={form.age} onChange={updateField('age')} placeholder="20" />
            </label>
            <label className="text-sm font-semibold text-gray-700">Year / grade
              <select className={`${inputClass} mt-1.5`} required value={form.grade} onChange={updateField('grade')}>
                <option value="" disabled>Select your year</option>
                {['9th Grade', '10th Grade', '11th Grade', '12th Grade', '1st Year', '2nd Year', '3rd Year', '4th Year', 'Undergraduate', 'Graduate', 'Masters', 'PhD', 'Recent Graduate'].map(item => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-gray-700">Location
              <input className={`${inputClass} mt-1.5`} required value={form.location} onChange={updateField('location')} placeholder="City, country" autoComplete="address-level2" />
            </label>
          </div>
        </div>

        <TagPicker label="Skills" options={skillOptions} selected={skills} onToggle={item => toggle(setSkills, skills, item)} />
        <TagPicker label="Interests" options={interests} selected={selectedInterests} onToggle={item => toggle(setSelectedInterests, selectedInterests, item)} />

        {(error || message) && <p role={error ? 'alert' : 'status'} className={`rounded-xl px-4 py-3 text-sm ${error ? 'bg-red-50 text-[#C8111E]' : 'bg-emerald-50 text-emerald-800'}`}>{error || message}</p>}
        <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#E8192C] py-3.5 text-sm font-bold text-white transition hover:bg-[#C8111E] disabled:cursor-wait disabled:opacity-60">
          {busy ? <LoaderCircle size={17} className="animate-spin" /> : null}Save profile and discover<ArrowRight size={17} />
        </button>
      </form>
      <p className="mt-5 text-center text-xs text-gray-400">Your profile is used to filter and rank opportunities for you.</p>
    </main>
  </div>
}
