/*
 * Sizes the design's exported PNGs for the slots they are shown in (at 2–3x
 * for sharp screens) and writes them as WebP next to the originals.
 *
 * Why: the exports are far larger than their slots (the logo is 4096px wide
 * and shown at 80px in the header; avatars are 1000px and shown at 30px).
 * Browsers downscale that much on the fly with a cheap filter, which looks
 * crunchy, and the page was shipping ~8 MB of images.
 *
 * Run after replacing any source PNG:  npm run images
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const assets = path.join(root, 'src', 'assets')

/** [source, output, width (px, omitted = keep), quality] */
const JOBS = [
  ['logo.png', 'logo.webp', 1096, 92], // hero: 548px slot
  ['logo.png', 'logo-nav.webp', 240, 92], // header: 80px slot
  ['avatar-1st.png', 'avatar-1st.webp', 218, 90], // podium: 109px slot
  ['avatar-2nd.png', 'avatar-2nd.webp', 218, 90],
  ['avatar-3rd.png', 'avatar-3rd.webp', 218, 90],
  ['avatar-1st.png', 'avatar-row.webp', 90, 90], // table rows: 30px slot
  ['bg-stake.png', 'bg-stake.webp', undefined, 84],
  ['bg-home.png', 'bg-home.webp', undefined, 84],
  ['stake-screenshot.png', 'stake-screenshot.webp', 1684, 86], // 842px slot
  ['tiktok-thumb.png', 'tiktok-thumb.webp', 432, 84], // 144px slot
  ['stream-box.png', 'stream-box.webp', undefined, 90],
  ['reward-card-bg.png', 'reward-card-bg.webp', undefined, 88],
  ['logo-mask.png', 'logo-mask.webp', undefined, 90], // the logo glow's shape (used as a CSS mask)
  ['card-texture.png', 'card-texture.webp', undefined, 86],
  ['register-form.png', 'register-form.webp', undefined, 90],
]

for (const [source, output, width, quality] of JOBS) {
  const image = sharp(path.join(assets, source))
  if (width) image.resize({ width, kernel: 'lanczos3', withoutEnlargement: true })
  const info = await image.webp({ quality, alphaQuality: 100, effort: 6 }).toFile(path.join(assets, output))
  console.log(`${output.padEnd(24)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} kB`)
}

/*
 * Icons Figma exported with an inner shadow. Its SVG filter thresholds the
 * shape's alpha ("hardAlpha"), so browsers draw these with stair-stepped
 * edges at every zoom level. Rendering them here at 4x and letting the
 * browser scale the picture down gives the same look with smooth edges.
 */
const HARD_ALPHA_ICONS = [
  'social-x', 'social-instagram', 'social-discord', 'social-kick', 'social-tiktok',
  'kick-logo', 'tiktok-logo', 'section-hex', 'timer-hex', 'gift-box-gold', 'reward-gift',
]
for (const name of HARD_ALPHA_ICONS) {
  const info = await sharp(path.join(assets, `${name}.svg`), { density: 72 * 4 })
    .webp({ lossless: true, effort: 6 })
    .toFile(path.join(assets, `${name}.webp`))
  console.log(`${`${name}.webp`.padEnd(24)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} kB`)
}

// Browser-tab icon: the logo on a transparent square
await mkdir(path.join(root, 'public'), { recursive: true })
const icon = await sharp(path.join(assets, 'logo.png'))
  .resize({ width: 192, height: 192, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, 'public', 'favicon.png'))
console.log(`public/favicon.png       ${icon.width}x${icon.height}  ${(icon.size / 1024).toFixed(0)} kB`)

// The logo for structured data and the home-screen icon
const schemaLogo = await sharp(path.join(assets, 'logo.png'))
  .resize({ width: 512 })
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, 'public', 'logo.png'))
console.log(`public/logo.png          ${schemaLogo.width}x${schemaLogo.height}  ${(schemaLogo.size / 1024).toFixed(0)} kB`)

// Share image for link previews (Open Graph / X card), 1200x630: the leaderboard artwork, dimmed, with the logo
const shareBg = await sharp(path.join(assets, 'bg-stake.png')).resize(1200, 630, { fit: 'cover', position: 'top' }).toBuffer()
const shareLogo = await sharp(path.join(assets, 'logo.png')).resize({ width: 600 }).toBuffer()
const dim = Buffer.from('<svg width="1200" height="630"><rect width="1200" height="630" fill="#0f0f14" fill-opacity="0.35"/></svg>')
const share = await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#0f0f14' } })
  .composite([{ input: shareBg }, { input: dim }, { input: shareLogo, gravity: 'centre' }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(path.join(root, 'public', 'og.jpg'))
console.log(`public/og.jpg            ${share.width}x${share.height}  ${(share.size / 1024).toFixed(0)} kB`)
