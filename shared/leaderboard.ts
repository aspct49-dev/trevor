/*
 * Leaderboard rules shared by the API proxy (server/) and the page (src/).
 * Plain TypeScript with no Node or DOM dependencies, so both sides can import it.
 *
 * One combined board: players under code TREV on Stake.com and on Stake.us
 * are always ranked together, in a single list with a single prize table.
 * Races run from the 16th of a month to the 15th of the next, in UTC.
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
 * Prize tables by the race they apply from, newest first. A race uses the
 * newest table that began on or before its start, so changing the prizes
 * later never rewrites a finished race. To change prizes from a future race,
 * add an entry above with that race's start date.
 */
const PRIZE_HISTORY: { from: number; prizes: number[] }[] = [{ from: 0, prizes: PRIZES }]

/** The prizes of the race that starts at `raceStart` */
export function prizesFor(raceStart: number): number[] {
  return (PRIZE_HISTORY.find((p) => p.from <= raceStart) ?? PRIZE_HISTORY[PRIZE_HISTORY.length - 1]).prizes
}

/**
 * Stake ranks affiliate races by weighted wager (wager weighted by game RTP).
 * Set to 'wagered' to rank and display raw wager instead.
 */
export const RANK_BY: 'weighted' | 'wagered' = 'weighted'

/** Races start on this day of the month at 00:00 UTC, so the last day that counts is the 15th of the next month */
export const RACE_START_DAY = 16

/**
 * The first race on this site: 16 November to 15 December 2026. Every race
 * from this one on appears under Past Leaderboards once it has finished.
 */
export const FIRST_RACE_START = Date.UTC(2026, 10, RACE_START_DAY)

/**
 * The race containing `now`: [start, end) in epoch ms, UTC. A race runs from
 * the 16th at 00:00 UTC until the 16th of the next month at 00:00 UTC, i.e. it
 * ends at 11:59 PM UTC on the 15th, and the next one starts straight after.
 * Stake reports wagers by whole UTC day, so the window must end on a day
 * boundary: every wager placed on the 15th (UTC) counts, none from the 16th.
 */
export function getRaceWindow(now = Date.now()) {
  const d = new Date(now)
  let start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), RACE_START_DAY)
  if (start > now) start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, RACE_START_DAY)
  const s = new Date(start)
  return { start, end: Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + 1, RACE_START_DAY) }
}

/** Finished races, newest first: from the first race up to, not including, the one running now */
export function finishedRaces(now = Date.now(), limit = 24) {
  const races: { start: number; end: number }[] = []
  let race = getRaceWindow(getRaceWindow(now).start - 1)
  while (race.start >= FIRST_RACE_START && races.length < limit) {
    races.push(race)
    race = getRaceWindow(race.start - 1)
  }
  return races
}

/** A race is identified by its first day, e.g. "2026-11-16" */
export const raceId = (start: number) => new Date(start).toISOString().slice(0, 10)

const utcDate = (at: number, options: Intl.DateTimeFormatOptions) =>
  new Date(at).toLocaleDateString('en-US', { ...options, timeZone: 'UTC' })

/** "December 2026": a race is named after the month it ends in */
export const raceName = (race: { end: number }) => utcDate(race.end - 1, { month: 'long', year: 'numeric' })

/** "Nov 16 – Dec 15" */
export const raceDates = (race: { start: number; end: number }) =>
  `${utcDate(race.start, { month: 'short', day: 'numeric' })} – ${utcDate(race.end - 1, { month: 'short', day: 'numeric' })}`

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

/** A finished race with its final standings (masked names, as on the live board) */
export type ArchivedRace = {
  /** The race's first day, e.g. "2026-11-16" */
  id: string
  start: number
  end: number
  prizes: number[]
  entries: LeaderboardEntry[]
}

/** One card under Past Leaderboards */
export type ArchivedRaceSummary = Pick<ArchivedRace, 'id' | 'start' | 'end'> & {
  pool: number
  /** 1st place (masked); null when nobody wagered */
  winner: string | null
}
