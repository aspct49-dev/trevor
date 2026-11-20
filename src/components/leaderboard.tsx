import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { PLATFORMS } from '../../shared/leaderboard'
import type { LeaderboardEntry } from '../../shared/leaderboard'
import { formatUsd, useCountdown, useHoverAnimation } from '../hooks'

import cardTexture from '../assets/card-texture.webp'
import avatar1st from '../assets/avatar-1st.webp'
import avatar2nd from '../assets/avatar-2nd.webp'
import avatar3rd from '../assets/avatar-3rd.webp'
import avatarRow from '../assets/avatar-row.webp'
import trophyCard from '../assets/icon-trophy-card.svg'
import giftBoxGold from '../assets/gift-box-gold.webp'
import giftUnion from '../assets/gift-union.svg'
import prizeLineBlue from '../assets/prize-line-blue.svg'
import prizeLinePurple from '../assets/prize-line-purple.svg'
import timerGlow from '../assets/timer-glow.svg'
import timerHex from '../assets/timer-hex.webp'
import lineLeft from '../assets/line-left.svg'
import lineRight from '../assets/line-right.svg'
import placeHex from '../assets/place-hex.svg'
import iconTrophySm from '../assets/icon-trophy-sm.svg'
import iconUser from '../assets/icon-user.svg'
import iconGiftSm from '../assets/icon-gift-sm.svg'
import rowFade from '../assets/row-fade.png'

/* ——————————————————————— Podium ——————————————————————— */

type Variant = 'gold' | 'blue' | 'purple'

const PLACES: Record<1 | 2 | 3, { label: string; variant: Variant; avatars: string[] }> = {
  1: { label: '1ST PLACE', variant: 'gold', avatars: [avatar1st] },
  // The design stacks two portraits for 2nd place; the top one shows
  2: { label: '2ND PLACE', variant: 'blue', avatars: [avatar3rd, avatar2nd] },
  3: { label: '3RD PLACE', variant: 'purple', avatars: [avatar3rd] },
}

export function PodiumCard({
  place,
  entry,
  prize,
  style,
  lazy = false,
}: {
  place: 1 | 2 | 3
  entry?: Pick<LeaderboardEntry, 'name' | 'amount' | 'platform'>
  prize: number
  style?: CSSProperties
  /** Below the first screen: let the browser fetch the pictures when they come near */
  lazy?: boolean
}) {
  const { label, variant, avatars } = PLACES[place]
  const { handlers, hoverClass } = useHoverAnimation()
  return (
    <article
      className={`pcard pcard--${variant} ${hoverClass}`}
      style={style}
      aria-label={`${label.toLowerCase()}`}
      {...handlers}
    >
      <div className="pcard__bg" aria-hidden>
        <img src={cardTexture} alt="" loading={lazy ? 'lazy' : undefined} decoding="async" />
      </div>
      <div className="pcard__head">
        <img src={trophyCard} alt="" />
        <span>{label}</span>
      </div>
      <div className="pcard__avatar">
        {avatars.map((src) => (
          <img key={src} src={src} alt="" loading={lazy ? 'lazy' : undefined} decoding="async" />
        ))}
      </div>
      <p className="pcard__name" title={entry ? PLATFORMS[entry.platform].label : undefined}>
        {entry?.name ?? '—'}
      </p>
      <div className="pcard__wager">
        <span className="pcard__wager-label">WAGERED</span>
        <span className="pcard__wager-value">
          <span className="pcard__dollar">$</span>
          {formatUsd(entry?.amount ?? 0)}
        </span>
      </div>
      <div className="pcard__prize">
        {variant === 'gold' ? (
          <img className="pcard__gift-img" src={giftBoxGold} alt="" />
        ) : (
          <span className="pcard__gift">
            <img src={giftUnion} alt="" />
          </span>
        )}
        {variant !== 'gold' && (
          <img className="pcard__prize-line" src={variant === 'blue' ? prizeLineBlue : prizeLinePurple} alt="" />
        )}
        <span className="pcard__prize-value">
          <span className="pcard__prize-text">${formatUsd(prize, 0)}</span>
        </span>
      </div>
    </article>
  )
}

/** 2nd · 1st · 3rd */
export function Podium({
  entries,
  prizes,
  compact = false,
}: {
  entries: LeaderboardEntry[]
  prizes: number[]
  compact?: boolean
}) {
  return (
    <div className={`podium ${compact ? 'podium--compact' : ''}`}>
      {([2, 1, 3] as const).map((place) => (
        // 1st rises first, then 2nd, then 3rd
        <div key={place} className={`podium__slot podium__slot--${place}`} data-reveal="up" style={{ '--reveal-delay': `${(place - 1) * 120}ms` } as CSSProperties}>
          <PodiumCard place={place} entry={entries[place - 1]} prize={prizes[place - 1] ?? 0} lazy={compact} />
        </div>
      ))}
    </div>
  )
}

/* ——————————————————————— Countdown ——————————————————————— */

export function Countdown({ end }: { end: number }) {
  const left = useCountdown(end)
  // A dash until the clock starts in the browser (the pre-rendered page has no "now")
  const units: [number | string, string][] = [
    [left ? left.days : '–', 'DAYS'],
    [left ? left.hours : '–', 'HRS'],
    [left ? left.minutes : '–', 'MIN'],
    [left ? left.seconds : '–', 'SEC'],
  ]
  return (
    <section className="countdown" aria-label="Leaderboard ends in" data-reveal="up">
      <span className="countdown__icon" aria-hidden>
        <img src={timerGlow} alt="" />
      </span>
      <h2 className="countdown__title">LEADERBOARD ENDS IN</h2>
      <div className="countdown__row">
        <img className="countdown__line" src={lineLeft} alt="" />
        <div className="countdown__tiles" role="timer">
          {units.map(([value, label]) => (
            <span key={label} className="countdown__tile">
              <img src={timerHex} alt="" />
              <span className="countdown__value">{value}</span>
              <span className="countdown__label">{label}</span>
            </span>
          ))}
        </div>
        <img className="countdown__line" src={lineRight} alt="" />
      </div>
    </section>
  )
}

/* ——————————————————————— Rules ——————————————————————— */

/** How much of a bet's wager counts towards the leaderboard, by the game's RTP (as on kingkulbik) */
const RULES = [
  { share: '100%', title: 'RTP ≤ 98%', text: 'Full wager counts (e.g. Sports @ 97%)' },
  { share: '50%', title: 'RTP > 98%', text: 'Half wager counts' },
  { share: '10%', title: 'RTP ≥ 99%', text: 'Minimal contribution (e.g. Blackjack)' },
  { share: '0%', title: 'Poker', text: 'Poker wager does not count', none: true },
]

/** The pill under the countdown that opens the rules */
export function RulesButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="rules-btn" aria-haspopup="dialog" onClick={onClick}>
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        <circle cx="7" cy="7" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 6.2v3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="7" cy="4.2" r="0.95" fill="currentColor" />
      </svg>
      RULES
    </button>
  )
}

/** The leaderboard's wager contribution rules, opened from the button under the countdown */
export function RulesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // Focus starts on the rules, not the close button (no ring after a click; Tab still reaches it)
      dialog.querySelector<HTMLElement>('.lb-rules__body')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Tell the page straight away as well: the browser reports a close a moment later (and is the
  // only signal for Escape), and a quick second click on RULES must not find the state still open
  const close = () => {
    ref.current?.close()
    onClose()
  }

  return (
    <dialog
      ref={ref}
      className="lb-rules"
      aria-labelledby="lb-rules-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && close()}
    >
      <div className="lb-rules__body" tabIndex={-1}>
        <header className="lb-rules__head">
          <h2 id="lb-rules-title" className="lb-rules__title">
            Wager Contribution Rules
          </h2>
          <button type="button" className="lb-rules__close" aria-label="Close the rules" onClick={close}>
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <path d="m1.5 1.5 9 9m0-9-9 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <p className="lb-rules__intro">
          Wager is weighted by game RTP to ensure fair competition. Higher RTP games contribute less to the leaderboard.
        </p>
        <ul className="lb-rules__list">
          {RULES.map((r) => (
            <li key={r.share} className="lb-rules__rule">
              <span className={`lb-rules__share${r.none ? ' lb-rules__share--none' : ''}`}>{r.share}</span>
              <span className="lb-rules__rule-title">{r.title}</span>
              <span className="lb-rules__rule-text">{r.text}</span>
            </li>
          ))}
        </ul>
        <p className="lb-rules__more">
          Who can take part, how the race runs and how prizes are paid: see the{' '}
          <Link to="/terms#leaderboard">full leaderboard terms</Link>.
        </p>
      </div>
    </dialog>
  )
}

/* ——————————————————————— Ranking table ——————————————————————— */

const COLLAPSED_LAST_PLACE = 10

function Row({ place, entry, prize, reveal = true }: { place: number; entry?: LeaderboardEntry; prize: number; reveal?: boolean }) {
  return (
    <div
      className="rank-row"
      role="row"
      data-reveal={reveal ? 'left' : undefined}
      // Rows cascade in; each block of seven restarts the cascade
      style={reveal ? ({ '--reveal-delay': `${((place - 4) % 7) * 60}ms` } as CSSProperties) : undefined}
    >
      <span className="rank-row__place" role="cell">
        <img src={placeHex} alt="" />
        <span className={place >= 10 ? 'rank-row__num rank-row__num--2' : 'rank-row__num'}>{place}</span>
      </span>
      <span className="rank-row__user" role="cell" title={entry ? PLATFORMS[entry.platform].label : undefined}>
        <img src={avatarRow} alt="" width={30} height={30} loading="lazy" decoding="async" />
        <span>{entry?.name ?? '—'}</span>
      </span>
      <span className="rank-row__amount" role="cell">
        <span className="accent">$</span>
        {formatUsd(entry?.amount ?? 0)}
      </span>
      <span className="rank-row__prize" role="cell">
        <span className="accent">$</span>
        {formatUsd(prize, 0)}
      </span>
    </div>
  )
}

/** Places 4–30: 4–10 first, with 11th peeking out under "View more" */
export function RankingTable({ entries, prizes }: { entries: LeaderboardEntry[]; prizes: number[] }) {
  const [expanded, setExpanded] = useState(false)
  const lastPlace = expanded ? prizes.length : Math.min(COLLAPSED_LAST_PLACE, prizes.length)
  const places = Array.from({ length: Math.max(0, lastPlace - 3) }, (_, i) => i + 4)
  const teaser = !expanded && prizes.length > COLLAPSED_LAST_PLACE ? COLLAPSED_LAST_PLACE + 1 : null

  return (
    <section className="ranking" aria-label="Places 4 and below">
      <div className="ranking__table" role="table">
        <div className="ranking__head" role="row" data-reveal="fade">
          <span role="columnheader">
            <img src={iconTrophySm} alt="" /> Place
          </span>
          <span role="columnheader">
            <img src={iconUser} alt="" /> User
          </span>
          <span role="columnheader">
            <span className="ranking__dollar">$</span> Wagered
          </span>
          <span role="columnheader">
            <img src={iconGiftSm} alt="" /> Reward
          </span>
        </div>
        {places.map((place) => (
          <Row key={place} place={place} entry={entries[place - 1]} prize={prizes[place - 1] ?? 0} />
        ))}
        {teaser && (
          <div className="ranking__teaser" aria-hidden data-reveal="fade" style={{ '--reveal-delay': '420ms' } as CSSProperties}>
            <Row place={teaser} entry={entries[teaser - 1]} prize={prizes[teaser - 1] ?? 0} reveal={false} />
            <img className="ranking__fade" src={rowFade} alt="" />
          </div>
        )}
      </div>
      {prizes.length > COLLAPSED_LAST_PLACE && (
        <button type="button" className="ranking__more" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
          {expanded ? 'VIEW LESS' : 'VIEW MORE'}
        </button>
      )}
    </section>
  )
}
