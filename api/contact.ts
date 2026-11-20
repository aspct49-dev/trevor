/*
 * Vercel Function: GET/POST /api/contact (see server/contact.ts).
 * Set CONTACT_DISCORD_WEBHOOK under Project → Settings → Environment Variables.
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import { clientIp, handleContactRequest, readJson } from '../server/contact.js'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const body = req.method === 'POST' ? await readJson(req) : undefined
  const result = await handleContactRequest(req.method, body, clientIp(req), process.env)

  res.statusCode = result.status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(result.body))
}
