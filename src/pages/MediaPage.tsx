import { useEffect, useRef, useState } from 'react'
import { KICK_CHANNEL, TIKTOK_HANDLE, external, socialUrl } from '../../shared/site'
import { delay, useKickLive } from '../hooks'

import kickLogo from '../assets/kick-logo.webp'
import tiktokLogo from '../assets/tiktok-logo.webp'
import streamBox from '../assets/stream-box.webp'
import tiktokThumb from '../assets/tiktok-thumb.webp'

/**
 * Live: Kick's player, playing on its own (muted — browsers only allow
 * autoplay without sound; the player's own controls unmute it).
 * Offline: the stream artwork, linking to the channel.
 */
function KickPlayer() {
  const live = useKickLive()
  return (
    <div className="stream-box">
      {live ? (
        <iframe
          src={`https://player.kick.com/${KICK_CHANNEL}?autoplay=true&muted=true`}
          title={live.title ? `Live on Kick: ${live.title}` : 'Trevor Abney live on Kick'}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <a className="stream-box__poster" href={socialUrl('kick')} {...external} aria-label="Trevor Abney on Kick">
          <img src={streamBox} alt="" />
        </a>
      )}
    </div>
  )
}

const TIKTOK_THUMBS = 7
const TIKTOK_ORIGIN = 'https://www.tiktok.com'
/** How long TikTok's widget gets to show up before the thumbnail row is left in place */
const TIKTOK_WAIT_MS = 8000

/** The designed thumbnail row: shown until TikTok's widget is up, and kept wherever TikTok can't load */
function TikTokRow() {
  return (
    <div className="tiktok-row">
      {Array.from({ length: TIKTOK_THUMBS }, (_, i) => (
        <a
          key={i}
          className="tiktok-row__item"
          href={socialUrl('tiktok')}
          {...external}
          aria-label={`TikTok video ${i + 1}`}
          data-reveal="up"
          style={delay(i * 70)}
        >
          <img src={tiktokThumb} alt="" width={144} height={256} loading="lazy" />
        </a>
      ))}
    </div>
  )
}

/**
 * TikTok's official profile widget: his latest videos, updated by TikTok with
 * every new post. TikTok's script turns the <blockquote> into a frame, and the
 * frame messages this page once it has real content; only then does the widget
 * replace the thumbnail row. Where TikTok is blocked (some countries, ad
 * blockers) no message comes, the widget is removed and the row stays.
 */
function TikTokFeed() {
  const holder = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = holder.current
    if (!el) return
    // TikTok's script rewrites this markup, so it is kept out of React's hands
    el.innerHTML = `<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@${TIKTOK_HANDLE}" data-unique-id="${TIKTOK_HANDLE}" data-embed-type="creator" style="max-width: 780px; min-width: 288px;"><section><a target="_blank" rel="noopener noreferrer" href="https://www.tiktok.com/@${TIKTOK_HANDLE}?refer=creator_embed">@${TIKTOK_HANDLE}</a></section></blockquote>`

    const script = document.createElement('script')
    script.src = `${TIKTOK_ORIGIN}/embed.js`
    script.async = true
    document.body.appendChild(script)

    // A loaded widget reports its content height: '{"signalSource":"__tt_embed__…","height":…}'
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== TIKTOK_ORIGIN || typeof e.data !== 'string') return
      try {
        const signal = JSON.parse(e.data) as { signalSource?: unknown; height?: unknown }
        if (String(signal.signalSource).includes('__tt_embed__') && Number(signal.height) > 0) setReady(true)
      } catch {
        // Not the widget's signal
      }
    }
    window.addEventListener('message', onMessage)
    const giveUp = window.setTimeout(() => {
      setReady((isReady) => {
        if (!isReady) el.innerHTML = ''
        return isReady
      })
    }, TIKTOK_WAIT_MS)

    return () => {
      window.removeEventListener('message', onMessage)
      window.clearTimeout(giveUp)
      script.remove()
      el.innerHTML = ''
    }
  }, [])

  return (
    <>
      <div ref={holder} className={`tiktok-widget${ready ? ' is-ready' : ''}`} />
      {!ready && <TikTokRow />}
    </>
  )
}

export function MediaPage() {
  return (
    <main className="media">
      {/* The design has no visible page title, so the page's one H1 is for screen readers and search engines */}
      <h1 className="sr-only">Trevor Abney live streams and videos</h1>
      <section className="media-block" aria-labelledby="kick-title" data-reveal="up">
        <header className="media-head">
          <img className="media-head__logo" src={kickLogo} alt="" width={33} height={37} />
          <div className="media-head__text">
            <h2 id="kick-title" className="media-head__title">
              <span className="grad-light">Watch me</span> <span className="grad-green">Live</span>{' '}
              <span className="grad-light">on Kick</span>
            </h2>
            <p className="media-head__handle">@{KICK_CHANNEL}</p>
          </div>
          <a className="btn btn--green media-head__btn" href={socialUrl('kick')} {...external}>
            Follow Here
          </a>
        </header>
        <KickPlayer />
      </section>

      <section className="media-block" aria-labelledby="tiktok-title">
        <header className="media-head" data-reveal="up">
          <img className="media-head__logo" src={tiktokLogo} alt="" width={28} height={35} />
          <div className="media-head__text">
            <h2 id="tiktok-title" className="media-head__title">
              <span className="grad-light">Check out my</span> <span className="grad-sky">Tik Tok</span>
            </h2>
            <p className="media-head__handle">@{TIKTOK_HANDLE}</p>
          </div>
          <a className="btn btn--sky media-head__btn" href={socialUrl('tiktok')} {...external}>
            Watch Here
          </a>
        </header>
        <TikTokFeed />
      </section>

    </main>
  )
}
