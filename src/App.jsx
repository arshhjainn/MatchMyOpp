import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import OnboardingPage from './pages/OnboardingPage'
import DiscoverPage from './pages/DiscoverPage'
import SavedPage from './pages/SavedPage'
import OpportunityDetailPage from './pages/OpportunityDetailPage'
import ApplicationsPage from './pages/ApplicationsPage'
import CreateOpportunityPage from './pages/CreateOpportunityPage'
import { OpportunityProvider } from './context/OpportunityProvider'
import { LanguageProvider } from './context/LanguageContext'

export default function App() {
  return (
    <LanguageProvider>
      <OpportunityProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/login" element={<ComingSoon page="Sign In" />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
          <Route path="/opportunities/new" element={<CreateOpportunityPage />} />
          </Routes>
        </BrowserRouter>
      </OpportunityProvider>
    </LanguageProvider>
  )
}

/* Temporary placeholder for unbuilt pages */
function ComingSoon({ page }) {
  return (
    <div className="min-h-screen bg-[#0d0d14] flex flex-col items-center justify-center text-white gap-4">
      <div className="text-5xl mb-2">🚀</div>
      <h1 className="text-2xl font-bold">{page}</h1>
      <p className="text-white/40 text-sm">Coming soon — this page is next in the build queue.</p>
      <a href="/" className="mt-4 px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-colors">
        ← Back to Home
      </a>
    </div>
  )
}
