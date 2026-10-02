import { App } from '@capacitor/app'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { SITE_URL } from '../lib/platform'

/**
 * Live updates: every web deploy also publishes the app's web code as a zip on the website
 * (scripts/pack-web-update.mjs). The app checks for it, downloads it in the background, and
 * switches to it at the next launch only, so a workout in progress is never reloaded. If a new
 * bundle fails to start, @capgo/capacitor-updater rolls back to the previous one by itself.
 *
 * A bundle only goes to app versions that have every native piece it needs: the manifest names
 * the oldest versionCode it runs on (package.json fitlogNative.minVersionCodeForWebUpdates).
 */
declare const __WEB_VERSION__: string

const MANIFEST_URL = `${SITE_URL}/app-updates/latest.json`
const PENDING_KEY = 'fitlog-update-pending'

/** The version of the web code that's running, set at build time (vite.config.ts). */
export const WEB_VERSION: string = __WEB_VERSION__

interface Manifest {
  version: string
  url: string
  checksum: string
  minVersionCode: number
}

/**
 * Called first thing at launch. If an update finished downloading last time, switch to it now
 * (the app reloads straight into it); returns true then, and nothing else should run.
 */
export async function switchToDownloadedUpdate(): Promise<boolean> {
  let pending: { id: string; version: string } | null = null
  try {
    pending = JSON.parse(localStorage.getItem(PENDING_KEY) ?? 'null')
    localStorage.removeItem(PENDING_KEY)
  } catch {
    return false
  }
  if (!pending || pending.version === WEB_VERSION) return false
  try {
    await CapacitorUpdater.set({ id: pending.id })
    return true
  } catch {
    return false
  }
}

/** Tells the updater this bundle started fine, so it isn't rolled back. */
export async function confirmBundleWorks() {
  try {
    await CapacitorUpdater.notifyAppReady()
  } catch {
    // Not fatal: the worst case is a rollback to the bundle that came with the app.
  }
}

/** Looks for newer web code and downloads it in the background, for the next launch. */
export async function checkForUpdate() {
  try {
    const res = await fetch(MANIFEST_URL, { cache: 'no-store' })
    if (!res.ok) return
    const manifest = (await res.json()) as Manifest
    if (!manifest.version || !manifest.url || manifest.version === WEB_VERSION) return
    const info = await App.getInfo()
    if (Number(info.build) < manifest.minVersionCode) return

    // Already downloaded on an earlier run: just line it up again.
    const { bundles } = await CapacitorUpdater.list()
    const existing = bundles.find((b) => b.version === manifest.version && b.status === 'success')
    const bundle = existing ?? (await CapacitorUpdater.download({ url: manifest.url, version: manifest.version, checksum: manifest.checksum }))
    localStorage.setItem(PENDING_KEY, JSON.stringify({ id: bundle.id, version: manifest.version }))
  } catch {
    // Offline or the download failed: try again next launch.
  }
}
