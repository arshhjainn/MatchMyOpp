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
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-5 px-5 md:px-8">
        <LogoMark />
        <nav className="flex items-center gap-5 sm:gap-8">
          <NavLink to="/discover" className={linkClass}>{t('Discover')}</NavLink>
          <NavLink to="/saved" className={linkClass}>{t('Saved')}</NavLink>
          <NavLink to="/applications" className={linkClass}>{t('Applications')}</NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher className="text-gray-600" />
          <a href="https://matchmyopp-1.onrender.com/docs" target="_blank" rel="noreferrer" className="hidden text-xs font-semibold text-gray-500 hover:text-[#E8192C] md:inline">API docs ↗</a>
          <span title={`API ${apiStatus}`} className="hidden items-center gap-1.5 text-xs font-medium text-gray-500 lg:flex"><span className={`h-2 w-2 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500' : apiStatus === 'offline' ? 'bg-red-500' : 'bg-amber-400'}`} />{apiStatus === 'online' ? 'API online' : apiStatus === 'offline' ? 'API offline' : 'Connecting'}</span>
          <Link to="/onboarding" className="hidden rounded-full bg-[#E8192C] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#C8111E] sm:inline-flex">{t('Your profile')}</Link>
        </div>
      </div>
    </header>
  )
}
