/*
 * Past leaderboards: every finished race's final standings.
 *
 * Nothing is stored. Which races have finished follows from the calendar
 * (shared/leaderboard.ts), and a finished race's standings are read from
 * Stake for exactly that race's dates, with that race's prizes. So a race
 * appears here the moment it ends, and the next one starts at the same instant.
 *
 *   GET /api/leaderboard-archive               every finished race, newest first (summaries)
 *   GET /api/leaderboard-archive?race=<id>     one race's standings (id: its first day, "2026-11-16")
 *
 * Standings are kept in memory: for five minutes while a race has just ended
 * (Stake's totals are still settling), then for six hours. If Stake can't be
 * reached, the last copy is served.
 */

import { PLATFORMS, finishedRaces, getRaceWindow, prizePool, prizesFor, raceId } from '../shared/leaderboard.js'
import type { ArchivedRace, ArchivedRaceSummary, Platform } from '../shared/leaderboard.js'
import { LeaderboardError, fetchPlatform, rankEntries } from './stakeLeaderboard.js'
import type { FetchOptions, Tokens } from './stakeLeaderboard.js'

/** How long after a race ends its totals may still move */
const SETTLE_MS = 2 * 60 * 60_000
const FRESH_SETTLING_MS = 5 * 60_000
const FRESH_FINAL_MS = 6 * 60 * 60_000
/** The newest races shown, and how many are read from Stake at once */
const MAX_RACES = 12
const AT_ONCE = 4

type Window = { start: number; end: number }
type Result = { status: number; body: unknown; /** seconds a shared cache may keep the answer; 0 = not at all */ maxAge: number }

const cache = new Map<string, { at: number; race: ArchivedRace }>()
const pending = new Map<string, Promise<ArchivedRace>>()

async function loadRace(window: Window, tokens: Tokens, options: FetchOptions): Promise<ArchivedRace> {
  const platforms = (Object.keys(PLATFORMS) as Platform[]).filter((p) => tokens[p])
  if (platforms.length === 0) throw new LeaderboardError('Leaderboard is not configured', 503)
  // Final standings need every site: a board missing one would name the wrong winners, so one failure fails the race
  const rows = (await Promise.all(platforms.map((p) => fetchPlatform(p, window, tokens[p]!, options)))).flat()
  const prizes = prizesFor(window.start)
  return { id: raceId(window.start), start: window.start, end: window.end, prizes, entries: rankEntries(rows, prizes, tokens.hidden) }
}

export async function getFinishedRace(window: Window, tokens: Tokens, options: FetchOptions = {}): Promise<ArchivedRace> {
  const now = options.now ?? Date.now()
  const id = raceId(window.start)
  const hit = cache.get(id)
  const freshFor = now - window.end < SETTLE_MS ? FRESH_SETTLING_MS : FRESH_FINAL_MS
  if (hit && now - hit.at < freshFor) return hit.race

  let loading = pending.get(id)
  if (!loading) {
    loading = loadRace(window, tokens, options)
      .then((race) => {
        cache.set(id, { at: now, race })
        return race
      })
      .finally(() => pending.delete(id))
    pending.set(id, loading)
  }
  // An older copy answers if Stake can't be reached
  return hit ? loading.catch(() => hit.race) : loading
}

const summary = (race: ArchivedRace): ArchivedRaceSummary => ({
  id: race.id,
  start: race.start,
  end: race.end,
  pool: prizePool(race.prizes),
  winner: race.entries[0]?.name ?? null,
})

/** A shared cache must let go of an answer by the time the running race ends: that is when a new one appears here */
function maxAgeSeconds(now: number, newestEnd: number | undefined) {
  const untilNextRaceEnds = Math.floor((getRaceWindow(now).end - now) / 1000)
  const settling = newestEnd !== undefined && now - newestEnd < SETTLE_MS
  return Math.max(0, Math.min(settling ? 300 : 3600, untilNextRaceEnds))
}

export async function handleArchiveRequest(raceParam: string | null, tokens: Tokens, options: FetchOptions = {}): Promise<Result> {
  const now = options.now ?? Date.now()
  const windows = finishedRaces(now, MAX_RACES)
  const maxAge = maxAgeSeconds(now, windows[0]?.end)

  if (raceParam !== null) {
    const window = windows.find((w) => raceId(w.start) === raceParam)
    if (!window) return { status: 404, body: { error: 'No finished leaderboard with that date.' }, maxAge: 0 }
    try {
      return { status: 200, body: { race: await getFinishedRace(window, tokens, options) }, maxAge }
    } catch (err) {
      const status = err instanceof LeaderboardError ? err.status : 500
      return { status, body: { error: err instanceof Error ? err.message : 'Leaderboard unavailable' }, maxAge: 0 }
    }
  }

  const races: ArchivedRaceSummary[] = []
  let complete = true
  for (let i = 0; i < windows.length; i += AT_ONCE) {
    const batch = await Promise.allSettled(windows.slice(i, i + AT_ONCE).map((w) => getFinishedRace(w, tokens, options)))
    for (const result of batch) {
      if (result.status === 'fulfilled') races.push(summary(result.value))
      else complete = false
    }
  }
  // A race that could not be read is left out for now, and the answer is not kept, so it is tried again
  return { status: 200, body: { races }, maxAge: complete ? maxAge : 0 }
}
