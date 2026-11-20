import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router'
import { CODE, MIN_AGE, STAKE_COM_URL, STAKE_US_URL, external } from '../../shared/site'
import { GA_ID, getConsent, setConsent, trackEvent } from '../analytics'
import type { Consent } from '../analytics'
import { ToastContext, copyText, useHoverAnimation, useToast } from '../hooks'

import copyIcon from '../assets/copy.svg'
import dividerV from '../assets/divider-v.svg'
import stakeSmall from '../assets/stake-small.svg'
import stakeUsSmall from '../assets/stake-us-small.svg'
import stakeLogo from '../assets/stake-logo.svg'
import stakeUsLogo from '../assets/stake-us-logo.svg'
import xMark from '../assets/x-mark.svg'
import platBadge from '../assets/plat-badge.svg'
import d1 from '../assets/diamond-1.svg'
import d2 from '../assets/diamond-2.svg'
import d3 from '../assets/diamond-3.svg'
import d4 from '../assets/diamond-4.svg'
import d5 from '../assets/diamond-5.svg'
import d6 from '../assets/diamond-6.svg'
import d7 from '../assets/diamond-7.svg'
import d8 from '../assets/diamond-8.svg'
import sectionHex from '../assets/section-hex.webp'
import hexGlow from '../assets/hex-glow.svg'
import lineLeft from '../assets/line-left.svg'
import lineRight from '../assets/line-right.svg'

/** "VISIT [Stake]" / "VISIT [Stake.us]" referral buttons */
export function VisitButton({ platform }: { platform: 'com' | 'us' }) {
  const us = platform === 'us'
  return (
    <a
      className="btn btn--blue visit-btn"
      href={us ? STAKE_US_URL : STAKE_COM_URL}
      {...external}
      onClick={() => trackEvent('visit_stake', { platform })}
    >
      <span>VISIT</span>
      <span className="visit-btn__logo">
        <img src={us ? stakeUsSmall : stakeSmall} alt={us ? 'Stake.us' : 'Stake'} />
        {us && <span className="visit-btn__us">.US</span>}
      </span>
    </a>
  )
}

/* ——————————————————————— Toast ——————————————————————— */

/**
 * One toast for the whole site, as on kingkulbik / rekoj: a short
 * confirmation that rises from the bottom of the screen, then fades.
 */
export function ToastProvider({ children, duration = 1800 }: { children: ReactNode; duration?: number }) {
  const [toast, setToast] = useState<{ content: ReactNode; visible: boolean }>({ content: null, visible: false })
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const show = useCallback(
    (content: ReactNode) => {
      window.clearTimeout(timer.current)
      setToast({ content, visible: true })
      // Keep the text while it fades out
      timer.current = window.setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration)
    },
    [duration],
  )

  return (
    <ToastContext.Provider value={useMemo(() => ({ show }), [show])}>
      {children}
      <p className={`toast${toast.visible ? ' toast--visible' : ''}`} role="status" aria-live="polite">
        {toast.content}
      </p>
    </ToastContext.Provider>
  )
}

/**
 * "CODE: TREV". Clicking copies it: the button keeps its label, lights a
 * blue ring for a moment, and a toast confirms (as on kingkulbik / rekoj).
 */
export function CodeBox() {
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)
  const { show } = useToast()

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = () =>
    copyText(CODE).then(
      () => {
        window.clearTimeout(timer.current)
        setCopied(true)
        timer.current = window.setTimeout(() => setCopied(false), 1200)
        trackEvent('copy_code')
        show(
          <>
            Code <span className="toast__accent">{CODE}</span> copied to clipboard
          </>,
        )
      },
      () =>
        show(
          <>
            Couldn't copy. The code is <span className="toast__accent">{CODE}</span>
          </>,
        ),
    )

  return (
    <button
      type="button"
      className={`code-box${copied ? ' code-box--copied' : ''}`}
      onClick={copy}
      aria-label={`Copy code ${CODE}`}
    >
      <span className="code-box__text">
        CODE: <span className="code-box__code">{CODE}</span>
      </span>
      <img className="code-box__divider" src={dividerV} alt="" />
      <img className="code-box__icon" src={copyIcon} alt="" />
    </button>
  )
}

/**
 * The disclosure that sits right under the affiliate buttons: advertising
 * rules want the paid relationship stated in plain words next to the links,
 * not only in the footer.
 */
export function AffiliateNote({ className = '' }: { className?: string }) {
  return (
    <p className={`affiliate-note ${className}`}>
      {MIN_AGE}+ only. Trevor earns a commission when you sign up with his code.{' '}
      <Link to="/terms">Terms apply</Link>. Play responsibly.
    </p>
  )
}

/** "Home / Page": the trail shown on the text pages; the same trail is in each page's structured data */
export function Breadcrumbs({ current }: { current: string }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <ol>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  )
}

/**
 * Asks before Google Analytics is used. Only exists when the site was built
 * with a measurement ID (VITE_GA_MEASUREMENT_ID); nothing is loaded from
 * Google until "Accept". The footer's "Cookie settings" reopens it.
 */
export function ConsentBanner() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!GA_ID) return
    if (getConsent() === null) setOpen(true)
    const reopen = () => setOpen(true)
    window.addEventListener('trevor:cookie-settings', reopen)
    return () => window.removeEventListener('trevor:cookie-settings', reopen)
  }, [])

  if (!GA_ID || !open) return null
  const choose = (choice: Exclude<Consent, null>) => {
    setConsent(choice)
    setOpen(false)
  }
  return (
    <div className="consent" role="dialog" aria-label="Analytics cookies">
      <p>
        We would like to use Google Analytics to count visits and see which pages are used. It sets cookies only if
        you accept. <Link to="/privacy">Privacy Policy</Link>
      </p>
      <div className="consent__actions">
        <button type="button" className="ranking__more consent__btn" onClick={() => choose('denied')}>
          DECLINE
        </button>
        <button type="button" className="btn btn--blue consent__btn" onClick={() => choose('granted')}>
          ACCEPT
        </button>
      </div>
    </div>
  )
}

/** [Visit Stake] [CODE: TREV] [Visit Stake.us], with the disclosure underneath */
export function CodeButtons() {
  return (
    <div className="code-cta">
      <div className="code-buttons">
        <VisitButton platform="com" />
        <CodeBox />
        <VisitButton platform="us" />
      </div>
      <AffiliateNote />
    </div>
  )
}

/** Stake × Stake.us */
export function PartnerLogos() {
  return (
    <div className="partners" aria-label="Stake and Stake.us">
      <img src={stakeLogo} alt="Stake" width={65} height={32} />
      <img className="partners__x" src={xMark} alt="" />
      <span className="partners__us">
        <img src={stakeUsLogo} alt="Stake.us" width={51} height={25} />
        <span>.US</span>
      </span>
    </div>
  )
}

/** The blue "I" diamond gem, built from the design's eight facets */
export function Diamond({ className = '' }: { className?: string }) {
  const facets: [string, string][] = [
    [d1, '21.8% 4.11% 5.2% 4.11%'],
    [d2, '53.06% 30.58% 5.19% 30.57%'],
    [d3, '21.8% 50% 43.89% 19.38%'],
    [d4, '32.36% 30.58% 43.89% 30.57%'],
    [d5, '44.75% 4.11% 5.19% 50%'],
    [d6, '44.75% 50% 5.19% 4.11%'],
    [d7, '21.8% 69.42% 43.9% 4.11%'],
    [d8, '21.8% 4.11% 43.89% 19.91%'],
  ]
  return (
    <span className={`diamond ${className}`} aria-hidden>
      {facets.map(([src, inset]) => (
        <span key={src} className="diamond__facet" style={{ inset }}>
          <img src={src} alt="" />
        </span>
      ))}
      <span className="diamond__letter">I</span>
    </span>
  )
}

export function PlatBadge({ className = '' }: { className?: string }) {
  return <img className={`plat-badge ${className}`} src={platBadge} alt="" aria-hidden />
}

/**
 * A decorative symbol (ported from kingkulbik's FloatingSymbol): it bobs gently
 * on its own and, on hover, lifts, spins a little and grows.
 */
export function FloatingSymbol({
  children,
  rotation,
  idle,
  className = '',
}: {
  children: ReactNode
  /** Resting rotation from the design, in degrees */
  rotation: number
  /** Bob on its own; the number offsets each symbol's rhythm (seconds) */
  idle?: number
  className?: string
}) {
  const { handlers, hoverClass } = useHoverAnimation()
  return (
    <span
      className={`floating-symbol${idle === undefined ? '' : ' floating-symbol--idle'} ${hoverClass} ${className}`}
      style={{ '--rotation': `${rotation}deg`, '--idle-delay': `${-(idle ?? 0)}s` } as CSSProperties}
      aria-hidden
      {...handlers}
    >
      {/* The idle bob runs on this inner layer; the outer element's animation drives the hover */}
      <span className="floating-symbol__bob">
        <span className="floating-symbol__art">{children}</span>
      </span>
    </span>
  )
}

/** "$50,000 MONTHLY / LEADERBOARD" with the two gems either side */
export function LeaderboardTitle({ pool, as: Tag = 'h1' }: { pool: number; as?: 'h1' | 'h2' }) {
  return (
    <div className="lb-title" data-reveal="zoom">
      <FloatingSymbol className="lb-title__plat" rotation={-6.57} idle={0}>
        <PlatBadge />
      </FloatingSymbol>
      <Tag className="lb-title__text">
        <span className="lb-title__line1">
          <span className="grad-blue">${pool.toLocaleString('en-US')}</span>{' '}
          <span className="grad-silver">MONTHLY</span>
        </span>
        <span className="lb-title__line2 grad-blue">LEADERBOARD</span>
      </Tag>
      <FloatingSymbol className="lb-title__diamond" rotation={9.79} idle={2.1}>
        <Diamond />
      </FloatingSymbol>
    </div>
  )
}

/** The blue hexagon used on section dividers, with an optional glow and centre content */
export function Hex({ children, glow = false }: { children?: ReactNode; glow?: boolean }) {
  return (
    <span className="hex">
      {glow && <img className="hex__glow" src={hexGlow} alt="" />}
      <img className="hex__shape" src={sectionHex} alt="" />
      <span className="hex__content">{children}</span>
    </span>
  )
}

/** ——— [hex + label] ——— */
export function SectionDivider({ children, className = '', reveal = false }: { children: ReactNode; className?: string; reveal?: boolean }) {
  return (
    <div className={`section-divider ${className}`} data-reveal={reveal ? 'divider' : undefined}>
      <img className="section-divider__line" src={lineLeft} alt="" />
      <div className="section-divider__center">{children}</div>
      <img className="section-divider__line" src={lineRight} alt="" />
    </div>
  )
}
