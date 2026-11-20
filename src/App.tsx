import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { PAGES, pageSeo } from '../shared/seo'
import { initAnalytics, trackPageView } from './analytics'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { ConsentBanner } from './components/ui'
import { HomePage } from './pages/HomePage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { SignUpPage } from './pages/SignUpPage'
import { MediaPage } from './pages/MediaPage'
import { ContactPage } from './pages/ContactPage'
import { PrivacyPage, TermsPage } from './pages/LegalPages'
import { NotFoundPage } from './pages/NotFoundPage'
import { useScrollReveal } from './hooks'

/**
 * On every page change: keep the title, description and canonical link in
 * step with the page (each page's own HTML already carries them on first
 * load), count the page view, and start at the top or at the #anchor.
 */
function useRouteEffects() {
  const { pathname, hash } = useLocation()

  useEffect(() => initAnalytics(), [])

  useEffect(() => {
    const seo = pageSeo(pathname)
    document.title = seo.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', seo.description)
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical && pathname in PAGES) canonical.href = new URL(pathname, canonical.href).href
    trackPageView(pathname, seo.title)
  }, [pathname])

  useEffect(() => {
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
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      <Footer />
      <ConsentBanner />
    </>
  )
}
