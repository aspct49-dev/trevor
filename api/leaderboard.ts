/*
 * Vercel Function: GET /api/leaderboard
 *
 * Set STAKE_COM_API_TOKEN and STAKE_US_API_TOKEN under Project → Settings →
 * Environment Variables. Locally, the Vite dev/preview server serves the same
 * route from .env (see vite.config.ts).
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleLeaderboardRequest, tokensFromEnv } from '../server/stakeLeaderboard.js'

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  const { status, body } = await handleLeaderboardRequest(tokensFromEnv(process.env))

  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  // Shared CDN cache: Stake is called at most about once a minute. A board that is missing a
  // site's fresh standings is only kept briefly, so the fresh one returns as soon as Stake answers
  const partial = 'sources' in body && Object.values(body.sources).some((s) => s === 'error' || s === 'stale')
  res.setHeader(
    'Cache-Control',
    status !== 200 ? 'no-store' : partial ? 'public, s-maxage=15' : 'public, s-maxage=60, stale-while-revalidate=300',
  )
  res.end(JSON.stringify(body))
}
