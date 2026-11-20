import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { HomePage } from './pages/HomePage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { SignUpPage } from './pages/SignUpPage'
import { MediaPage } from './pages/MediaPage'
import { PrivacyPage, TermsPage } from './pages/LegalPages'
import { useScrollReveal } from './hooks'

const TITLES: Record<string, string> = {
  '/': 'Trevor Abney — $50,000 Monthly Leaderboard',
  '/leaderboard': 'Leaderboard — Trevor Abney',
  '/how-to-sign-up': 'How to Sign Up — Trevor Abney',
  '/media': 'Media — Trevor Abney',
  '/terms': 'Terms of Service — Trevor Abney',
  '/privacy': 'Privacy Policy — Trevor Abney',
}

/** New page: start at the top (or at #anchor) and update the tab title */
function useRouteEffects() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    document.title = TITLES[pathname] ?? TITLES['/']
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return pathname
}

export default function App() {
  const pathname = useRouteEffects()
  useScrollReveal(pathname)
  return (
    <>
      <Navbar />
      {/* Keyed by page, so each page fades in when you navigate to it */}
      <div key={pathname} className="page-transition">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/how-to-sign-up" element={<SignUpPage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
    </>
  )
}
