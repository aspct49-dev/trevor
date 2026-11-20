/*
 * Vercel Function: GET /api/leaderboard-archive[?race=<id>], finished races
 * (see server/leaderboardArchive.ts). Uses the same Stake tokens as /api/leaderboard.
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleArchiveRequest } from '../server/leaderboardArchive.js'
import { tokensFromEnv } from '../server/stakeLeaderboard.js'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const { status, body, maxAge } = await handleArchiveRequest(url.searchParams.get('race'), tokensFromEnv(process.env))

  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', status === 200 && maxAge > 0 ? `public, s-maxage=${maxAge}` : 'no-store')
  res.end(JSON.stringify(body))
}
