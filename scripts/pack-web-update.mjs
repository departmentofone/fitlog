// Live updates for the app (src/native/updates.ts): zips the native web build (dist-native) into
// the website's own build as dist/app-updates/<version>.zip, with a manifest the app checks at
// launch. Runs at the end of `npm run build`, so every web deploy also ships the app's web code.
import { createHash } from 'node:crypto'
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { zipSync } from 'fflate'

const SITE_URL = 'https://fitlog-two-gamma.vercel.app'
const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const source = join(root, 'dist-native')
const target = join(root, 'dist', 'app-updates')

const { version } = JSON.parse(readFileSync(join(source, 'fitlog-version.json'), 'utf8'))
const { fitlogNative } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

const files = {}
function add(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) add(path)
    // index.html at the root of the zip, as the updater expects.
    else files[relative(source, path).split(sep).join('/')] = new Uint8Array(readFileSync(path))
  }
}
add(source)
if (!files['index.html']) throw new Error('dist-native has no index.html; run the native build first')

const zip = zipSync(files, { level: 9 })
const checksum = createHash('sha256').update(zip).digest('hex')
mkdirSync(target, { recursive: true })
writeFileSync(join(target, `${version}.zip`), zip)
writeFileSync(
  join(target, 'latest.json'),
  JSON.stringify(
    {
      version,
      url: `${SITE_URL}/app-updates/${version}.zip`,
      checksum,
      minVersionCode: fitlogNative.minVersionCodeForWebUpdates,
    },
    null,
    2,
  ) + '\n',
)
console.log(`app update ${version}: ${Object.keys(files).length} files, ${(zip.length / 1024).toFixed(0)} KB`)
