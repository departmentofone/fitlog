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

const jobs = [
  { svg: standardSvg, size: 192, out: 'icon-192.png' },
  { svg: standardSvg, size: 512, out: 'icon-512.png' },
  { svg: maskableSvg, size: 512, out: 'icon-512-maskable.png' },
  { svg: standardSvg, size: 180, out: 'apple-touch-icon.png', flatten: true },
]

for (const job of jobs) {
  let img = sharp(Buffer.from(job.svg)).resize(job.size, job.size)
  if (job.flatten) img = img.flatten({ background: '#0b0f1e' })
  await img.png().toFile(path.join(publicDir, job.out))
  console.log('wrote', job.out)
}
