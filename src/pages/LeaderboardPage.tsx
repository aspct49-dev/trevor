import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PLATFORMS, RANK_BY, getRaceWindow, prizePool, prizesFor, raceDates, raceName } from '../../shared/leaderboard'
import type { Platform } from '../../shared/leaderboard'
import { CODE } from '../../shared/site'
import { delay, useArchivedRace, useArchivedRaces, useLeaderboard } from '../hooks'
import { CodeButtons, LeaderboardTitle, PartnerLogos } from '../components/ui'
import {
  Countdown,
  PastLeaderboards,
  Podium,
  RaceEnded,
  RankingTable,
  RulesButton,
  RulesDialog,
} from '../components/leaderboard'

import bgStake from '../assets/bg-stake.webp'

/**
 * The live race, or a finished one (?race=<its first day>, or ?race=latest for
 * the most recent): the same hero, podium and table, with that race's prizes.
 */
/** The code as written in the tagline: "Trev" */
const CODE_NAME = CODE.charAt(0) + CODE.slice(1).toLowerCase()

export function LeaderboardPage() {
  const state = useLeaderboard()
  const [rules, setRules] = useState(false)
  const [params, setParams] = useSearchParams()

  // The pre-rendered page knows nothing about ?race=, so it is read only once the page is running in the browser
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const wanted = mounted ? params.get('race') : null
  const viewingPast = wanted !== null

  const data = state.data
  // The server's dates win; until it answers, the same rule worked out here
  const live = data?.window ?? getRaceWindow()
  const list = useArchivedRaces(live.start)
  const raceId = wanted === 'latest' ? (list.data?.[0]?.id ?? null) : wanted
  const past = useArchivedRace(viewingPast ? raceId : null)
  const race = past.data

  const prizes = race ? race.prizes : (data?.prizes ?? prizesFor(live.start))
  const entries = race ? race.entries : viewingPast ? [] : (data?.entries ?? [])
  const loading = viewingPast ? list.status === 'loading' || past.status === 'loading' : state.status === 'loading'
  const failed = data ? (Object.keys(data.sources) as Platform[]).filter((p) => data.sources[p] === 'error') : []

  const showRace = (id: string | null) => {
    setParams(id ? { race: id } : {})
    window.scrollTo(0, 0)
  }

  return (
    <main className="lb-page">
      <img className="page-bg lb-page__bg" src={bgStake} alt="" />

      <section className="lb-hero">
        <div data-reveal="fade">
          <PartnerLogos />
        </div>
        <LeaderboardTitle pool={prizePool(prizes)} />
        {race ? (
          <p className="lb-hero__sub">
            Final standings: <strong>{raceName(race)}</strong> leaderboard, {raceDates(race)} (UTC)
          </p>
        ) : (
          <p className="lb-hero__sub" data-reveal="up" style={delay(120)}>
            Climb to the top of the leaderboard on code <strong>{CODE_NAME}</strong>! Sign up, wager, win!
          </p>
        )}
        <div className="lb-hero__actions" data-reveal="up" style={delay(220)}>
          <CodeButtons />
        </div>
      </section>

      {!viewingPast && state.status === 'error' && !data && (
        <p className="lb-notice" role="status">
          Live standings are temporarily unavailable. Please check back in a minute.
        </p>
      )}
      {!viewingPast && failed.length > 0 && (
        <p className="lb-notice" role="status">
          {failed.map((p) => PLATFORMS[p].label).join(' & ')} standings are refreshing — showing the rest for now.
        </p>
      )}
      {viewingPast && (list.status === 'error' || past.status === 'error') && (
        <p className="lb-notice" role="status">
          Could not load this leaderboard. Please try again shortly.
        </p>
      )}
      {viewingPast && list.status === 'ready' && !list.data?.length && (
        <p className="lb-notice" role="status">
          No finished leaderboards yet. Each one is kept here as soon as it ends.
        </p>
      )}

      <div className="lb-page__podium" aria-busy={loading}>
        <Podium entries={entries} prizes={prizes} />
      </div>

      {viewingPast ? race && <RaceEnded end={race.end} /> : <Countdown end={live.end} />}

      {viewingPast && list.data && list.data.length > 1 && (
        <div className="lb-page__pills" role="radiogroup" aria-label="Finished leaderboard">
          {list.data.map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={r.id === raceId}
              className={`rules-btn${r.id === raceId ? ' rules-btn--selected' : ''}`}
              onClick={() => showRace(r.id)}
            >
              {raceName(r).toUpperCase()}
            </button>
          ))}
        </div>
      )}
      <div className="lb-page__pills" data-reveal={viewingPast ? undefined : 'fade'}>
        {viewingPast && (
          <button type="button" className="rules-btn" onClick={() => showRace(null)}>
            <svg width="8" height="13" viewBox="0 0 8 13" aria-hidden>
              <path d="M6.5 1.5 1.5 6.5l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            CURRENT LEADERBOARD
          </button>
        )}
        <RulesButton onClick={() => setRules(true)} />
      </div>

      <RankingTable entries={entries} prizes={prizes} />

      {/* Finished races sit under the live table */}
      {!viewingPast && <PastLeaderboards races={list.data ?? []} onView={showRace} />}

      <p className="lb-footnote" data-reveal="fade">
        Stake.com and Stake.us players under code {CODE} are ranked together.{' '}
        {RANK_BY === 'weighted' && 'Wagers are weighted by game RTP, as on Stake. '}
        Each leaderboard runs from the 16th of a month to 11:59 PM UTC on the 15th of the next; standings update every minute.{' '}
        <Link to="/terms#leaderboard">Full leaderboard terms</Link>. New here? See{' '}
        <Link to="/how-to-sign-up">how to sign up</Link>.
      </p>
      <RulesDialog open={rules} onClose={() => setRules(false)} />
    </main>
  )
}
