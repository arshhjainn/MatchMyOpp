import { ChevronDown, Globe } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'

export default function LanguageSwitcher({ className = '' }) {
  const { language, setLanguage, t } = useLanguage()
  return <label className={`inline-flex items-center gap-1.5 ${className}`}>
    <Globe size={15} aria-hidden="true" />
    <span className="sr-only">{t('Language')}</span>
    <select
      aria-label={t('Language')}
      value={language}
      onChange={event => setLanguage(event.target.value)}
      className="max-w-24 cursor-pointer appearance-none bg-transparent text-sm font-medium outline-none"
    >
      <option value="en">English</option>
      <option value="hi">हिन्दी</option>
    </select>
    <ChevronDown size={13} aria-hidden="true" className="-ml-1 pointer-events-none" />
  </label>
}
