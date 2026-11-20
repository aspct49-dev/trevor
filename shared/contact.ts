/*
 * The contact form's rules, shared by the page (instant feedback) and the
 * server (the check that counts). Plain TypeScript, no Node or DOM.
 */

export const CONTACT_LIMITS = { name: 80, replyMin: 2, reply: 120, messageMin: 10, message: 2000 }

export type ContactValues = { name: string; reply: string; message: string }
export type ContactErrors = Partial<Record<keyof ContactValues, string>>

/** What the server answers */
export type ContactResponse = {
  ok?: true
  /** GET only: whether a destination is configured (CONTACT_DISCORD_WEBHOOK) */
  configured?: boolean
  error?: string
  fields?: ContactErrors
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export function validateContact(input: Record<string, unknown>): { values: ContactValues; errors: ContactErrors } {
  const values: ContactValues = { name: text(input.name), reply: text(input.reply), message: text(input.message) }
  const errors: ContactErrors = {}

  if (values.name.length > CONTACT_LIMITS.name) errors.name = `Keep your name under ${CONTACT_LIMITS.name} characters.`

  if (!values.reply) errors.reply = 'Tell us how to reply: an email address, or your Kick, X or Discord username.'
  else if (values.reply.length < CONTACT_LIMITS.replyMin) errors.reply = 'That looks too short to reply to.'
  else if (values.reply.length > CONTACT_LIMITS.reply) errors.reply = `Keep this under ${CONTACT_LIMITS.reply} characters.`
  // "@name" is a username; anything with an @ further in is meant as an email address
  else if (values.reply.indexOf('@') > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.reply)) {
    errors.reply = 'That email address does not look right.'
  }

  if (!values.message) errors.message = 'Write your message.'
  else if (values.message.length < CONTACT_LIMITS.messageMin) {
    errors.message = `Add a little more detail (at least ${CONTACT_LIMITS.messageMin} characters).`
  } else if (values.message.length > CONTACT_LIMITS.message) {
    errors.message = `Keep your message under ${CONTACT_LIMITS.message.toLocaleString('en-US')} characters.`
  }

  return { values, errors }
}
