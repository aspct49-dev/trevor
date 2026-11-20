/*
 * Search and share tags, shared by the build (scripts/prerender.mjs writes
 * them into each page's HTML) and the app (which keeps the title, description
 * and canonical link right as you move between pages).
 *
 * Every page here is pre-rendered to its own HTML file, listed in
 * sitemap.xml, and given its own title, description, canonical link, Open
 * Graph / X card tags and structured data.
 */

import { prizePool } from './leaderboard.js'
import { CODE, KICK_CHANNEL, TIKTOK_HANDLE } from './site.js'

/** Used when neither SITE_URL nor Vercel's production domain is set */
export const DEFAULT_SITE_URL = 'https://trevor-fawn.vercel.app'

export const SITE_NAME = 'Trevor Abney'

const pool = `$${prizePool().toLocaleString('en-US')}`

export type PageSeo = {
  title: string
  description: string
  /** Name in breadcrumbs (and the visible trail on pages that show one) */
  crumb: string
}

/** Every indexable page, by path. Titles stay under ~60 characters, descriptions under ~160. */
export const PAGES: Record<string, PageSeo> = {
  '/': {
    title: `Trevor Abney | ${pool} Monthly Stake Leaderboard`,
    description: `Trevor Abney's official site. Sign up on Stake.com or Stake.us with code ${CODE} and compete in the ${pool} monthly leaderboard. 21+. Play responsibly.`,
    crumb: 'Home',
  },
  '/leaderboard': {
    title: `${pool} Monthly Leaderboard: Live Standings | Trevor Abney`,
    description: `Live standings for Trevor Abney's ${pool} monthly leaderboard. Stake.com and Stake.us players under code ${CODE} are ranked together, and the top 30 win prizes.`,
    crumb: 'Leaderboard',
  },
  '/how-to-sign-up': {
    title: `How to Sign Up on Stake with Code ${CODE} | Trevor Abney`,
    description: `Three steps to join: visit Stake.com or Stake.us, create your account with code ${CODE}, and you're on the ${pool} monthly leaderboard. 21+ only.`,
    crumb: 'How to Sign Up',
  },
  '/media': {
    title: 'Live Streams and Videos: Kick and TikTok | Trevor Abney',
    description: `Watch Trevor Abney live on Kick and catch his latest TikTok videos and stream giveaways.`,
    crumb: 'Media',
  },
  '/contact': {
    title: 'Contact | Trevor Abney',
    description: `Get in touch with Trevor Abney's team about the leaderboard, prizes or this site.`,
    crumb: 'Contact',
  },
  '/terms': {
    title: 'Terms of Service | Trevor Abney',
    description: `The rules for Trevor Abney's site and its ${pool} monthly leaderboard: who can take part, how standings work and how prizes are paid.`,
    crumb: 'Terms of Service',
  },
  '/privacy': {
    title: 'Privacy Policy | Trevor Abney',
    description: `What Trevor Abney's site handles about you, which other services are involved, and how to have something removed.`,
    crumb: 'Privacy Policy',
  },
}

/** The custom 404 page: never indexed, no canonical */
export const NOT_FOUND: PageSeo = {
  title: 'Page Not Found | Trevor Abney',
  description: `That page doesn't exist. Head back to Trevor Abney's home page or the ${pool} monthly leaderboard.`,
  crumb: 'Page not found',
}

export const pageSeo = (path: string): PageSeo => PAGES[path] ?? NOT_FOUND

/** "/leaderboard" → "https://site/leaderboard"; the home page keeps its trailing slash */
export const absoluteUrl = (siteUrl: string, path: string) => `${siteUrl}${path === '/' ? '/' : path}`

/** Trevor's confirmed profiles */
const SAME_AS = [
  `https://kick.com/${KICK_CHANNEL}`,
  'https://x.com/thetrevorabney',
  'https://www.instagram.com/trevor_abney',
  `https://www.tiktok.com/@${TIKTOK_HANDLE}`,
  'https://discord.gg/GmpuXrhkn',
]

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** JSON-LD is embedded in a <script>, so "<" must not be able to close it */
const jsonLd = (data: unknown) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`

/** Organization + WebSite, plus a breadcrumb trail on every page below Home */
export function structuredData(path: string, siteUrl: string) {
  const graph: unknown[] = [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: SITE_NAME,
      url: `${siteUrl}/`,
      logo: `${siteUrl}/logo.png`,
      sameAs: SAME_AS,
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: SITE_NAME,
      url: `${siteUrl}/`,
      publisher: { '@id': `${siteUrl}/#organization` },
    },
  ]
  const page = PAGES[path]
  if (page && path !== '/') {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: PAGES['/'].crumb, item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: page.crumb, item: absoluteUrl(siteUrl, path) },
      ],
    })
  }
  return { '@context': 'https://schema.org', '@graph': graph }
}

/**
 * The <head> tags for one page. `path` is a key of PAGES, or anything else
 * for the 404 page (which gets "noindex" and no canonical link).
 */
export function seoHead(path: string, siteUrl: string, options: { googleVerification?: string } = {}) {
  const known = path in PAGES
  const page = pageSeo(path)
  const url = absoluteUrl(siteUrl, path)
  const image = `${siteUrl}/og.jpg`
  const tags = [
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    known ? `<link rel="canonical" href="${url}" />` : `<meta name="robots" content="noindex" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    known ? `<meta property="og:url" content="${url}" />` : '',
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="Trevor Abney: ${pool} monthly leaderboard, code ${CODE}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:site" content="@thetrevorabney" />`,
    `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    options.googleVerification
      ? `<meta name="google-site-verification" content="${escapeHtml(options.googleVerification)}" />`
      : '',
    jsonLd(structuredData(path, siteUrl)),
  ]
  return tags.filter(Boolean).join('\n    ')
}

export function sitemap(siteUrl: string, lastModified: string) {
  const urls = Object.keys(PAGES)
    .map((path) => `  <url>\n    <loc>${absoluteUrl(siteUrl, path)}</loc>\n    <lastmod>${lastModified}</lastmod>\n  </url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

/** Everything public may be crawled; the data endpoints under /api/ are not pages */
export function robots(siteUrl: string) {
  return `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${siteUrl}/sitemap.xml\n`
}
