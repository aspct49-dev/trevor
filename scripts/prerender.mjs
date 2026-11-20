/*
 * Runs after the two Vite builds (see "build" in package.json):
 *
 *   dist/          the browser build
 *   dist-server/   the same app built for Node (src/entry-server.tsx)
 *
 * For every page it renders the app to HTML and writes dist/<page>.html with
 * that page's own title, description, canonical link, share tags and
 * structured data (shared/seo.ts). It also writes 404.html, sitemap.xml and
 * robots.txt. Vercel serves /<page> from <page>.html (cleanUrls in vercel.json).
 *
 * The site's address comes from SITE_URL, else Vercel's production domain,
 * else the default in shared/seo.ts.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const serverDir = path.join(root, 'dist-server')

const { render, PAGES, seoHead, sitemap, robots, DEFAULT_SITE_URL } = await import(
  pathToFileURL(path.join(serverDir, 'entry-server.js')).href
)

const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL
const siteUrl = (process.env.SITE_URL || (vercelDomain ? `https://${vercelDomain}` : '') || DEFAULT_SITE_URL).replace(/\/+$/, '')
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION || undefined

const template = await readFile(path.join(dist, 'index.html'), 'utf8')
const SEO_BLOCK = /<!--seo-->[\s\S]*?<!--\/seo-->/
const APP_SLOT = '<!--app-->'
if (!SEO_BLOCK.test(template) || !template.includes(APP_SLOT)) {
  throw new Error('index.html is missing the <!--seo--> block or the <!--app--> slot')
}

/** One page's HTML: its head tags and its rendered content, in the built template */
const page = (routePath) =>
  template
    .replace(SEO_BLOCK, () => seoHead(routePath, siteUrl, { googleVerification }))
    .replace(APP_SLOT, () => render(routePath))

const written = []
for (const routePath of Object.keys(PAGES)) {
  const file = routePath === '/' ? 'index.html' : `${routePath.slice(1)}.html`
  await mkdir(path.dirname(path.join(dist, file)), { recursive: true })
  await writeFile(path.join(dist, file), page(routePath))
  written.push(file)
}

// Any address that isn't a page: Vercel answers with this file and a 404 status
await writeFile(path.join(dist, '404.html'), page('/404'))
await writeFile(path.join(dist, 'sitemap.xml'), sitemap(siteUrl, new Date().toISOString().slice(0, 10)))
await writeFile(path.join(dist, 'robots.txt'), robots(siteUrl))
await rm(serverDir, { recursive: true, force: true })

console.log(`prerendered ${written.length} pages for ${siteUrl}: ${written.join(', ')}, 404.html, sitemap.xml, robots.txt`)
