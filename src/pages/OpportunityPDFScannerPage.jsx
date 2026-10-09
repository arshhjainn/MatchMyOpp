import { useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, LoaderCircle, Pencil, ScanSearch, UploadCloud, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductHeader from '../components/ProductHeader'
import { PDF_DRAFTS_KEY, processPdfDemo } from '../services/demoPdfScanner'

const emptyForm = { title: '', organizer: '', category: '', description: '', eligibility: '', requiredSkills: '', deadline: '', reward: '', location: '', applicationUrl: '' }
const labels = { title: 'Opportunity title', organizer: 'Organizer', category: 'Category', description: 'Description', eligibility: 'Eligibility requirements', requiredSkills: 'Required skills', deadline: 'Deadline', reward: 'Reward or scholarship amount', location: 'Location or remote availability', applicationUrl: 'Official application URL' }
const inputClass = 'mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-[#E8192C] focus:ring-2 focus:ring-[#E8192C]/10 disabled:bg-gray-50 disabled:text-gray-600'

export default function OpportunityPDFScannerPage() {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('empty')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [saved, setSaved] = useState(false)

  const selectFile = async candidate => {
    if (!candidate) return
    setError('')
    setSaved(false)
    if (candidate.type !== 'application/pdf' && !candidate.name.toLowerCase().endsWith('.pdf')) {
      setFile(null); setStage('invalid'); setError('That file is not a PDF. Please choose a .pdf file.'); return
    }
    setFile(candidate); setForm(emptyForm); setProgress(0); setStage('processing'); setPreview(false)
    try {
      const result = await processPdfDemo(candidate, setProgress)
      setForm(result)
      setStage('review')
    } catch (cause) {
      setStage('error'); setError(cause.message || 'The demo preview could not be prepared.')
    }
  }

  const setValue = key => event => setForm(current => ({ ...current, [key]: event.target.value }))
  const cancel = () => { setFile(null); setForm(emptyForm); setProgress(0); setStage('empty'); setError(''); setPreview(false); setSaved(false); if (inputRef.current) inputRef.current.value = '' }
  const saveDraft = () => {
    try {
      const existing = JSON.parse(localStorage.getItem(PDF_DRAFTS_KEY) || '[]')
      const draft = { ...form, id: crypto.randomUUID?.() ?? `pdf-${Date.now()}`, fileName: file?.name ?? '', savedAt: new Date().toISOString(), mode: 'demo' }
      localStorage.setItem(PDF_DRAFTS_KEY, JSON.stringify([draft, ...existing]))
      setSaved(true)
    } catch {
      setError('Could not save this demo draft on this device. Check available browser storage and try again.')
    }
  }
  const handleDrop = event => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files?.[0]) }

  return <div className="min-h-screen bg-[#fbfaf9] text-gray-900"><ProductHeader /><main className="mx-auto max-w-4xl px-5 py-9 md:px-8 md:py-12">
    <Link to="/discover" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#E8192C]"><ArrowLeft size={16} />Back to Discover</Link>
    <p className="mt-7 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#E8192C]"><ScanSearch size={15} />Opportunity intake</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Import an opportunity PDF</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Review announcement details in one place. This demo does not extract text from or upload your PDF.</p>
    <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900"><strong>Demo extraction mode:</strong> selecting a PDF shows sample fields and simulated progress. The file contents are not read or sent to the backend. Saved drafts stay in this browser only.</div>
    <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="sr-only" aria-label="Choose opportunity PDF" onChange={event => selectFile(event.target.files?.[0])} />
    {stage === 'empty' || stage === 'invalid' || stage === 'error' ? <button type="button" onClick={() => inputRef.current?.click()} onDragOver={event => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} className={`mt-6 flex min-h-48 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-white px-6 text-center transition ${dragging ? 'border-[#E8192C] bg-red-50' : 'border-gray-200 hover:border-red-200'}`}><UploadCloud size={30} className="text-[#E8192C]" /><span className="mt-3 font-bold text-gray-900">Drag and drop a PDF here</span><span className="mt-1 text-sm text-gray-500">or choose a file · PDF only</span><span className="mt-3 rounded-full bg-[#E8192C] px-4 py-2 text-sm font-bold text-white">Select PDF</span></button> : null}
    {error && <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-[#C8111E]"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</p>}
    {file && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4"><span className="flex items-center gap-3"><span className="rounded-xl bg-red-50 p-2 text-[#E8192C]"><FileText size={19} /></span><span><strong className="block text-sm text-gray-800">{file.name}</strong><span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span></span></span><button type="button" onClick={cancel} aria-label="Remove selected PDF" className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={17} /></button></div>}
    {stage === 'processing' && <div role="status" aria-live="polite" className="mt-5 rounded-2xl border border-gray-100 bg-white p-5"><div className="flex items-center gap-2 text-sm font-bold text-gray-800"><LoaderCircle className="animate-spin text-[#E8192C]" size={17} />Preparing a sample extraction preview…</div><div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#E8192C] transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-xs text-gray-500">Simulated progress {progress}% · PDF text is not being read</p></div>}
    {stage === 'review' && <section className="mt-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_10px_35px_rgba(17,24,39,0.05)] sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-black text-gray-950">Review sample fields</h2><p className="mt-1 text-sm text-gray-500">Empty fields are marked for manual review before use.</p></div><button type="button" onClick={() => setPreview(value => !value)} className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:border-[#E8192C] hover:text-[#E8192C]">{preview ? <Pencil size={15} /> : <FileText size={15} />}{preview ? 'Edit fields' : 'Preview'}</button></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{Object.entries(labels).map(([key, label]) => <label key={key} className={`text-sm font-semibold text-gray-700 ${['description', 'eligibility', 'requiredSkills'].includes(key) ? 'sm:col-span-2' : ''}`}>{label}{key === 'description' || key === 'eligibility' || key === 'requiredSkills' ? <textarea rows={key === 'description' ? 3 : 2} value={form[key]} onChange={setValue(key)} disabled={preview} className={`${inputClass} resize-y`} placeholder="Needs manual review" /> : <input type={key === 'deadline' ? 'date' : 'text'} value={form[key]} onChange={setValue(key)} disabled={preview} className={inputClass} placeholder="Needs manual review" />}{!form[key] && <span className="mt-1 block text-xs font-medium text-amber-700">Missing · verify from the original announcement</span>}</label>)}</div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5"><div>{saved && <span role="status" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700"><CheckCircle2 size={16} />Demo draft saved locally; not published to opportunities.</span>}</div><div className="flex flex-wrap gap-2"><button type="button" onClick={cancel} className="rounded-full border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button><button type="button" onClick={saveDraft} className="rounded-full bg-[#E8192C] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#C8111E]">Save demo draft</button></div></div>
    </section>}
  </main></div>
}
