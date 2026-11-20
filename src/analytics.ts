/*
 * Google Analytics 4, off unless both of these are true:
 *
 *   1. VITE_GA_MEASUREMENT_ID is set when the site is built (e.g. G-XXXXXXXXXX)
 *   2. the visitor accepted it in the banner (components/Consent.tsx)
 *
 * Until then no Google script is loaded and nothing is stored. Page views are
 * sent by hand on every navigation (this is a single-page app, so GA's
 * automatic page view would only fire once).
 */

export const GA_ID: string | undefined = import.meta.env.VITE_GA_MEASUREMENT_ID || undefined

const CONSENT_KEY = 'trevor-consent'
export type Consent = 'granted' | 'denied' | null

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function getConsent(): Consent {
  try {
    const value = localStorage.getItem(CONSENT_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

let loaded = false

function load() {
  if (loaded || !GA_ID) return
  loaded = true
  window.dataLayer = window.dataLayer || []
  // gtag.js expects the raw `arguments` object, not an array
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, { send_page_view: false })
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`
  document.head.appendChild(script)
}

/** Call once on start: loads GA only for visitors who already accepted */
export function initAnalytics() {
  if (GA_ID && getConsent() === 'granted') load()
}

export function setConsent(choice: 'granted' | 'denied') {
  try {
    localStorage.setItem(CONSENT_KEY, choice)
  } catch {
    // Storage blocked: the choice simply lasts for this visit
  }
  if (!GA_ID) return
  // Google's documented switch for turning measurement off on this page
  ;(window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = choice === 'denied'
  if (choice === 'granted') {
    load()
    trackPageView(location.pathname, document.title)
  }
}

export function trackPageView(path: string, title: string) {
  if (!loaded) return
  window.gtag?.('event', 'page_view', { page_path: path, page_title: title, page_location: location.origin + path })
}

/** e.g. trackEvent('copy_code') or trackEvent('visit_stake', { platform: 'us' }) */
export function trackEvent(name: string, params: Record<string, string | number> = {}) {
  if (!loaded) return
  window.gtag?.('event', name, params)
}
