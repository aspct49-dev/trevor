/*
 * Contact form: checks a message and forwards it to a private Discord channel
 * through a webhook. Nothing is stored on this site.
 *
 *   GET  /api/contact → { configured }      is a destination set up?
 *   POST /api/contact → { ok } | { error, fields }
 *
 * Destination: CONTACT_DISCORD_WEBHOOK (a Discord channel's webhook URL).
 * Without it the form answers 503 and the page points people to the socials.
 *
 * Spam protection: a hidden field only bots fill in, a minimum time on the
 * form, length limits, and a per-address limit. The limit is kept in this
 * server's memory, so on serverless hosting it is best-effort (each instance
 * counts separately).
 */

import type { IncomingMessage } from 'node:http'
import { validateContact } from '../shared/contact.js'
import type { ContactResponse } from '../shared/contact.js'

const MIN_FILL_MS = 3000
const WINDOW_MS = 10 * 60_000
const MAX_PER_WINDOW = 3
const MAX_BODY_BYTES = 16_384

type Env = Record<string, string | undefined>
type Result = { status: number; body: ContactResponse }

const sentAt = new Map<string, number[]>()

function webhookUrl(env: Env) {
  const url = (env.CONTACT_DISCORD_WEBHOOK || '').trim()
  return /^https?:\/\//.test(url) ? url : null
}

/** The JSON body, whether the host already parsed it (Vercel) or not (the dev server) */
export async function readJson(req: IncomingMessage): Promise<unknown> {
  const parsed = (req as IncomingMessage & { body?: unknown }).body
  if (parsed !== undefined) {
    if (typeof parsed !== 'string') return parsed
    try {
      return JSON.parse(parsed)
    } catch {
      return null
    }
  }
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += (chunk as Buffer).length
    if (size > MAX_BODY_BYTES) return null
    chunks.push(chunk as Buffer)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return null
  }
}

export function clientIp(req: IncomingMessage) {
  const forwarded = req.headers['x-forwarded-for']
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded || '').split(',')[0].trim()
  return first || req.socket.remoteAddress || 'unknown'
}

export async function handleContactRequest(
  method: string | undefined,
  body: unknown,
  ip: string,
  env: Env,
  fetchImpl: typeof fetch = fetch,
): Promise<Result> {
  const url = webhookUrl(env)
  if (method === 'GET') return { status: 200, body: { configured: Boolean(url) } }
  if (method !== 'POST') return { status: 405, body: { error: 'Method not allowed' } }
  if (!url) return { status: 503, body: { error: 'The contact form is not set up yet.' } }

  const input = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}

  // Hidden field: people never see it, bots fill it in. Answer as if it worked, and send nothing.
  if (typeof input.website === 'string' && input.website.trim() !== '') return { status: 200, body: { ok: true } }

  const elapsed = Number(input.elapsed)
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) {
    return { status: 400, body: { error: 'That was very quick. Please check your message and send it again.' } }
  }

  const { values, errors } = validateContact(input)
  if (Object.keys(errors).length > 0) {
    return { status: 400, body: { error: 'Please check the highlighted fields.', fields: errors } }
  }

  const now = Date.now()
  const recent = (sentAt.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    return { status: 429, body: { error: 'You have sent a few messages already. Please try again in a little while.' } }
  }

  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        username: 'Website contact form',
        // Nothing a visitor types can ping @everyone or a role
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: 'New message from the website',
            color: 0x52b8ff,
            description: values.message,
            fields: [
              { name: 'From', value: values.name || '(no name given)', inline: true },
              { name: 'Reply to', value: values.reply, inline: true },
            ],
            timestamp: new Date(now).toISOString(),
          },
        ],
      }),
    })
    if (!res.ok) throw new Error(`destination replied ${res.status}`)
  } catch (err) {
    console.error('[contact] not delivered: %s', err instanceof Error ? err.message : 'unknown error')
    return { status: 502, body: { error: 'Your message could not be sent just now. Please try again in a minute.' } }
  }

  sentAt.set(ip, [...recent, now])
  return { status: 200, body: { ok: true } }
}
