import { describe, expect, it } from 'vitest'
import raw from '../../public/.well-known/assetlinks.json?raw'

/**
 * The Play app only opens full screen when public/.well-known/assetlinks.json lists the key Google
 * Play signs it with. Source of truth: Play Console -> Protected with Play -> Play Store protection
 * -> Play App Signing -> "Digital Asset Links JSON" (copy it whole, never retype a fingerprint).
 * A wrong key here once sent every install to a browser tab. After changing the file, deploy and
 * run `npm run check:app-links` (see scripts/check-app-links.mjs).
 */
const PACKAGE = 'com.departmentofone.fitlog'
const PLAY_APP_SIGNING_KEY = '55:B6:9D:49:E0:D0:F6:DB:E2:E5:68:18:54:F1:6F:00:C0:29:CD:9F:2B:45:57:A3:48:66:9A:56:35:60:D3:C2'

describe('assetlinks.json', () => {
  const statements = JSON.parse(raw)

  it('delegates this site to the Play app, signed with the Play app signing key', () => {
    const app = statements.find((s: { target: { namespace: string } }) => s.target.namespace === 'android_app')
    expect(app.relation).toContain('delegate_permission/common.handle_all_urls')
    expect(app.target.package_name).toBe(PACKAGE)
    expect(app.target.sha256_cert_fingerprints).toContain(PLAY_APP_SIGNING_KEY)
  })
})
