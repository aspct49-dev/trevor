/*
 * Stake affiliate leaderboard proxy — server-side only.
 *
 * The browser calls /api/leaderboard. This module calls Stake's affiliate API
 * for Stake.com and Stake.us with the secret tokens, merges both into one
 * ranked board and returns only what the page needs: a masked name, the
 * amount, the prize per place and the platform.
 *
 *   GET https://api.stake.com/affiliate/leaderboard   (and api.stake.us)
 *     ?timePeriod=customRange&isStakeExclusive=false&limit=<n>
 *     &startDate=<epoch ms>&endDate=<epoch ms, inclusive>
 *   x-access-token: <token>
 *   → text/csv: rank,user_name,campaign_code,total_wagered_amount (USD) | total_played_amount (USD),
 *               total_weighted_amount (USD),last_updated_at
 *
 * Docs: https://docs.stake.com/#tag/Affiliate/operation/LeaderboardCsv
 *
 * Tokens are read from the environment and are never sent to the browser,
 * logged, or included in error messages.
 */

import { PLATFORMS, PRIZES, RANK_BY, getRaceWindow, maskName } from '../shared/leaderboard.js'
import type { LeaderboardEntry, LeaderboardResponse, Platform, SourceStatus } from '../shared/leaderboard.js'

const REQUEST_TIMEOUT_MS = 8000
const CACHE_TTL_MS = 60_000
/** Past the minute, a copy this old is still served at once while a fresh one is fetched behind it */
const STALE_OK_MS = 30 * 60_000

export type Tokens = Partial<Record<Platform, string>> & {
  /** Full usernames shown as "Hidden" on the board, lowercased (LEADERBOARD_HIDDEN_USERS) */
  hidden?: Set<string>
}

/** Tokens from the environment: STAKE_COM_API_TOKEN / STAKE_US_API_TOKEN, or the lowercase names in .env */
export function tokensFromEnv(env: Record<string, string | undefined>): Tokens {
  const hidden = (env.LEADERBOARD_HIDDEN_USERS || '')
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean)
  return {
    com: env.STAKE_COM_API_TOKEN || env.stake_com_api || undefined,
    us: env.STAKE_US_API_TOKEN || env.stake_us_api || undefined,
    hidden: new Set(hidden),
  }
}

export class LeaderboardError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

/** Minimal RFC 4180 parser: handles quoted fields, escaped quotes and CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') {
        quoted = false
      } else {
        field += c
      }
    } else if (c === '"') {
      quoted = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      if (row.some((cell) => cell.trim() !== '')) rows.push(row)
      row = []
      field = ''
    } else {
      field += c
    }
  }
  row.push(field)
  if (row.some((cell) => cell.trim() !== '')) rows.push(row)
  return rows
}

const toNumber = (value: string | undefined) => {
  const n = Number(String(value ?? '').replace(/[$,\s]/g, ''))
  return Number.isFinite(n) ? n : 0
}

/**
 * Columns are found by name rather than position, and loosely: Stake.com
 * says "total_wagered_amount (USD)", Stake.us says "total_played_amount (USD)".
 */
export function parseLeaderboardCsv(csv: string) {
  const [header, ...rows] = parseCsv(csv)
  if (!header) return []
  const cols = header.map((h) => h.trim().toLowerCase())
  const find = (...names: string[]) => cols.findIndex((c) => names.some((n) => c.startsWith(n)))

  const iRank = find('rank')
  const iName = find('user_name', 'username', 'user')
  const iWagered = find('total_wagered', 'total_played', 'wagered', 'played')
  const iWeighted = find('total_weighted', 'weighted')
  if (iName < 0 || (iWagered < 0 && iWeighted < 0)) {
    throw new LeaderboardError('Unexpected CSV columns', 502)
  }

  return rows.map((r) => {
    const wagered = iWagered >= 0 ? toNumber(r[iWagered]) : 0
    return {
      rank: iRank >= 0 ? toNumber(r[iRank]) : 0,
      name: (r[iName] ?? '').trim(),
      wagered,
      // Without a weighted column, raw wager is the ranking amount
      weighted: iWeighted >= 0 ? toNumber(r[iWeighted]) : wagered,
    }
  })
}

type Row = ReturnType<typeof parseLeaderboardCsv>[number] & { platform: Platform }

type FetchOptions = { now?: number; fetchImpl?: typeof fetch; apiUrls?: Partial<Record<Platform, string>> }

/** One platform's standings for the race window, unmasked (server-side only) */
async function fetchPlatform(
  platform: Platform,
  window: { start: number; end: number },
  token: string,
  { fetchImpl = fetch, apiUrls = {} }: FetchOptions,
): Promise<Row[]> {
  const url = new URL(apiUrls[platform] ?? PLATFORMS[platform].apiUrl)
  url.search = new URLSearchParams({
    timePeriod: 'customRange',
    isStakeExclusive: 'false',
    limit: String(Math.max(PRIZES.length, 50)),
    startDate: String(window.start),
    endDate: String(window.end - 1), // Stake's endDate is inclusive
  }).toString()

  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), REQUEST_TIMEOUT_MS)

  let csv: string
  try {
    const upstream = await fetchImpl(url, {
      headers: { 'x-access-token': token, Accept: 'text/csv' },
      signal: abort.signal,
    })
    csv = await upstream.text()
    if (!upstream.ok) {
      // Report the status only, never the token or the request URL.
      console.error('[leaderboard] %s: Stake responded %s', platform, upstream.status)
      throw new LeaderboardError(`Stake responded ${upstream.status}`, 502)
    }
  } catch (err) {
    if (err instanceof LeaderboardError) throw err
    const timedOut = err instanceof Error && err.name === 'AbortError'
    console.error('[leaderboard] %s: Stake %s', platform, timedOut ? 'timed out' : 'unreachable')
    throw new LeaderboardError(timedOut ? 'Stake timed out' : 'Stake unreachable', 504)
  } finally {
    clearTimeout(timer)
  }

  return parseLeaderboardCsv(csv).map((row) => ({ ...row, platform }))
}

/**
 * Both platforms ranked together by the ranking amount: paid places only,
 * names masked. Players with nothing counted yet are left out, so they never
 * sit in a paying place ahead of an empty slot.
 */
export function rankEntries(rows: Row[], prizes: number[] = PRIZES, hidden?: Set<string>): LeaderboardEntry[] {
  const amountOf = (row: Row) => (RANK_BY === 'weighted' ? row.weighted : row.wagered)
  return rows
    .filter((row) => row.name && amountOf(row) > 0)
    .sort((a, b) => amountOf(b) - amountOf(a) || a.rank - b.rank)
    .slice(0, prizes.length)
    .map((row, i) => ({
      rank: i + 1,
      // A player who asked not to be named keeps their place; only the name goes
      name: hidden?.has(row.name.toLowerCase()) ? 'Hidden' : maskName(row.name),
      amount: amountOf(row),
      prize: prizes[i] ?? 0,
      platform: row.platform,
    }))
}

const cache = new Map<number, { at: number; data: LeaderboardResponse }>()
/**
 * Each site's last good standings for the current race. If one site doesn't
 * answer, its last standings stay in the ranking, so the board is always the
 * two sites together and places don't jump while Stake is briefly unreachable.
 */
const lastGood = new Map<Platform, { start: number; rows: Row[] }>()
let refreshing: Promise<LeaderboardResponse> | null = null

async function buildLeaderboard(tokens: Tokens, options: FetchOptions): Promise<LeaderboardResponse> {
  const now = options.now ?? Date.now()
  const window = getRaceWindow(now)
  const platforms = Object.keys(PLATFORMS) as Platform[]

  const results = await Promise.allSettled(
    platforms.map((p) => (tokens[p] ? fetchPlatform(p, window, tokens[p]!, options) : Promise.resolve(null))),
  )

  const sources = {} as Record<Platform, SourceStatus>
  const rows: Row[] = []
  results.forEach((result, i) => {
    const p = platforms[i]
    if (!tokens[p]) sources[p] = 'unconfigured'
    else if (result.status === 'fulfilled') {
      sources[p] = 'ok'
      const fresh = result.value ?? []
      lastGood.set(p, { start: window.start, rows: fresh })
      rows.push(...fresh)
    } else {
      const kept = lastGood.get(p)
      if (kept && kept.start === window.start) {
        sources[p] = 'stale'
        rows.push(...kept.rows)
      } else sources[p] = 'error'
    }
  })

  // Nothing came back at all: fail, so the cache keeps serving the last good board
  if (!platforms.some((p) => sources[p] === 'ok' || sources[p] === 'stale')) {
    const anyConfigured = platforms.some((p) => tokens[p])
    throw new LeaderboardError(anyConfigured ? 'Stake unavailable' : 'Leaderboard is not configured', anyConfigured ? 502 : 503)
  }

  const data: LeaderboardResponse = { window, entries: rankEntries(rows, PRIZES, tokens.hidden), prizes: PRIZES, sources, updatedAt: now }
  // Only a fully fresh board is kept for the whole minute; otherwise Stake is asked again sooner
  const fresh = platforms.every((p) => sources[p] === 'ok' || sources[p] === 'unconfigured')
  cache.set(window.start, { at: fresh ? now : now - CACHE_TTL_MS + 15_000, data })
  return data
}

export async function getLeaderboard(tokens: Tokens, options: FetchOptions = {}): Promise<LeaderboardResponse> {
  const now = options.now ?? Date.now()
  const key = getRaceWindow(now).start
  const hit = cache.get(key)
  if (hit && now - hit.at < CACHE_TTL_MS) return hit.data

  // One request to Stake at a time, however many visitors arrive
  if (!refreshing) refreshing = buildLeaderboard(tokens, options).finally(() => (refreshing = null))
  const pending = refreshing
  // A recent copy answers straight away; the fresh one replaces it when Stake replies
  if (hit && now - hit.at < STALE_OK_MS) {
    pending.catch(() => undefined)
    return hit.data
  }
  return pending
}

/** Framework-agnostic handler: env tokens → status + JSON body. */
export async function handleLeaderboardRequest(tokens: Tokens, options: FetchOptions = {}) {
  if (!tokens.com && !tokens.us) {
    return { status: 503, body: { error: 'Leaderboard is not configured' } }
  }
  try {
    return { status: 200, body: await getLeaderboard(tokens, options) }
  } catch (err) {
    const status = err instanceof LeaderboardError ? err.status : 500
    return { status, body: { error: err instanceof Error ? err.message : 'Leaderboard unavailable' } }
  }
}
