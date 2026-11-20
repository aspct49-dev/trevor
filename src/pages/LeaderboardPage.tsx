import { PLATFORMS, PRIZES, RANK_BY, getRaceWindow, prizePool } from '../../shared/leaderboard'
import type { Platform } from '../../shared/leaderboard'
import { Link } from 'react-router'
import { CODE } from '../../shared/site'
import { delay, useLeaderboard } from '../hooks'
import { CodeButtons, LeaderboardTitle, PartnerLogos } from '../components/ui'
import { Countdown, Podium, RankingTable } from '../components/leaderboard'

import bgStake from '../assets/bg-stake.webp'

export function LeaderboardPage() {
  const state = useLeaderboard()
  const data = state.data
  const prizes = data?.prizes ?? PRIZES
  const entries = data?.entries ?? []
  const window = data?.window ?? getRaceWindow()

  const failed = data ? (Object.keys(data.sources) as Platform[]).filter((p) => data.sources[p] === 'error') : []

  return (
    <main className="lb-page">
      <img className="page-bg lb-page__bg" src={bgStake} alt="" />

      <section className="lb-hero">
        <div data-reveal="fade">
          <PartnerLogos />
        </div>
        <LeaderboardTitle pool={prizePool(prizes)} />
        <p className="lb-hero__sub" data-reveal="up" style={delay(120)}>
          Climb to Top places &amp; be under code <strong>{CODE}</strong> and win big rewards!
        </p>
        <div className="lb-hero__actions" data-reveal="up" style={delay(220)}>
          <CodeButtons />
        </div>
      </section>

      {state.status === 'error' && !data && (
        <p className="lb-notice" role="status">
          Live standings are temporarily unavailable. Please check back in a minute.
        </p>
      )}
      {failed.length > 0 && (
        <p className="lb-notice" role="status">
          {failed.map((p) => PLATFORMS[p].label).join(' & ')} standings are refreshing — showing the rest for now.
        </p>
      )}

      <div className="lb-page__podium" aria-busy={state.status === 'loading'}>
        <Podium entries={entries} prizes={prizes} />
      </div>

      <Countdown end={window.end} />

      <RankingTable entries={entries} prizes={prizes} />

      <p className="lb-footnote" data-reveal="fade">
        Stake.com and Stake.us players under code {CODE} are ranked together.{' '}
        {RANK_BY === 'weighted' && 'Wagers are weighted by game RTP, as on Stake. '}
        The race resets on the 1st of every month at 00:00 UTC; standings update every minute.{' '}
        <Link to="/terms#leaderboard">Leaderboard rules</Link>. New here? See{' '}
        <Link to="/how-to-sign-up">how to sign up</Link>.
      </p>
    </main>
  )
}
