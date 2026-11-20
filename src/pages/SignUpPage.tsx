import type { ReactNode } from 'react'
import { CODE, STAKE_COM_URL, external } from '../../shared/site'
import { AffiliateNote, CodeBox, Hex, PartnerLogos, VisitButton } from '../components/ui'
import { RewardCards } from '../components/sections'
import { delay } from '../hooks'

import bgHome from '../assets/bg-home.webp'
import band from '../assets/band.png'
import signupArc from '../assets/signup-arc.svg'
import lineLeft from '../assets/signup-line-left.svg'
import lineRight from '../assets/signup-line-right.svg'
import stakeScreenshot from '../assets/stake-screenshot.webp'
import registerForm from '../assets/register-form.webp'

function Step({ n, lines, glow = false, banded = false }: { n: number; lines: [ReactNode, ReactNode]; glow?: boolean; banded?: boolean }) {
  return (
    <div className={`step ${banded ? 'step--banded' : ''}`} data-reveal="divider">
      {banded && <img className="step__band" src={band} alt="" />}
      <img className="step__line" src={lineLeft} alt="" />
      <h2 className="step__center">
        <Hex glow={glow}>
          <span className="step__num">#{n}</span>
        </Hex>
        <span className="step__label grad-silver">
          {lines[0]}
          <br />
          {lines[1]}
        </span>
      </h2>
      <img className="step__line" src={lineRight} alt="" />
    </div>
  )
}

export function SignUpPage() {
  return (
    <main className="signup">
      <section className="signup-hero">
        <img className="page-bg signup-hero__bg" src={bgHome} alt="" />
        <div data-reveal="fade">
          <PartnerLogos />
        </div>
        <h1 className="signup-hero__title" data-reveal="zoom">
          <span className="signup-hero__how grad-silver">HOW TO</span>
          <span className="signup-hero__sign grad-blue">SIGN UP</span>
        </h1>
        <p className="signup-hero__sub" data-reveal="up" style={delay(140)}>
          Follow these instructions in order to sign up
          <br />
          on Stake and earn rewards.
        </p>
      </section>

      <Step n={1} lines={['Visit', 'Stake.com']} banded />
      <a className="signup-shot" href={STAKE_COM_URL} {...external} aria-label="Open Stake.com" data-reveal="up">
        <img src={stakeScreenshot} alt="The Stake.com home page" width={1913} height={953} decoding="async" />
      </a>

      <Step n={2} lines={['Create', 'an Account']} glow />
      <section className="signup-register">
        <div className="signup-register__copy" data-reveal="left">
          <h2 className="signup-register__title grad-silver">Register</h2>
          <p className="signup-register__text">
            Use code <strong>{CODE}</strong> when creating
            <br />
            an account in order to get access to our VIP system.
          </p>
          <CodeBox />
          <div className="signup-register__visits">
            <VisitButton platform="com" />
            <VisitButton platform="us" />
          </div>
          <AffiliateNote className="affiliate-note--left" />
        </div>
        <div className="signup-register__form" data-reveal="right" style={delay(120)}>
          <img
            src={registerForm}
            alt={`Stake's registration form with referral code ${CODE} filled in`}
            width={1086}
            height={541}
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>

      <div className="signup-rewards">
        <img className="signup-rewards__arc" src={signupArc} alt="" loading="lazy" decoding="async" />
        <Step n={3} lines={['Enjoy our', 'Rewards']} glow />
        <RewardCards />
      </div>
    </main>
  )
}
