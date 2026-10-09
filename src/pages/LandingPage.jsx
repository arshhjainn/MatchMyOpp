import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronDown, ArrowUpRight } from 'lucide-react'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useLanguage } from '../hooks/useLanguage'

/* ─── animation ─── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
})

/* ─── Shared logo — adapts to dark/light ─── */
export const LogoMark = ({ dark = false }) => (
  <Link to="/" className="flex items-center select-none flex-shrink-0">
    <span
      style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
      className={`font-black text-xl ${dark ? 'text-white' : 'text-[#E8192C]'}`}
    >
      MatchMyOpp
    </span>
  </Link>
)

/* ─── NAV LINKS ─── */
const NAV_LINKS = [
  { label: 'Discover',      href: '/discover' },
  { label: 'Categories',    href: '#categories' },
  { label: 'How It Works',  href: '#how-it-works' },
  { label: 'About',         href: '#about' },
  { label: 'Support',       href: '#support' },
]

/* ─── HEADER ─── */
const Header = () => {
  const { t } = useLanguage()
  return (
  <header className="fixed top-0 left-0 right-0 z-50 bg-white">
    <div className="max-w-[1200px] mx-auto px-6 h-[68px] flex items-center justify-between gap-4">

      {/* Logo */}
      <LogoMark />

      {/* Centre nav */}
      <nav className="hidden lg:flex items-center gap-7 flex-1 justify-center">
        {NAV_LINKS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className="text-[15px] font-medium text-gray-800 hover:text-[#E8192C] transition-colors duration-150 whitespace-nowrap"
          >
            {t(label)}
          </a>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <LanguageSwitcher className="hidden md:flex text-gray-800 hover:text-gray-600" />

        {/* Get Started — red pill like Tinder's "Log in" */}
        <Link
          to="/onboarding"
          className="px-5 py-2.5 bg-[#E8192C] hover:bg-[#C8111E] text-white text-[15px] font-bold rounded-full transition-colors duration-200"
        >
          {t('Get Started')}
        </Link>
      </div>

    </div>
  </header>
  )
}

/* ─── HERO ─── */
const Hero = () => {
  const { t } = useLanguage()
  return (
  <section className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-6 pt-[68px]">

    {/* ── Headline — matches Tinder's oversized bold italic serif ── */}
    <motion.h1
      {...fadeUp(0.1)}
      style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontStyle: 'italic',
        fontWeight: 900,
        letterSpacing: '-0.01em',
        lineHeight: 1.04,
        color: '#E8192C',
      }}
      className="text-[clamp(3.2rem,8vw,6.5rem)] max-w-4xl mb-10"
    >
      {t('Your Next Opportunity')}<br />
      {t('Starts With a Match.')}
    </motion.h1>

    {/* ── Two CTA buttons — gray + black pills ── */}
    <motion.div {...fadeUp(0.22)} className="flex flex-col sm:flex-row items-center gap-3 mb-14">
      {/* "Get the app" equivalent — light pill */}
      <Link
        to="/discover"
        className="px-8 py-[14px] rounded-full bg-[#f0eeee] hover:bg-[#e5e3e3] text-gray-900 text-[15px] font-semibold transition-colors duration-200 min-w-[180px]"
      >
        {t('Explore Opportunities')}
      </Link>

      {/* "Create account" equivalent — dark pill */}
      <Link
        to="/onboarding"
        className="px-8 py-[14px] rounded-full bg-[#21243d] hover:bg-[#16192e] text-white text-[15px] font-semibold transition-colors duration-200 min-w-[180px]"
      >
        {t('Create Your Profile')}
      </Link>
    </motion.div>

    {/* ── Bottom caption — matches Tinder's "Someone might give you butterflies" ── */}
    <motion.div {...fadeUp(0.35)} className="text-center">
      <p className="text-[14px] text-gray-500 font-normal leading-relaxed">
        {t('Discover scholarships, hackathons, internships, and competitions tailored to your ambitions.')}
      </p>
      <p className="text-[14px] text-gray-500 font-normal mt-0.5 flex items-center justify-center gap-1">
        {t('Your next big opportunity is one match away.')}
        <ChevronDown size={14} className="inline-block animate-bounce" />
      </p>
    </motion.div>

  </section>
  )
}

/* ─── OPPORTUNITY CATEGORIES ─── */
const CATEGORIES = [
  { name: 'Scholarship', label: 'Scholarships', icon: '🎓', description: 'Funding for your next step' },
  { name: 'Hackathon', label: 'Hackathons', icon: '💡', description: 'Build ideas with a team' },
  { name: 'Internship', label: 'Internships', icon: '🚀', description: 'Get hands-on experience' },
  { name: 'Research', label: 'Research', icon: '🔬', description: 'Explore questions that matter' },
  { name: 'Fellowship', label: 'Fellowships', icon: '🌟', description: 'Grow with expert support' },
  { name: 'Grant', label: 'Grants', icon: '🌱', description: 'Bring a project to life' },
]

const Categories = () => {
  const { t } = useLanguage()
  return (
  <section id="categories" className="scroll-mt-20 border-t border-gray-100 bg-[#fbfaf9] px-6 py-24">
    <div className="mx-auto max-w-5xl">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E8192C]">{t('Find your next step')}</p>
          <h2
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 800, color: '#E8192C' }}
            className="mt-2 text-[clamp(2rem,4vw,3.5rem)] tracking-tight"
          >{t('Explore by category')}</h2>
        </div>
        <Link to="/discover" className="inline-flex items-center gap-1 text-sm font-bold text-gray-600 transition hover:text-[#E8192C]">{t('Browse all')} <ArrowUpRight size={16} /></Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map(({ name, label, icon, description }, index) => (
          <motion.div key={name} {...fadeUp(index * 0.04)}>
            <Link to={`/discover?category=${encodeURIComponent(name)}`} className="group flex h-full items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_4px_20px_rgba(17,24,39,0.03)] transition hover:-translate-y-0.5 hover:border-[#E8192C]/30 hover:shadow-[0_10px_28px_rgba(17,24,39,0.08)]">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fbfaf9] text-2xl">{icon}</span>
              <span className="min-w-0 flex-1"><span className="block font-extrabold text-gray-900 group-hover:text-[#E8192C]">{t(label)}</span><span className="mt-1 block text-sm text-gray-500">{t(description)}</span></span>
              <ArrowUpRight size={17} className="shrink-0 text-gray-300 transition group-hover:text-[#E8192C]" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
  )
}

/* ─── HOW IT WORKS ─── */
const HowItWorks = () => {
  const { t } = useLanguage()
  return (
  <section id="how-it-works" className="py-28 px-6 bg-white border-t border-gray-100">
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h2
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 800, color: '#E8192C' }}
          className="text-[clamp(2rem,4vw,3.5rem)] tracking-tight"
        >
          {t('Three steps to your next opportunity')}
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { n: '01', emoji: '📋', title: 'Build your profile', desc: 'Tell us your field, year, and goals. Takes 2 minutes.' },
          { n: '02', emoji: '⚡', title: 'Get matched', desc: 'Our AI ranks opportunities by how well they fit your profile and deadlines.' },
          { n: '03', emoji: '🎯', title: 'Swipe & apply', desc: 'Like, save, or pass. Track every application from one clean dashboard.' },
        ].map(({ n, emoji, title, desc }, i) => (
          <motion.div
            key={n}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.1 }}
            className="text-left"
          >
            <span className="block text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-3">{n}</span>
            <span className="text-3xl block mb-3">{emoji}</span>
            <h3 className="text-base font-bold text-gray-900 mb-1.5">{t(title)}</h3>
            <p className="text-[14px] text-gray-500 leading-relaxed">{t(desc)}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
  )
}

/* ─── ABOUT ─── */
const About = () => {
  const { t } = useLanguage()
  return (
  <section id="about" className="scroll-mt-20 border-t border-gray-100 bg-[#fbfaf9] px-6 py-24">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-3xl text-center"
    >
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E8192C]">{t('About MatchMyOpp')}</p>
      <h2
        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 800, color: '#E8192C' }}
        className="mt-3 text-[clamp(2rem,4vw,3.5rem)] tracking-tight"
      >{t('More chances to do what you love.')}</h2>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-600">
        {t('Students shouldn’t have to search all over the internet to find opportunities that fit. MatchMyOpp brings scholarships, research, internships, and competitions together, then helps you keep track of the ones you care about.')}
      </p>
      <Link to="/discover" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#21243d] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#16192e]">{t('See how it works')} <ArrowUpRight size={16} /></Link>
    </motion.div>
  </section>
  )
}

/* ─── SUPPORT ─── */
const Support = () => {
  const { t } = useLanguage()
  return (
  <section id="support" className="scroll-mt-20 border-t border-gray-100 bg-white px-6 py-24">
    <div className="mx-auto max-w-5xl">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E8192C]">{t('Support')}</p>
        <h2
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 800, color: '#E8192C' }}
          className="mt-3 text-[clamp(2rem,4vw,3.5rem)] tracking-tight"
        >{t('Need a hand getting started?')}</h2>
        <p className="mt-4 text-sm leading-6 text-gray-500">{t('Here are the quickest ways to get help using MatchMyOpp.')}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: 'Set up your profile', detail: 'Add your grade, location, skills, and interests to get relevant matches.', to: '/onboarding', action: 'Create a profile' },
          { title: 'Find opportunities', detail: 'Browse the feed, filter by category, and swipe to save opportunities you like.', to: '/discover', action: 'Open Discover' },
          { title: 'Track your progress', detail: 'Keep application statuses and notes together in your tracker.', to: '/applications', action: 'View tracker' },
        ].map(({ title, detail, to, action }) => (
          <article key={title} className="rounded-2xl border border-gray-100 bg-[#fbfaf9] p-6">
            <h3 className="font-extrabold text-gray-900">{t(title)}</h3>
            <p className="mt-2 min-h-12 text-sm leading-6 text-gray-500">{t(detail)}</p>
            <Link to={to} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#E8192C] hover:text-[#C8111E]">{t(action)} <ArrowUpRight size={15} /></Link>
          </article>
        ))}
      </div>
    </div>
  </section>
  )
}

/* ─── BOTTOM CTA ─── */
const BottomCTA = () => {
  const { t } = useLanguage()
  return (
  <section className="py-28 px-6 bg-white border-t border-gray-100">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      className="max-w-2xl mx-auto text-center"
    >
      <h2
        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 800, color: '#E8192C' }}
        className="text-[clamp(2rem,4vw,3.5rem)] tracking-tight mb-5"
      >
        {t('Ready for your match?')}
      </h2>
      <p className="text-gray-500 text-[15px] mb-8">{t('Free forever. No credit card required.')}</p>
      <Link
        to="/onboarding"
        className="inline-block px-10 py-[14px] rounded-full bg-[#21243d] hover:bg-[#16192e] text-white text-[15px] font-semibold transition-colors duration-200"
      >
        {t('Create your profile')}
      </Link>
    </motion.div>
  </section>
  )
}

/* ─── FOOTER ─── */
const Footer = () => (
  <footer className="border-t border-gray-100 py-8 px-6 bg-white">
    <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <LogoMark />
      <p className="text-gray-400 text-[13px]">© 2025 MatchMyOpp. Built for students.</p>
      <div className="flex gap-6">
        {['Privacy', 'Terms', 'Contact'].map(l => (
          <a key={l} href="#" className="text-gray-400 hover:text-gray-700 text-[13px] transition-colors">{l}</a>
        ))}
      </div>
    </div>
  </footer>
)

/* ─── PAGE ─── */
export default function LandingPage() {
  return (
    <div className="bg-white text-gray-900 overflow-x-hidden">
      <Header />
      <Hero />
      <Categories />
      <HowItWorks />
      <About />
      <Support />
      <BottomCTA />
      <Footer />
    </div>
  )
}
