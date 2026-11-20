import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { AnimationEvent, CSSProperties, ReactNode } from 'react'
import type { LeaderboardResponse } from '../shared/leaderboard'
import type { KickStatus } from '../shared/site'

/**
 * Shared hover animation (ported from kingkulbik): idle → in → held → out → idle.
 * The element animates one registered CSS property, --hover, from 0 to 1 and
 * back (see .hover-anim in styles.css), and its styles derive from var(--hover).
 * Each "in" / "out" run always plays to completion, so quick passes of the
 * pointer never make the motion snap.
 */
export type HoverPhase = 'idle' | 'in' | 'held' | 'out'

export function useHoverAnimation() {
  const [phase, setPhase] = useState<HoverPhase>('idle')
  const hovered = useRef(false)
  const focused = useRef(false)

  const isActive = () => hovered.current || focused.current

  const activate = useCallback(() => {
    setPhase((p) => (p === 'idle' ? 'in' : p))
  }, [])

  const deactivate = useCallback(() => {
    if (isActive()) return
    setPhase((p) => (p === 'held' ? 'out' : p))
  }, [])

  // Only the root element's own animation drives the phase; child animations bubble up and are ignored
  const onAnimationEnd = useCallback((e: AnimationEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return
    setPhase((p) => {
      if (p === 'in') return isActive() ? 'held' : 'out'
      if (p === 'out') return isActive() ? 'in' : 'idle'
      return p
    })
  }, [])

  const handlers = {
    onMouseEnter: () => {
      hovered.current = true
      activate()
    },
    onMouseLeave: () => {
      hovered.current = false
      deactivate()
    },
    onFocus: () => {
      focused.current = true
      activate()
    },
    onBlur: () => {
      focused.current = false
      deactivate()
    },
    onAnimationEnd,
  }

  return { phase, handlers, hoverClass: `hover-anim hover-anim--${phase}` }
}

/**
 * Scroll animations: every element with a data-reveal attribute fades and
 * slides in the first time it scrolls into view (variants and delays in
 * styles.css). Elements added later — e.g. rows from "View more" — are picked
 * up too. With reduced motion everything is simply shown.
 */
/** style={delay(120)} → this element's reveal starts 120ms after it scrolls into view */
export const delay = (ms: number) => ({ '--reveal-delay': `${ms}ms` }) as CSSProperties

export function useScrollReveal(key: string) {
  useEffect(() => {
    document.documentElement.classList.add('reveal-ready')
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.remove('reveal-ready')
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          // An attribute, not a class: React rewrites className on re-render (e.g. hover phases)
          const el = entry.target
          el.setAttribute('data-revealed', '')
          io.unobserve(el)
          // Once the animation has played, drop the reveal styling altogether, so nothing
          // (translate, scale, transition) lingers on the element and it renders like plain content
          const wait = parseFloat(getComputedStyle(el).getPropertyValue('--reveal-delay')) || 0
          window.setTimeout(() => {
            el.removeAttribute('data-reveal')
            el.removeAttribute('data-revealed')
          }, wait + 1400)
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.12 },
    )
    const watch = (scope: Element | Document) => {
      if (scope instanceof Element && scope.matches('[data-reveal]:not([data-revealed])')) io.observe(scope)
      scope.querySelectorAll('[data-reveal]:not([data-revealed])').forEach((el) => io.observe(el))
    }
    watch(document)

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) m.addedNodes.forEach((node) => node instanceof Element && watch(node))
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [key])
}

const REFRESH_MS = 60_000

export type LeaderboardState =
  | { status: 'loading'; data?: undefined }
  | { status: 'ready'; data: LeaderboardResponse }
  | { status: 'error'; data?: LeaderboardResponse }

// Last good response, shared by every page so navigating doesn't flash empty rows
let lastGood: LeaderboardResponse | undefined

/** Live standings from /api/leaderboard, refreshed every minute */
export function useLeaderboard(): LeaderboardState {
  const [state, setState] = useState<LeaderboardState>(() =>
    lastGood ? { status: 'ready', data: lastGood } : { status: 'loading' },
  )

  useEffect(() => {
    let abort = new AbortController()

    const load = async () => {
      abort.abort()
      abort = new AbortController()
      try {
        const res = await fetch('/api/leaderboard', { signal: abort.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as LeaderboardResponse
        lastGood = data
        setState({ status: 'ready', data })
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        // Keep showing the last good standings if we have them
        setState({ status: 'error', data: lastGood })
      }
    }

    load()
    const id = window.setInterval(load, REFRESH_MS)
    return () => {
      window.clearInterval(id)
      abort.abort()
    }
  }, [])

  return state
}

/**
 * Whether the Kick channel is live, from /api/kick, checked every minute.
 * null until the first answer (and whenever Kick can't be reached).
 */
export function useKickLive(): KickStatus['live'] | null {
  const [live, setLive] = useState<KickStatus['live'] | null>(null)

  useEffect(() => {
    let stopped = false
    const load = async () => {
      try {
        const res = await fetch('/api/kick')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const status = (await res.json()) as KickStatus
        if (!stopped) setLive(status.live)
      } catch {
        // Keep what we last knew: a failed check shouldn't cut off a stream that's playing
      }
    }
    load()
    const id = window.setInterval(load, REFRESH_MS)
    return () => {
      stopped = true
      window.clearInterval(id)
    }
  }, [])

  return live
}

/** Days / hours / minutes / seconds left until `end` (epoch ms), ticking every second */
export function useCountdown(end: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const left = Math.max(0, end - now)
  return {
    days: Math.floor(left / 86_400_000),
    hours: Math.floor(left / 3_600_000) % 24,
    minutes: Math.floor(left / 60_000) % 60,
    seconds: Math.floor(left / 1000) % 60,
    ended: left === 0,
  }
}

/** The site-wide toast (see ToastProvider in components/ui.tsx) */
export const ToastContext = createContext<{ show: (content: ReactNode) => void }>({ show: () => undefined })
export const useToast = () => useContext(ToastContext)

/** Clipboard API where allowed, else the old hidden-textarea copy (e.g. on plain http) — as on kingkulbik */
export function copyText(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text)
  return new Promise((resolve, reject) => {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    try {
      if (document.execCommand('copy')) resolve()
      else reject(new Error('copy refused'))
    } catch (err) {
      reject(err)
    } finally {
      area.remove()
    }
  })
}

export const formatUsd = (value: number, fractionDigits = 2) =>
  value.toLocaleString('en-US', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })
