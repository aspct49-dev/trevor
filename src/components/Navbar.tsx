import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { STAKE_COM_URL, external } from '../../shared/site'

import logo from '../assets/logo-nav.webp'
import iconHome from '../assets/icon-home.svg'
import iconTrophy from '../assets/icon-trophy-nav.svg'
import iconCamera from '../assets/icon-camera.svg'
import navCaret from '../assets/nav-caret.svg'

const LINKS = [
  { to: '/', label: 'HOME', icon: iconHome },
  { to: '/leaderboard', label: 'LEADERBOARD', icon: iconTrophy },
  { to: '/how-to-sign-up', label: 'HOW TO SIGN UP', icon: null },
  { to: '/media', label: 'MEDIA', icon: iconCamera },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  // Close the mobile menu whenever the page changes
  useEffect(() => setOpen(false), [pathname])

  return (
    <header className="nav">
      <div className="nav__inner">
        <Link to="/" className="nav__logo" aria-label="Trevor Abney — home">
          <img src={logo} alt="The Trevor Abney" width={80} height={42} />
        </Link>

        <button
          type="button"
          className={`nav__toggle ${open ? 'is-open' : ''}`}
          aria-label="Menu"
          aria-expanded={open}
          aria-controls="nav-links"
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav id="nav-links" className={`nav__links ${open ? 'is-open' : ''}`} aria-label="Main">
          {LINKS.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}>
              {icon ? (
                <span className="nav__icon" style={{ maskImage: `url("${icon}")`, WebkitMaskImage: `url("${icon}")` }} />
              ) : (
                <span className="nav__q" aria-hidden>
                  ?
                </span>
              )}
              <span>{label}</span>
              <img className="nav__caret" src={navCaret} alt="" />
            </NavLink>
          ))}
          <a className="btn btn--blue nav__visit nav__visit--menu" href={STAKE_COM_URL} {...external}>
            VISIT STAKE
          </a>
        </nav>

        <a className="btn btn--blue nav__visit" href={STAKE_COM_URL} {...external}>
          VISIT STAKE
        </a>
      </div>
    </header>
  )
}
