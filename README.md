# Trevor Abney

Site for Trevor Abney — home, the $50,000 monthly Stake × Stake.us leaderboard (code **TREVOR**),
how to sign up, and media. Built from the Figma design with Vite + React + TypeScript.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
```

`.env` holds the two Stake affiliate tokens (`stake_com_api`, `stake_us_api`, or
`STAKE_COM_API_TOKEN` / `STAKE_US_API_TOKEN`). `npm run dev` also serves `/api/leaderboard`, so the
leaderboard works locally as long as `api.stake.com` / `api.stake.us` are reachable from your network.

## Deploy on Vercel

1. Import the project; the Vite preset and defaults are fine (build `npm run build`, output `dist`).
2. Add `STAKE_COM_API_TOKEN` and `STAKE_US_API_TOKEN` under Project → Settings → Environment Variables.
3. Deploy. `vercel.json` sends every page to the app and leaves `/api/*` to the function.

## Leaderboard

- `api/leaderboard.ts` — Vercel Function; `server/stakeLeaderboard.ts` — calls Stake's affiliate
  leaderboard API for Stake.com and Stake.us, ranks both together, masks names and attaches prizes.
  Tokens never reach the browser; full usernames never leave the server (`TrevorAbney` → `TrevorAb***`).
- `shared/leaderboard.ts` — prizes per place, number of places, ranking amount and the race window
  (calendar month, UTC). Change prizes or dates here.
- `shared/site.ts` — code, Stake links and social handles.

If one platform can't be reached, the board shows the other and says so; Stake is called at most
about once a minute.

## Legal

- Age (`MIN_AGE`, 21) and the US helpline (`HELPLINE`) are set once in `shared/site.ts`.
- `src/pages/LegalPages.tsx` holds the Terms of Service (`/terms`) and Privacy Policy (`/privacy`);
  update `LAST_UPDATED` there whenever the wording changes. They are a careful draft, not legal advice.
- The affiliate disclosure under the Stake buttons is `AffiliateNote` in `src/components/ui.tsx`.
- `LEADERBOARD_HIDDEN_USERS` (comma-separated Stake usernames) shows those players as "Hidden".
- Fonts are bundled with the site (`@fontsource/*`), so pages make no requests to other companies
  except Kick's player while he is live and TikTok's widget on the Media page.

## Kick stream

`server/kick.ts` (`GET /api/kick`) asks Kick whether the channel is live, about once a minute. On the
Media page the stream box plays Kick's player (muted autoplay) while he is live; otherwise it shows
the stream artwork, linking to the channel.

## TikTok

The Media page loads TikTok's official profile widget (`TikTokFeed` in `src/pages/MediaPage.tsx`), which
TikTok updates with every new post. It replaces the thumbnail row only once TikTok reports real content;
where TikTok is blocked (some countries, ad blockers) the thumbnail row stays.

## Images

`src/assets/*.png` and `*.svg` are the Figma exports. `npm run images` (`scripts/optimize-images.mjs`)
writes the `.webp` files the site actually loads: photos sized for their slots, and the icons that
use Figma's inner-shadow filter pre-rendered at 4x (browsers draw that filter with jagged edges).
Run it again after replacing a source image.

## Motion

Hover effects and floating symbols follow kingkulbik's shared hover animation (`useHoverAnimation`,
`.hover-anim` in `src/styles.css`). Elements with `data-reveal="up|left|right|zoom|fade|divider"`
animate in on first scroll into view (`useScrollReveal`). Everything respects reduced-motion settings.
