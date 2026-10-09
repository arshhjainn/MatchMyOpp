import { Link, NavLink } from 'react-router-dom'
import { LogoMark } from '../pages/LandingPage'
import { useOpportunities } from '../hooks/useOpportunities'
import { useLanguage } from '../hooks/useLanguage'
import LanguageSwitcher from './LanguageSwitcher'

const linkClass = ({ isActive }) => `text-sm font-semibold transition-colors ${isActive ? 'text-[#E8192C]' : 'text-gray-600 hover:text-gray-900'}`

export default function ProductHeader() {
  const { apiStatus } = useOpportunities()
  const { t } = useLanguage()
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-5 md:gap-5 md:px-8">
        <LogoMark />
        <nav className="flex items-center gap-3 sm:gap-5 xl:gap-8">
          <NavLink to="/discover" className={`${linkClass} hidden sm:inline-flex`}>{t('Discover')}</NavLink>
          <NavLink to="/saved" className={`${linkClass} hidden xl:inline-flex`}>{t('Saved')}</NavLink>
          <NavLink to="/applications" className={`${linkClass} hidden xl:inline-flex`}>{t('Applications')}</NavLink>
          <NavLink to="/deadlines" className={`${linkClass} hidden lg:inline-flex`}>Deadline Radar</NavLink>
          <NavLink to="/import-pdf" className={`${linkClass} hidden xl:inline-flex`}>Import PDF</NavLink>
        </nav>
        <details className="relative xl:hidden">
          <summary className="cursor-pointer list-none rounded-full border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600">More</summary>
          <div className="absolute right-0 top-11 z-50 min-w-44 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
            <Link to="/discover" className="block rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#E8192C]">{t('Discover')}</Link>
            <Link to="/saved" className="block rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#E8192C]">{t('Saved')}</Link>
            <Link to="/applications" className="block rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#E8192C]">{t('Applications')}</Link>
            <Link to="/deadlines" className="block rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#E8192C]">Deadline Radar</Link>
            <Link to="/import-pdf" className="block rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#E8192C]">Import PDF</Link>
          </div>
        </details>
        <div className="flex items-center gap-3">
          <LanguageSwitcher className="text-gray-600" />
          <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer" className="hidden text-xs font-semibold text-gray-500 hover:text-[#E8192C] md:inline">API docs ↗</a>
          <span title={`API ${apiStatus}`} className="hidden items-center gap-1.5 text-xs font-medium text-gray-500 lg:flex"><span className={`h-2 w-2 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500' : apiStatus === 'offline' ? 'bg-red-500' : 'bg-amber-400'}`} />{apiStatus === 'online' ? 'API online' : apiStatus === 'offline' ? 'API offline' : 'Connecting'}</span>
          <Link to="/onboarding" className="hidden rounded-full bg-[#E8192C] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#C8111E] sm:inline-flex">{t('Your profile')}</Link>
        </div>
      </div>
    </header>
  )
}
