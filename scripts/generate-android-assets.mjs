// The Android app's launcher icons and splash images, from the same artwork as the web icons
// (scripts/generate-icons.mjs): a navy canvas with the emerald dumbbell. Run after changing the
// logo: node scripts/generate-android-assets.mjs
import sharp from 'sharp'
import { readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const res = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'android', 'app', 'src', 'main', 'res')
const NAVY = '#0b0f1e'
const EMERALD = '#34d399'

const glyph = (scale, stroke, color = EMERALD) => `
  <g stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <line x1="96" y1="256" x2="416" y2="256"/>
    <line x1="150" y1="176" x2="150" y2="336"/>
    <line x1="362" y1="176" x2="362" y2="336"/>
    <line x1="96" y1="208" x2="96" y2="304"/>
    <line x1="416" y1="208" x2="416" y2="304"/>
  </g>`
const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${body}</svg>`

// Older Android: a rounded square, and a round version for launchers that ask for one.
const legacy = svg(`<rect width="512" height="512" rx="112" fill="${NAVY}"/>${glyph(1, 34)}`)
const round = svg(`<circle cx="256" cy="256" r="256" fill="${NAVY}"/>${glyph(0.9, 34)}`)
// Adaptive icons: 108dp layers of which the middle 66dp always shows, so the glyph sits well inside.
const foreground = svg(glyph(0.55, 30))
const monochrome = svg(glyph(0.55, 30, '#ffffff'))

const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }
const png = (source, size) => sharp(Buffer.from(source)).resize(Math.round(size), Math.round(size)).png()

for (const [density, k] of Object.entries(DENSITIES)) {
  const dir = path.join(res, `mipmap-${density}`)
  await png(legacy, 48 * k).toFile(path.join(dir, 'ic_launcher.png'))
  await png(round, 48 * k).toFile(path.join(dir, 'ic_launcher_round.png'))
  await png(foreground, 108 * k).toFile(path.join(dir, 'ic_launcher_foreground.png'))
  await png(monochrome, 108 * k).toFile(path.join(dir, 'ic_launcher_monochrome.png'))
}

writeFileSync(
  path.join(res, 'mipmap-anydpi-v26', 'ic_launcher.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>
`,
)
writeFileSync(path.join(res, 'mipmap-anydpi-v26', 'ic_launcher_round.xml'), readFileSync(path.join(res, 'mipmap-anydpi-v26', 'ic_launcher.xml'), 'utf8'))
writeFileSync(
  path.join(res, 'values', 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${NAVY}</color>
</resources>
`,
)

// Splash images (shown before Android 12, and by the splash plugin): navy with the logo in the
// middle, at each existing size.
for (const dir of readdirSync(res).filter((d) => d === 'drawable' || d.startsWith('drawable-land') || d.startsWith('drawable-port'))) {
  const file = path.join(res, dir, 'splash.png')
  let meta
  try {
    meta = await sharp(file).metadata()
  } catch {
    continue
  }
  const { width, height } = meta
  const logo = Math.round(Math.min(width, height) * 0.28)
  const mark = await png(svg(`<rect width="512" height="512" rx="112" fill="${NAVY}"/>${glyph(1, 34)}`), logo).toBuffer()
  await sharp({ create: { width, height, channels: 4, background: NAVY } })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(file + '.tmp')
  renameSync(file + '.tmp', file)
}
console.log('Android icons and splash images written')

