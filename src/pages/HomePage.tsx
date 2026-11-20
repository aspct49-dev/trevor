import { Link } from 'react-router'
import { PRIZES, prizePool } from '../../shared/leaderboard'
import { CODE } from '../../shared/site'
import { delay, useLeaderboard } from '../hooks'
import {
  CodeButtons,
  Diamond,
  FloatingSymbol,
  Hex,
  LeaderboardTitle,
  PartnerLogos,
  PlatBadge,
  SectionDivider,
} from '../components/ui'
import { Podium } from '../components/leaderboard'
import { SocialsSection } from '../components/sections'

import bgHome from '../assets/bg-home.webp'
import bgStake from '../assets/bg-stake.webp'
import logo from '../assets/logo.webp'
import logoMask from '../assets/logo-mask.webp'
import logoGlow from '../assets/logo-glow.svg'
import scrollArrow from '../assets/scroll-arrow.svg'
import sectionTrophy from '../assets/section-trophy.svg'
import iconUsers from '../assets/icon-users.svg'
import iconTrophyBtn from '../assets/icon-trophy-btn.svg'
import podiumFade from '../assets/podium-fade.png'

export function HomePage() {
  const { data } = useLeaderboard()
  const prizes = data?.prizes ?? PRIZES

  return (
    <main className="home">
      <section className="home-hero">
        <img className="page-bg home-hero__bg" src={bgHome} alt="" />

        <div className="home-hero__brand" data-reveal="zoom">
          <img className="home-hero__glow" src={logoGlow} alt="" />
          <span
            className="home-hero__shadow"
            style={{ maskImage: `url("${logoMask}")`, WebkitMaskImage: `url("${logoMask}")` }}
            aria-hidden
          />
          <h1 className="home-hero__logo">
            <img src={logo} alt="The Trevor Abney" width={548} height={286} fetchPriority="high" />
          </h1>
          <FloatingSymbol className="home-hero__plat" rotation={-6.57} idle={0.6}>
            <PlatBadge />
          </FloatingSymbol>
          <FloatingSymbol className="home-hero__diamond" rotation={9.79} idle={2.7}>
            <Diamond />
          </FloatingSymbol>
        </div>

        <p className="home-hero__sub" data-reveal="up" style={delay(120)}>
          Sign up under code <strong>{CODE}</strong> and become eligible for all of our rewards &amp; benefits!
        </p>
        <div data-reveal="up" style={delay(220)}>
          <CodeButtons />
        </div>

        <a className="scroll-hint" href="#leaderboard" data-reveal="fade" style={delay(420)}>
          SCROLL DOWN TO VIEW MORE
          <img src={scrollArrow} alt="" />
        </a>
      </section>

      <div className="band">
        <SectionDivider reveal>
          <Hex glow>
            <img src={sectionTrophy} alt="" />
          </Hex>
        </SectionDivider>
      </div>

      <section id="leaderboard" className="home-lb">
        <img className="page-bg home-lb__bg" src={bgStake} alt="" loading="lazy" decoding="async" />
        <div data-reveal="fade">
          <PartnerLogos />
        </div>
        <LeaderboardTitle pool={prizePool(prizes)} as="h2" />
        <div className="home-lb__actions" data-reveal="up" style={delay(120)}>
          <span className="pill">
            <img src={iconUsers} alt="" />
            {prizes.length} Places
          </span>
          <Link className="btn btn--blue home-lb__view" to="/leaderboard">
            <img src={iconTrophyBtn} alt="" />
            View Leaderboard
          </Link>
        </div>
        <div className="home-lb__podium">
          <Podium entries={data?.entries ?? []} prizes={prizes} compact />
          <img className="home-lb__fade" src={podiumFade} alt="" loading="lazy" decoding="async" />
        </div>
      </section>

      <SocialsSection />
    </main>
  )
}
