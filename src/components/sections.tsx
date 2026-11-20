import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { SOCIALS, external } from '../../shared/site'
import { useHoverAnimation } from '../hooks'
import type { Social } from '../../shared/site'
import { Hex, SectionDivider } from './ui'
import { PodiumCard } from './leaderboard'

import socialX from '../assets/social-x.webp'
import socialInstagram from '../assets/social-instagram.webp'
import socialDiscord from '../assets/social-discord.webp'
import socialKick from '../assets/social-kick.webp'
import socialTiktok from '../assets/social-tiktok.webp'
import sectionLink from '../assets/section-link.svg'
import rewardCardBg from '../assets/reward-card-bg.webp'
import rewardGift from '../assets/reward-gift.webp'

/* ——————————————————————— Follow my socials ——————————————————————— */

const SOCIAL_ICONS: Record<Social['id'], { src: string; width: number; height: number }> = {
  x: { src: socialX, width: 72, height: 65 },
  instagram: { src: socialInstagram, width: 65, height: 65 },
  discord: { src: socialDiscord, width: 70, height: 56 },
  kick: { src: socialKick, width: 54, height: 73 },
  tiktok: { src: socialTiktok, width: 56, height: 65 },
}

export function SocialsSection() {
  return (
    <section className="socials" aria-labelledby="socials-title">
      <SectionDivider className="socials__divider" reveal>
        <Hex glow>
          <img src={sectionLink} alt="" />
        </Hex>
        <div className="socials__heading">
          <h2 id="socials-title" className="socials__title">
            <span className="grad-blue">FOLLOW </span>
            <span className="grad-silver">MY SOCIALS</span>
          </h2>
          <p className="socials__sub">Giveaways, content, fun &amp; more!</p>
        </div>
      </SectionDivider>

      <div className="socials__grid">
        {SOCIALS.map((s, i) => (
          <SocialCard key={s.id} social={s} index={i} />
        ))}
      </div>
    </section>
  )
}

function SocialCard({ social: s, index }: { social: Social; index: number }) {
  const icon = SOCIAL_ICONS[s.id]
  const { handlers, hoverClass } = useHoverAnimation()
  return (
    <article
      className={`social-card social-card--${s.id} ${hoverClass}`}
      data-reveal="up"
      style={{ '--reveal-delay': `${index * 80}ms` } as CSSProperties}
      {...handlers}
    >
      <span className="social-card__icon">
        <img src={icon.src} alt="" width={icon.width} height={icon.height} />
      </span>
      <h3 className="social-card__name grad-blue">{s.name}</h3>
      <p className="social-card__handle">{s.handle}</p>
      <a className="btn btn--blue social-card__btn" href={s.url} {...external} aria-label={`${s.name}: ${s.cta}`}>
        {s.cta}
      </a>
    </article>
  )
}

/* ——————————————————————— Reward cards ——————————————————————— */

/** The design's sample podium, shrunk into the reward-card artwork */
function MiniPodium() {
  const sample = (amount: number) => ({ name: 'TREV**172', amount, platform: 'com' as const })
  return (
    <div className="mini-podium" aria-hidden>
      <div className="mini-podium__slot mini-podium__slot--2">
        <PodiumCard place={2} entry={sample(253832.92)} prize={10000} />
      </div>
      <div className="mini-podium__slot mini-podium__slot--3">
        <PodiumCard place={3} entry={sample(175531.72)} prize={5000} />
      </div>
      <div className="mini-podium__slot mini-podium__slot--1">
        <PodiumCard place={1} entry={sample(329832.92)} prize={20000} />
      </div>
    </div>
  )
}

const REWARDS = [
  {
    to: '/leaderboard',
    title: (
      <>
        <span className="accent-light">$</span>50,000 Leaderboard
      </>
    ),
    text: ['Climb to the top & secure top', 'place for big prizes!'],
    art: <MiniPodium />,
  },
  {
    to: '/media',
    title: (
      <>
        Stream <span className="accent-light">Giveaways</span>
      </>
    ),
    text: ['Watch my stream and have', 'a chance to win $$$.'],
    art: <img className="reward-card__gift" src={rewardGift} alt="" />,
  },
  {
    to: '/leaderboard',
    title: (
      <>
        <span className="accent-light">$</span>10,000 Leaderboard
      </>
    ),
    text: ['Climb to the top & secure top', 'place for big prizes!'],
    art: <MiniPodium />,
  },
]

function RewardCard({ reward: r, index }: { reward: (typeof REWARDS)[number]; index: number }) {
  const { handlers, hoverClass } = useHoverAnimation()
  return (
    <Link
      to={r.to}
      className={`reward-card ${hoverClass}`}
      data-reveal="up"
      style={{ '--reveal-delay': `${index * 110}ms` } as CSSProperties}
      {...handlers}
    >
      <span className="reward-card__art">
        <img className="reward-card__bg" src={rewardCardBg} alt="" />
        <span className="reward-card__motion">{r.art}</span>
      </span>
      <h3 className="reward-card__title">{r.title}</h3>
      <p className="reward-card__text">
        {r.text[0]}
        <br />
        {r.text[1]}
      </p>
    </Link>
  )
}

export function RewardCards() {
  return (
    <div className="rewards">
      {REWARDS.map((r, i) => (
        <RewardCard key={i} reward={r} index={i} />
      ))}
    </div>
  )
}
