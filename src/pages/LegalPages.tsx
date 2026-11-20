import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { PRIZES, prizePool } from '../../shared/leaderboard'
import { CODE, HELPLINE, MIN_AGE, external, socialUrl } from '../../shared/site'
import { GA_ID } from '../analytics'
import { Breadcrumbs } from '../components/ui'

/** Shown at the top of both pages; change it whenever the wording below changes */
const LAST_UPDATED = '20 November 2026'

function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <main className="legal">
      <Breadcrumbs current={title} />
      <header className="legal__head">
        <h1 className="legal__title grad-silver">{title}</h1>
        <p className="legal__intro">{intro}</p>
        <p className="legal__date">Last updated {LAST_UPDATED}</p>
      </header>
      <div className="legal__body">{children}</div>
    </main>
  )
}

const X = () => (
  <a href={socialUrl('x')} {...external}>
    X
  </a>
)
const Discord = () => (
  <a href={socialUrl('discord')} {...external}>
    Discord
  </a>
)

export function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="The rules for this site and its leaderboard. By using the site, you agree to them."
    >
      <section>
        <h2>What this site is</h2>
        <p>
          This is the community site of Trevor Abney, a streamer, for people who play at Stake.com and Stake.us
          under the code <strong>{CODE}</strong>. It is <strong>not a casino</strong>. It takes no deposits, holds
          no funds, accepts no bets and runs no games. It is not owned, operated or endorsed by Stake.com or
          Stake.us, and nothing on this site is an offer from them.
        </p>
        <p>
          Your account, your balance, and your withdrawals or redemptions there are entirely between you and that
          site, under its own terms. We can't see, change, credit or recover any of it.
        </p>
      </section>

      <section id="affiliate">
        <h2>Affiliate disclosure</h2>
        <p>
          Trevor Abney is a Stake affiliate. The “Visit Stake” and “Visit Stake.us” buttons and the code{' '}
          <strong>{CODE}</strong> are affiliate links: when you sign up or play through them, Trevor earns a
          commission. It costs you nothing extra. The leaderboard is a promotion run by Trevor Abney, not by
          Stake.
        </p>
      </section>

      <section>
        <h2>Who can take part</h2>
        <ul>
          <li>
            You must be at least <strong>{MIN_AGE}</strong>, and allowed to hold an account at the site you play
            on under its own rules and the law where you live.
          </li>
          <li>
            <strong>Stake.us</strong> is a sweepstakes social casino for players in the United States. No purchase
            is necessary to play, it is void where prohibited by law, and it is not available in every state.
            Stake.us's own terms list where it can be used, and that list changes.
          </li>
          <li>
            <strong>Stake.com</strong> is not available in the United States or in other restricted countries.
            Stake.com's own terms list them.
          </li>
          <li>
            Your account must be registered under the code {CODE}. Accounts opened under another code, or with
            no code, won't appear on the board.
          </li>
          <li>
            If you have self-excluded from gambling anywhere, or you use a blocking tool, please do not take
            part. No prize is worth breaking that for.
          </li>
          <li>Anyone helping run this site or the stream is excluded from the board and its prizes.</li>
        </ul>
      </section>

      <section id="leaderboard">
        <h2>How the leaderboard works</h2>
        <p>
          There is one board. Players under the code {CODE} on Stake.com and on Stake.us are ranked together. A
          race runs for one calendar month, from the 1st at 00:00 UTC until the next 1st at 00:00 UTC, and the
          next one starts straight away. The countdown on the leaderboard page shows when the current race ends.
        </p>
        <p>
          Players are ranked by the amount Stake's affiliate reporting counts for them. Stake weights wagers by
          game, so games with a higher return to player count for less. The top {PRIZES.length} places are paid,
          from a pool of ${prizePool().toLocaleString('en-US')} a month. Usernames on the board are partly
          hidden.
        </p>
        <p>
          Standings come from Stake's reporting, which we read and display. We don't calculate the figures and
          can't adjust them. They can take a little while to update, so the board may lag slightly behind your
          own account. If this site and Stake's reporting disagree, Stake's figures decide the result. A display
          error on this site does not create a prize.
        </p>
      </section>

      <section>
        <h2>Prizes</h2>
        <ul>
          <li>
            Prizes are paid by Trevor Abney after the month ends and the figures settle. They don't come from
            your Stake balance and are not a Stake promotion.
          </li>
          <li>The prize for each place is the one shown on the board for that month.</li>
          <li>
            To be paid, you need to be reachable: message Trevor on <X /> or <Discord /> with the username shown
            on the board. If a winner can't be reached within 30 days of the result, the prize may be forfeited.
          </li>
          <li>
            A prize can be withheld or reversed if an entry broke these terms, if Stake reverses or voids the
            play behind it, or if the play was not genuine. That includes bonus abuse, chargebacks, running
            multiple accounts, collusion, and figures inflated by a bug.
          </li>
          <li>You are responsible for any tax due on a prize where you live.</li>
        </ul>
      </section>

      <section>
        <h2>Promotions can change</h2>
        <p>
          The prize pool, the number of paid places and the leaderboard itself can change or end. The current
          version of the page is the one that applies. If a change affects a month already running, we won't
          reduce what was on offer part-way through.
        </p>
      </section>

      <section>
        <h2>Fair use</h2>
        <p>
          Do not scrape, overload or interfere with this site, and do not abuse the people who run it. Doing any
          of that can get you removed from the board.
        </p>
      </section>

      <section>
        <h2>No guarantees about the site itself</h2>
        <p>
          The site is provided as it is. Standings can be delayed or wrong while a feed is down, and pages can
          be unavailable. We are not liable for losses that result from that. In no case are we liable for money
          lost playing at Stake.com, Stake.us or anywhere else; that risk is entirely yours.
        </p>
      </section>

      <section id="responsible-play">
        <h2>Responsible play</h2>
        <p>
          Gambling costs money and carries real financial risk. Nothing on this site suggests otherwise, and no
          leaderboard position is worth chasing with money you need. If it has stopped being entertainment,
          stop, and use the limits, time-outs and self-exclusion tools in your Stake account.
        </p>
        <p>
          Free, confidential help is available 24/7. In the United States, call or text{' '}
          <a href={HELPLINE.tel}>{HELPLINE.number}</a> or chat at{' '}
          <a href={HELPLINE.url} {...external}>
            1800myreset.org
          </a>{' '}
          (the National Problem Gambling Helpline). Elsewhere, see{' '}
          <a href="https://www.begambleaware.org" {...external}>
            BeGambleAware
          </a>{' '}
          or{' '}
          <a href="https://www.gamblingtherapy.org" {...external}>
            Gambling Therapy
          </a>
          .
        </p>
      </section>

      <section>
        <h2>Changes to these terms</h2>
        <p>
          We may update these terms. The date at the top shows when they last changed. If you keep using the
          site after a change, the updated version applies.
        </p>
      </section>

      <section>
        <h2>Getting in touch</h2>
        <p>
          The quickest way to reach us about anything on this page is the <Link to="/contact">contact form</Link>
          , or a message on <X /> or <Discord />.
          Anything about your Stake.com or Stake.us account itself, such as deposits, redemptions, verification
          or self-exclusion, has to go to that site's support team, because we have no access to it.
        </p>
        <p>
          See also the <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </section>
    </LegalPage>
  )
}

export function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="What this site handles about you, who else is involved, and how to have something removed."
    >
      <section>
        <h2>The short version</h2>
        <p>
          You can browse this whole site without telling us anything. There are no accounts and no advertising
          trackers, and the site sets no cookies of its own.{' '}
          {GA_ID
            ? 'Visits are counted with Google Analytics only if you accept that in the banner.'
            : 'There is no analytics.'}{' '}
          If you use the contact form, we receive what you type into it. We sell nothing to anybody.
        </p>
      </section>

      <section>
        <h2>When you browse</h2>
        <ul>
          <li>
            <strong>Technical data.</strong> Like any website, the server that hosts this site sees the IP
            address and browser details of each request. That is used to deliver the pages, prevent abuse and
            keep the site running. It is not built into a profile of you.
          </li>
          <li>
            <strong>The copy button.</strong> The “CODE: {CODE}” button puts the code on your clipboard. The
            site never reads your clipboard.
          </li>
          <li>
            <strong>Fonts and images</strong> are served by this site itself, not by a third party.
          </li>
        </ul>
      </section>

      <section>
        <h2>What is shown publicly</h2>
        <p>
          The leaderboard shows players' usernames with the last characters hidden (for example
          “TrevorAb***”), the amount counted for them and the prize for their place, for players who signed up
          at Stake.com or Stake.us under the code {CODE}. These figures come from Stake's affiliate reporting
          and appear whether or not a player has ever visited this site. Full usernames are never sent to your
          browser. The pictures beside the names are the site's own artwork, not players' avatars.
        </p>
      </section>

      <section>
        <h2>Other services</h2>
        <ul>
          <li>
            <strong>Kick.</strong> While Trevor is live, the Media page loads Kick's video player. Kick then
            receives your IP address and browser details and may set its own cookies, under Kick's privacy
            policy. When he is offline, nothing is loaded from Kick.
          </li>
          <li>
            <strong>TikTok.</strong> The Media page loads TikTok's profile widget to show Trevor's latest
            videos. TikTok then receives your IP address and browser details, and its script may store data in
            your browser, under TikTok's privacy policy.
          </li>
          <li>
            <strong>Links.</strong> The buttons to Stake.com, Stake.us, Kick, X, Instagram, Discord and TikTok
            take you to those sites, which have their own terms and privacy policies. The Stake links carry
            the code {CODE}, so Stake knows you arrived through Trevor (see the{' '}
            <Link to="/terms#affiliate">affiliate disclosure</Link>).
          </li>
        </ul>
      </section>

      <section>
        <h2>If you send us a message</h2>
        <p>
          The <Link to="/contact">contact form</Link> asks for a message and a way to reply (an email address, or
          a Kick, X or Discord username), and optionally your name. What you type is forwarded to a private
          Discord channel that Trevor's team reads, so Discord processes it under its own privacy policy. This
          site keeps no copy. To stop repeat submissions, the server briefly remembers the address a message came
          from; that is not saved anywhere.
        </p>
      </section>

      {GA_ID && (
        <section>
          <h2>Analytics</h2>
          <p>
            The site uses Google Analytics 4 to count visits and see which pages and buttons are used. It loads
            only after you accept it in the banner shown on your first visit. If you decline, or never answer, no
            analytics code runs and no analytics cookies are set. Your choice is saved in your browser (an entry
            named <code>trevor-consent</code>), and you can change it at any time with the "Cookie settings" link
            at the bottom of every page. If you accept, Google receives your IP address, browser details and the
            pages you view, under Google's privacy policy.
          </p>
        </section>
      )}

      <section>
        <h2>Having something removed</h2>
        <p>
          If you want your name hidden on the leaderboard (your place stays, shown as “Hidden”), or have any
          question about this page, use the <Link to="/contact">contact form</Link> or message Trevor on <X /> or{' '}
          <Discord /> with your Stake username. For the data Stake.com or Stake.us holds
          about your account, contact that site directly; we have no access to it.
        </p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>
          If the site starts handling anything new, this page will say so first. The date at the top shows when
          it last changed.
        </p>
      </section>
    </LegalPage>
  )
}
