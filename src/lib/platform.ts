import { Capacitor } from '@capacitor/core'

/** The website. Inside the app, pages come from https://localhost, so anything public uses this. */
export const SITE_URL = 'https://fitlog-two-gamma.vercel.app'

/** True in the Capacitor app (Android now, iOS later), false on the web and in the old TWA build. */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

export function nativePlatform(): 'android' | 'ios' | null {
  const p = Capacitor.getPlatform()
  return p === 'android' || p === 'ios' ? p : null
}

/**
 * True in any build that came from an app store: the Capacitor app or the old Play (TWA) build.
 * Store rules apply there, such as no links to outside payment pages (DONATIONS_PLAN.md).
 */
export function isStoreBuild(): boolean {
  return isNativeApp() || isAndroidApp()
}

/** Where public links point: the page's own address on the web, the website inside the app. */
export function siteOrigin(): string {
  return isNativeApp() ? SITE_URL : window.location.origin
}

/** An address for the site's own API (`/api/...`): relative on the web, absolute inside the app. */
export function apiUrl(path: string): string {
  return isNativeApp() ? `${SITE_URL}${path}` : path
}

const TWA_FLAG = 'fitlog-android-app'

/** Query marker the Play build adds to its launch URL (PWABuilder "Start URL": `/?source=play`). */
export const PLAY_LAUNCH_PARAM = 'source'
export const PLAY_LAUNCH_VALUE = 'play'

/**
 * True for a Google Play (TWA) launch: Chrome opens a Trusted Web Activity with an
 * `android-app://<package>` referrer, and the Play build's launch URL carries `?source=play`. The
 * marker is the backup for phones where the app opens in something other than Chrome, which may
 * not set the referrer. Both are only there on the first page load.
 */
export function isPlayLaunch(referrer: string, search: string): boolean {
  return referrer.startsWith('android-app://') || new URLSearchParams(search).get(PLAY_LAUNCH_PARAM) === PLAY_LAUNCH_VALUE
}

/**
 * True when running inside the Google Play (TWA) build. The launch signals are gone after the first
 * page load, so the result is remembered for the session. Used to hide things Play's Payments
 * policy doesn't allow in-app - currently the external donation link (see DONATIONS_PLAN.md).
 */
export function isAndroidApp(): boolean {
  const launch = isPlayLaunch(document.referrer, window.location.search)
  try {
    if (launch) sessionStorage.setItem(TWA_FLAG, '1')
    return sessionStorage.getItem(TWA_FLAG) === '1'
  } catch {
    return launch
  }
}
