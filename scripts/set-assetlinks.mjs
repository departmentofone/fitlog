// Writes public/.well-known/assetlinks.json - the Digital Asset Links file that lets the Android
// (TWA) app open FitLog full-screen instead of with a browser address bar.
//
// Usage:
//   node scripts/set-assetlinks.mjs <package.name> <SHA256 fingerprint> [<more fingerprints>...]
//
// Include BOTH fingerprints once they exist:
//   1. the upload key (PWABuilder/Bubblewrap shows it when it creates the keystore), and
//   2. the app signing key from Play Console -> Test and release -> App integrity -> App signing.
// Only #2 matters for installs from Google Play; skipping it is the classic "URL bar in
// production" TWA bug. Redeploy after running this.
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
