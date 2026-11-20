/*
 * Vercel Function: GET /api/kick — whether the Kick channel is live.
 * Locally, the Vite dev/preview server serves the same route (see vite.config.ts).
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleKickRequest } from '../server/kick.js'

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  const { status, body } = await handleKickRequest()

  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  // Shared CDN cache: Kick is asked about once a minute at most
  res.setHeader('Cache-Control', body.known ? 'public, s-maxage=60, stale-while-revalidate=300' : 'no-store')
  res.end(JSON.stringify(body))
}
