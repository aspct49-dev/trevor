import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { CODE, HELPLINE, MIN_AGE, SOCIALS, STAKE_COM_URL, STAKE_US_URL, external } from '../../shared/site'
import type { Social } from '../../shared/site'

import logo from '../assets/logo.webp'
import gambleAware from '../assets/gambleaware.png'
import socialX from '../assets/social-x.webp'
import socialInstagram from '../assets/social-instagram.webp'
import socialDiscord from '../assets/social-discord.webp'
import socialKick from '../assets/social-kick.webp'
import socialTiktok from '../assets/social-tiktok.webp'

/** The design's social marks, drawn as single-colour silhouettes; `brand` is the hover colour */
const ICONS: Record<Social['id'], { src: string; brand: string }> = {
  kick: { src: socialKick, brand: '#53fc18' },
  discord: { src: socialDiscord, brand: '#5865f2' },
  x: { src: socialX, brand: '#eaf2ff' },
  instagram: { src: socialInstagram, brand: '#e1306c' },
  tiktok: { src: socialTiktok, brand: '#25f4ee' },
}

function SocialIcon({ id }: { id: Social['id'] }) {
  const url = `url("${ICONS[id].src}")`
  return <span className="footer__icon" style={{ maskImage: url, WebkitMaskImage: url }} aria-hidden />
}

const brand = (id: Social['id']) => ({ '--brand': ICONS[id].brand }) as CSSProperties

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__card">
        <div className="footer__top">
          <div className="footer__brand">
            <Link to="/" className="footer__logo" aria-label="Trevor Abney home">
              <img src={logo} alt="The Trevor Abney" width={122} height={64} />
            </Link>

            <div className="footer__marks">
              <a href="https://www.begambleaware.org" {...external}>
                <img className="footer__aware" src={gambleAware} alt="BeGambleAware" width={163} height={24} />
              </a>
              <span className="footer__age">{MIN_AGE}+</span>
            </div>

            <p className="footer__note">
              Trevor Abney is a Stake affiliate and earns a commission when you sign up or play under the code{' '}
              <strong>{CODE}</strong>. This is a community leaderboard site. It is not a casino, and it is not
              operated by Stake. We take no responsibility for losses at any site linked or promoted here; you
              are responsible for your own play.
            </p>
            <p className="footer__note">
              Stake.us is a sweepstakes social casino: no purchase necessary, void where prohibited, and not
              available in every state. Stake.com is not available in the United States.
            </p>
            <p className="footer__note footer__help">
              Gambling problem? Call or text <a href={HELPLINE.tel}>{HELPLINE.number}</a> or chat at{' '}
              <a href={HELPLINE.url} {...external}>
                1800myreset.org
              </a>
              .
            </p>

            <div className="footer__icons" aria-label="Social media">
              {SOCIALS.map((s) => (
                <a key={s.id} href={s.url} {...external} aria-label={s.label} style={brand(s.id)}>
                  <SocialIcon id={s.id} />
                </a>
              ))}
            </div>
          </div>

          <nav className="footer__col" aria-label="Explore">
            <h4>Explore</h4>
            <Link to="/">Home</Link>
            <Link to="/leaderboard">Leaderboard</Link>
            <Link to="/how-to-sign-up">How to Sign Up</Link>
            <Link to="/media">Media</Link>
            <a href={STAKE_COM_URL} {...external}>
              Visit Stake
            </a>
            <a href={STAKE_US_URL} {...external}>
              Visit Stake.us
            </a>
          </nav>

          <nav className="footer__col" aria-label="Social media links">
            <h4>Social Media</h4>
            {SOCIALS.map((s) => (
              <a key={s.id} href={s.url} {...external} style={brand(s.id)}>
                <SocialIcon id={s.id} />
                {s.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="footer__legal">
          <span className="footer__copyright">© {new Date().getUTCFullYear()} Trevor Abney - All Rights Reserved.</span>
          <nav className="footer__policies" aria-label="Policies">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <span className="footer__responsible">{MIN_AGE}+ only · Play responsibly</span>
          </nav>
        </div>
      </div>
    </footer>
  )
}
