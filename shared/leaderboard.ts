/*
 * Leaderboard rules shared by the API proxy (server/) and the page (src/).
 * Plain TypeScript with no Node or DOM dependencies, so both sides can import it.
 *
 * One combined board: players under code TREVOR on Stake.com and on Stake.us
 * are always ranked together, in a single list with a single prize table.
 * Races run a calendar month in UTC (the 1st at 00:00 UTC until the next 1st).
 * Change prizes, places or dates here.
 */

export type Platform = 'com' | 'us'

export const PLATFORMS: Record<Platform, { label: string; apiUrl: string }> = {
  com: { label: 'Stake.com', apiUrl: 'https://api.stake.com/affiliate/leaderboard' },
  us: { label: 'Stake.us', apiUrl: 'https://api.stake.us/affiliate/leaderboard' },
}

/**
 * Prize per place, 1st first; the length is the number of paid places (30).
 * The $50,000 split as confirmed by Trevor's team.
 */
export const PRIZES: number[] = [
  20000, 10000, 5000, 2500, 1500, // 1st–5th
  800, 800, 800, 800, 800, // 6th–10th
  500, 500, 500, 500, 500, // 11th–15th
  400, 400, 400, 400, 400, // 16th–20th
  250, 250, 250, 250, 250, 250, 250, 250, 250, 250, // 21st–30th
]

export const prizePool = (prizes: number[] = PRIZES) => prizes.reduce((sum, prize) => sum + prize, 0)

/**
 * Stake ranks affiliate races by weighted wager (wager weighted by game RTP).
 * Set to 'wagered' to rank and display raw wager instead.
 */
export const RANK_BY: 'weighted' | 'wagered' = 'weighted'

/** The race containing `now`: [start, end) in epoch ms, UTC calendar month. */
export function getRaceWindow(now = Date.now()) {
  const d = new Date(now)
  const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
  const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)
  return { start, end }
}

/**
 * "TrevorAbney" → "TrevorAb***": the name with its last three characters
 * replaced by stars, so people recognise themselves but nobody sees the full
 * username. Very short names keep at least their first character.
 */
export function maskName(name: string) {
  const n = name.trim()
  const visible = Math.max(1, n.length - 3)
  return n.slice(0, visible) + '***'
}

export type LeaderboardEntry = {
  rank: number
  /** Masked by the server; full usernames never reach the browser. */
  name: string
  /** The ranking amount in USD (weighted wager unless RANK_BY says otherwise) */
  amount: number
  prize: number
  platform: Platform
}

/**
 * ok: fresh from Stake · stale: Stake didn't answer, so that site's last good standings are used ·
 * error: no standings for that site at all · unconfigured: no token
 */
export type SourceStatus = 'ok' | 'stale' | 'error' | 'unconfigured'

export type LeaderboardResponse = {
  window: { start: number; end: number }
  entries: LeaderboardEntry[]
  prizes: number[]
  /** Per platform: whether its standings are included */
  sources: Record<Platform, SourceStatus>
  updatedAt: number
}
