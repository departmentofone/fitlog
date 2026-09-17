const TWA_FLAG = 'fitlog-android-app'

/**
 * True when running inside the Google Play (TWA) build. Chrome opens a Trusted Web Activity with
 * an `android-app://<package>` referrer on the first page load only, so the result is remembered
 * for the session. Used to hide things Play's Payments policy doesn't allow in-app - currently the
 * external donation link (see DONATIONS_PLAN.md).
 */
export function isAndroidApp(): boolean {
  try {
    if (document.referrer.startsWith('android-app://')) sessionStorage.setItem(TWA_FLAG, '1')
    return sessionStorage.getItem(TWA_FLAG) === '1'
  } catch {
    return document.referrer.startsWith('android-app://')
  }
}
