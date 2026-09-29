// Checks that the Play app will open full screen (no browser address bar). Run after every deploy
// that touches public/.well-known/assetlinks.json, and whenever the Android package is rebuilt:
//
//   npm run check:app-links                       live file = repo file, and Google verifies each key
//   npm run check:app-links -- path/to/app.apk    also: the APK's signing key is in the file
//
// For the APK, download what Play actually installs: Play Console -> Test and release -> App bundle
// explorer -> your version -> Downloads -> "Signed, universal APK". Its key is the one every phone
// checks. (In 2026 an assetlinks.json with the wrong key sent every install to a browser tab while
// Google's own check of the file still passed, because the file only matched itself.)
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const SITE = 'https://fitlog-two-gamma.vercel.app'
const RELATION = 'delegate_permission/common.handle_all_urls'
const local = JSON.parse(readFileSync(new URL('../public/.well-known/assetlinks.json', import.meta.url), 'utf8'))
const target = local[0].target
const fingerprints = target.sha256_cert_fingerprints
let failed = false
const fail = (msg) => {
  failed = true
  console.log(`FAIL  ${msg}`)
}
const pass = (msg) => console.log(`ok    ${msg}`)

// 1. The deployed file is the repo's file.
const res = await fetch(`${SITE}/.well-known/assetlinks.json?check=${Date.now()}`, { redirect: 'manual' })
if (res.status !== 200) fail(`live assetlinks.json answered ${res.status} (must be 200, no redirect)`)
else if (!String(res.headers.get('content-type')).includes('application/json')) fail(`live content-type is ${res.headers.get('content-type')}`)
else {
  const live = await res.json()
  const same = JSON.stringify(live) === JSON.stringify(local)
  same ? pass('live assetlinks.json matches the repo') : fail('live assetlinks.json differs from the repo: deploy first')
}

// 2. Google verifies each key. Google caches the file for up to an hour after a change.
for (const fp of fingerprints) {
  const q = new URLSearchParams({
    'source.web.site': SITE,
    relation: RELATION,
    'target.android_app.package_name': target.package_name,
    'target.android_app.certificate.sha256_fingerprint': fp,
  })
  const r = await (await fetch(`https://digitalassetlinks.googleapis.com/v1/assetlinks:check?${q}`)).json()
  r.linked ? pass(`Google verifies ${fp.slice(0, 11)}...`) : fail(`Google does not verify ${fp.slice(0, 11)}... yet (cached up to ${r.maxAge ?? '?'}; retry later)`)
}

// 3. The APK's own signing key is listed (APK Signature Scheme v2/v3 block).
function apkSigningKeys(buf) {
  const eocd = buf.lastIndexOf(Buffer.from('PK\x05\x06', 'binary'))
  const cd = buf.readUInt32LE(eocd + 16)
  if (buf.toString('binary', cd - 16, cd) !== 'APK Sig Block 42') return []
  const size = Number(buf.readBigUInt64LE(cd - 24))
  const block = buf.subarray(cd - size - 8, cd - 24)
  const keys = new Set()
  const lp = (b, o) => {
    const n = b.readUInt32LE(o)
    return [b.subarray(o + 4, o + 4 + n), o + 4 + n]
  }
  for (let pos = 8; pos < block.length; ) {
    const len = Number(block.readBigUInt64LE(pos))
    const id = block.readUInt32LE(pos + 8)
    const value = block.subarray(pos + 12, pos + 8 + len)
    pos += 8 + len
    if (id !== 0x7109871a && id !== 0xf05368c0) continue
    const [signers] = lp(value, 0)
    for (let o = 0; o < signers.length; ) {
      let signer
      ;[signer, o] = lp(signers, o)
      const [signed] = lp(signer, 0)
      const [, afterDigests] = lp(signed, 0)
      const [certs] = lp(signed, afterDigests)
      for (let c = 0; c < certs.length; ) {
        let cert
        ;[cert, c] = lp(certs, c)
        keys.add(createHash('sha256').update(cert).digest('hex').toUpperCase().match(/../g).join(':'))
      }
    }
  }
  return [...keys]
}

const apk = process.argv[2]
if (apk) {
  const keys = apkSigningKeys(readFileSync(apk))
  if (keys.length === 0) fail(`${apk}: no v2/v3 signature found`)
  for (const k of keys) fingerprints.includes(k) ? pass(`${apk} is signed with ${k.slice(0, 11)}..., which is listed`) : fail(`${apk} is signed with ${k}, which is NOT in assetlinks.json`)
}

console.log(failed ? '\nApp links are NOT ready: the Play app will open with an address bar.' : '\nApp links check passed.')
process.exit(failed ? 1 : 0)
