// Writes public/.well-known/assetlinks.json - the Digital Asset Links file that lets the Android
// (TWA) app open FitLog full-screen instead of with a browser address bar.
//
// Usage:
//   node scripts/set-assetlinks.mjs <package.name> <SHA256 fingerprint> [<more fingerprints>...]
//
// Include BOTH fingerprints once they exist:
//   1. the Play app signing key. Take it from the "Digital Asset Links JSON" that Play Console
//      generates (Protected with Play -> Play Store protection -> Play App Signing): copy it,
//      never retype it. This is the only key that matters for installs from Google Play.
//   2. the upload key, from the assetlinks.json in the PWABuilder download.
// A wrong key #1 is the classic "URL bar in production" TWA bug, and it happened here: Google's
// check of the file passed while every install opened in a browser tab. After running this, update
// PLAY_APP_SIGNING_KEY in src/lib/assetlinks.test.ts, deploy, then run `npm run check:app-links`,
// ideally with the "Signed, universal APK" from App bundle explorer (see that script).
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const [packageName, ...fingerprints] = process.argv.slice(2)
const FINGERPRINT = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/

if (!packageName || !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(packageName) || fingerprints.length === 0) {
  console.error('Usage: node scripts/set-assetlinks.mjs <package.name> <SHA256 fingerprint> [...]')
  process.exit(1)
}

const normalized = fingerprints.map((f) => f.trim().toUpperCase())
const invalid = normalized.filter((f) => !FINGERPRINT.test(f))
if (invalid.length > 0) {
  console.error(`Not a SHA-256 fingerprint (expected 32 colon-separated hex pairs): ${invalid.join(', ')}`)
  process.exit(1)
}

const statement = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: packageName,
      sha256_cert_fingerprints: [...new Set(normalized)],
    },
  },
]

const out = fileURLToPath(new URL('../public/.well-known/assetlinks.json', import.meta.url))
writeFileSync(out, `${JSON.stringify(statement, null, 2)}\n`)
console.log(`Wrote ${out} for ${packageName} with ${statement[0].target.sha256_cert_fingerprints.length} fingerprint(s).`)
