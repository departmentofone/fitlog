import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')
mkdirSync(publicDir, { recursive: true })

// Aurora Glass palette (see src/index.css) - deep navy canvas, emerald accent. Keep this in sync
// with public/favicon.svg and the in-app <LogoMark> in src/components/Layout.tsx - all three
// drifted out of sync with each other and with the old "Ring System" palette before this pass.
const standardSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#0b0f1e"/>
  <g stroke="#34d399" stroke-width="34" stroke-linecap="round">
    <line x1="96" y1="256" x2="416" y2="256"/>
    <line x1="150" y1="176" x2="150" y2="336"/>
    <line x1="362" y1="176" x2="362" y2="336"/>
    <line x1="96" y1="208" x2="96" y2="304"/>
    <line x1="416" y1="208" x2="416" y2="304"/>
  </g>
</svg>`

// Smaller glyph, full-bleed background, so it survives a circular mask crop.
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0b0f1e"/>
  <g stroke="#34d399" stroke-width="26" stroke-linecap="round" transform="translate(256 256) scale(0.72) translate(-256 -256)">
    <line x1="96" y1="256" x2="416" y2="256"/>
    <line x1="150" y1="176" x2="150" y2="336"/>
    <line x1="362" y1="176" x2="362" y2="336"/>
    <line x1="96" y1="208" x2="96" y2="304"/>
    <line x1="416" y1="208" x2="416" y2="304"/>
  </g>
</svg>`

// Google Play store icon: a full square (Play applies its own corner rounding and shadow), so no
// rounded corners or transparency in the artwork itself.
const storeSvg = standardSvg.replace('rx="112" ', '')

// Home-screen shortcut icons (manifest `shortcuts`) - same stroke language as the in-app icons.
const shortcutSvg = (paths) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="48" fill="#0b0f1e"/>
  <g transform="translate(24 24) scale(2)" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</g>
</svg>`
const SHORTCUTS = {
  'shortcut-set.png': '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  'shortcut-meal.png': '<path d="M4 3v7a2 2 0 0 0 4 0V3M6 12v9M17 3c-1.7 0-3 2.2-3 5s1.3 5 3 5v8"/>',
  'shortcut-fast.png': '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M10 2h4"/>',
}

const storeDir = path.join(__dirname, '..', 'store-listing')
mkdirSync(path.join(publicDir, 'shortcuts'), { recursive: true })
mkdirSync(storeDir, { recursive: true })

const jobs = [
  { svg: standardSvg, size: 192, out: 'icon-192.png' },
  { svg: standardSvg, size: 512, out: 'icon-512.png' },
  { svg: maskableSvg, size: 512, out: 'icon-512-maskable.png' },
  { svg: standardSvg, size: 180, out: 'apple-touch-icon.png', flatten: true },
  { svg: storeSvg, size: 512, out: path.join(storeDir, 'icon-512.png') },
  ...Object.entries(SHORTCUTS).map(([out, paths]) => ({ svg: shortcutSvg(paths), size: 96, out: path.join('shortcuts', out) })),
]

for (const job of jobs) {
  let img = sharp(Buffer.from(job.svg)).resize(job.size, job.size)
  if (job.flatten) img = img.flatten({ background: '#0b0f1e' })
  await img.png().toFile(path.resolve(publicDir, job.out))
  console.log('wrote', job.out)
}
