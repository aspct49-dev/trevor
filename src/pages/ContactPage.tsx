import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { CONTACT_LIMITS, validateContact } from '../../shared/contact'
import type { ContactErrors, ContactResponse, ContactValues } from '../../shared/contact'
import { PAGES } from '../../shared/seo'
import { external, socialUrl } from '../../shared/site'
import { trackEvent } from '../analytics'
import { Breadcrumbs } from '../components/ui'

const FIELDS: (keyof ContactValues)[] = ['name', 'reply', 'message']

/**
 * The contact form. Messages go to /api/contact, which forwards them to
 * Trevor's team (server/contact.ts). If no destination is configured the
 * form is replaced by the other ways to get in touch, so nobody writes a
 * message that can't be delivered.
 */
export function ContactPage() {
  /** null while asking the server whether the form can deliver */
  const [available, setAvailable] = useState<boolean | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [errors, setErrors] = useState<ContactErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const openedAt = useRef(0)

  useEffect(() => {
    openedAt.current = Date.now()
    let stopped = false
    fetch('/api/contact')
      .then((res) => res.json() as Promise<ContactResponse>)
      .then((body) => !stopped && setAvailable(Boolean(body.configured)))
      .catch(() => !stopped && setAvailable(false))
    return () => {
      stopped = true
    }
  }, [])

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'sending') return
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>

    const found = validateContact(data).errors
    setErrors(found)
    setFormError(null)
    const firstInvalid = FIELDS.find((field) => found[field])
    if (firstInvalid) {
      form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus()
      return
    }

    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, elapsed: Date.now() - openedAt.current }),
      })
      const body = (await res.json().catch(() => ({}))) as ContactResponse
      if (res.ok && body.ok) {
        setStatus('sent')
        trackEvent('contact_submit')
        return
      }
      if (res.status === 503) setAvailable(false)
      setErrors(body.fields || {})
      setFormError(body.error || 'Something went wrong. Please try again.')
    } catch {
      setFormError('Could not reach the server. Check your connection and try again.')
    }
    setStatus('idle')
  }

  const again = () => {
    openedAt.current = Date.now()
    setStatus('idle')
  }

  const field = (name: keyof ContactValues) => ({
    id: `contact-${name}`,
    name,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `contact-${name}-error` : undefined,
  })
  const error = (name: keyof ContactValues) =>
    errors[name] && (
      <p id={`contact-${name}-error`} className="contact__error">
        {errors[name]}
      </p>
    )

  return (
    <main className="legal contact">
      <Breadcrumbs current={PAGES['/contact'].crumb} />
      <header className="legal__head">
        <h1 className="legal__title grad-silver">Contact</h1>
        <p className="legal__intro">Questions about the leaderboard, a prize, or this site? Send a message.</p>
      </header>

      {available === false ? (
        <div className="contact__panel" role="status">
          <h2>The form isn't switched on yet</h2>
          <p>
            Message Trevor on{' '}
            <a href={socialUrl('x')} {...external}>
              X
            </a>{' '}
            or{' '}
            <a href={socialUrl('discord')} {...external}>
              Discord
            </a>{' '}
            instead, with the username shown on the board if it's about a prize.
          </p>
        </div>
      ) : status === 'sent' ? (
        <div className="contact__panel contact__panel--sent" role="status">
          <h2>Message sent</h2>
          <p>Thanks. We'll reply using the details you gave.</p>
          <button type="button" className="ranking__more" onClick={again}>
            SEND ANOTHER
          </button>
        </div>
      ) : (
        <form className="contact__form" onSubmit={submit} noValidate>
          <div className="contact__field">
            <label htmlFor="contact-name">
              Name <span className="contact__optional">(optional)</span>
            </label>
            <input type="text" autoComplete="name" maxLength={CONTACT_LIMITS.name} {...field('name')} />
            {error('name')}
          </div>

          <div className="contact__field">
            <label htmlFor="contact-reply">How can we reply?</label>
            <input
              type="text"
              autoComplete="email"
              placeholder="Email, or your Kick / X / Discord username"
              maxLength={CONTACT_LIMITS.reply}
              required
              {...field('reply')}
            />
            {error('reply')}
          </div>

          <div className="contact__field">
            <label htmlFor="contact-message">Message</label>
            <textarea rows={7} maxLength={CONTACT_LIMITS.message} required {...field('message')} />
            {error('message')}
          </div>

          {/* Hidden from people; bots that fill every field give themselves away */}
          <div className="contact__trap" aria-hidden="true">
            <label htmlFor="contact-website">Website</label>
            <input type="text" id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="contact__submit">
            <button type="submit" className="btn btn--blue contact__send" disabled={status === 'sending' || available === null}>
              {status === 'sending' ? 'SENDING…' : 'SEND MESSAGE'}
            </button>
            <p className="contact__form-error" role="alert">
              {formError}
            </p>
          </div>
          <p className="contact__note">
            For anything about your Stake.com or Stake.us account itself, contact that site's support; we have no
            access to it.
          </p>
        </form>
      )}
    </main>
  )
}
