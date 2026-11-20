/*
 * Whether the Kick channel is live, read from Kick's public channel API (as
 * kingkulbik does). Kept for a minute so Kick is asked about once a minute at
 * most; an older copy is served at once while the next one loads. If Kick
 * can't be reached the last copy is served, or "not known" — the page then
 * shows the offline artwork linking to the channel.
 *
 *   GET /api/kick → { live: { title, viewers } | null, known, at }
 */

import { KICK_CHANNEL } from '../shared/site.js'
import type { KickStatus } from '../shared/site.js'

const KICK_API = `https://kick.com/api/v2/channels/${KICK_CHANNEL}`
const FRESH_MS = 60_000

type RawChannel = {
  livestream?: { session_title?: string; viewer_count?: number } | null
}

let cache: KickStatus | null = null
let pending: Promise<KickStatus> | null = null

async function load(): Promise<KickStatus> {
  const res = await fetch(KICK_API, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Kick replied ${res.status}`)
  const channel = (await res.json()) as RawChannel
  const ls = channel.livestream
  cache = {
    live: ls ? { title: String(ls.session_title ?? ''), viewers: Number(ls.viewer_count) || 0 } : null,
    known: true,
    at: Date.now(),
  }
  return cache
}

export async function handleKickRequest(): Promise<{ status: number; body: KickStatus }> {
  if (!cache || Date.now() - cache.at > FRESH_MS) {
    pending ??= load().finally(() => (pending = null))
    const settled = pending.catch((err: unknown) => {
      console.error('[kick] %s', err instanceof Error ? err.message : 'unreachable')
    })
    // With a copy in hand, answer now and let the refresh land for the next visitor
    if (!cache) await settled
  }
  return { status: 200, body: cache ?? { live: null, known: false, at: Date.now() } }
}
