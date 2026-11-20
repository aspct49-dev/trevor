/*
 * Site-wide links and copy. Handles are taken from the Figma design and
 * confirmed by Trevor's team.
 */

export const CODE = 'TREV'

export const STAKE_COM_URL = `https://stake.com/?c=${CODE}`
export const STAKE_US_URL = `https://stake.us/?c=${CODE}`

/** Minimum age shown across the site (Stake.us is 21+) */
export const MIN_AGE = 21

/** US National Problem Gambling Helpline (call or text; the number since January 2026) */
export const HELPLINE = { number: '1-800-MY-RESET', tel: 'tel:+18006973738', url: 'https://www.1800myreset.org/' }

/** Props for links that leave the site */
export const external = { target: '_blank', rel: 'noopener noreferrer' } as const

export const KICK_CHANNEL = 'thetrevorabney'
export const TIKTOK_HANDLE = 'thetrevorabney'

/** GET /api/kick: is the channel live right now? (`known` is false when Kick couldn't be reached) */
export type KickStatus = {
  live: { title: string; viewers: number } | null
  known: boolean
  at: number
}

export type Social = {
  id: 'x' | 'instagram' | 'discord' | 'kick' | 'tiktok'
  /** As titled on the Home cards (the design's wording) */
  name: string
  /** Plain name, for the footer and screen readers */
  label: string
  handle: string
  url: string
  cta: string
}

export const SOCIALS: Social[] = [
  { id: 'x', name: 'TWITTER', label: 'X / Twitter', handle: '@thetrevorabney', url: 'https://x.com/thetrevorabney', cta: 'CLICK HERE' },
  { id: 'instagram', name: 'INSTAGRAM', label: 'Instagram', handle: '@trevor_abney', url: 'https://www.instagram.com/trevor_abney', cta: 'CLICK HERE' },
  { id: 'discord', name: 'DISCORD', label: 'Discord', handle: './trevorabney', url: 'https://discord.gg/GmpuXrhkn', cta: 'CLICK HERE' },
  { id: 'kick', name: 'KICK.COM', label: 'Kick', handle: `@${KICK_CHANNEL}`, url: `https://kick.com/${KICK_CHANNEL}`, cta: 'WATCH HERE' },
  { id: 'tiktok', name: 'TIK TOK', label: 'TikTok', handle: `@${TIKTOK_HANDLE}`, url: `https://www.tiktok.com/@${TIKTOK_HANDLE}`, cta: 'CLICK HERE' },
]

export const socialUrl = (id: Social['id']) => SOCIALS.find((s) => s.id === id)!.url
