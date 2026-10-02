import { RestTimer } from '../native/restTimer'
import { isNativeApp } from './platform'
import { armServerRestAlert, cancelServerRestAlert } from './restAlert'
import { REST_ACTIONS, REST_NOTIFICATION_TAG, REST_OFF_HINT, REST_TIMER_MESSAGE, type RichNotificationOptions } from './restNotificationShared'

/**
 * The rest timer in the notification bar. While rest counts, Android (and other Chromium
 * browsers) shows a silent "Resting" notification with the time rest ends. When rest ends, a
 * "Rest over" alert (sound/vibration, heads-up popup) replaces it, even if the phone is locked or
 * another app is open. One tag, so the alert takes the countdown's place.
 *
 * The alert comes from the server as a Web Push (restAlert.ts), because a backgrounded web app
 * can't run a timer: iOS suspends it within seconds and Android freezes it. Only when push isn't
 * available does the service worker's own timer stand in, which works while FitLog stays open.
 *
 * The "Resting" notification is never updated once a second. iOS turns every update into a new
 * banner, and Android stops updates as soon as FitLog is in the background, so a ticking
 * countdown either spams or freezes. Showing the end time instead stays right without updates.
 *
 * In the app (Capacitor), all of this is the native rest timer instead (src/native/restTimer.ts):
 * Android counts the notification down itself and alerts on time, with no server involved.
 */

/**
 * Notification permission, the same shape on the web and in the app. "unknown": the app's answer
 * hasn't come back from the native side yet, so nothing should ask or warn in the meantime.
 */
export type RestPermission = NotificationPermission | 'unsupported' | 'unknown'

/** The web's answer, available at once; the app's comes from restPermission(). */
export function initialRestPermission(): RestPermission {
  return isNativeApp() ? 'unknown' : notificationPermission()
}

export async function restPermission(): Promise<RestPermission> {
  if (!isNativeApp()) return notificationPermission()
  try {
    const { notifications } = await RestTimer.checkPermissions()
    return notifications === 'prompt' ? 'default' : notifications
  } catch {
    return 'unsupported'
  }
}

/** Asks for notification permission (in context, from a tap) and returns the answer. */
export async function requestRestPermission(): Promise<RestPermission> {
  try {
    if (isNativeApp()) {
      const { notifications } = await RestTimer.requestPermissions()
      return notifications === 'prompt' ? 'default' : notifications
    }
    return await Notification.requestPermission()
  } catch {
    return restPermission()
  }
}

/**
 * Whether the page should call the alert off just before rest ends while FitLog is on screen. The
 * web does (a server push can't be held back once sent); the app's own timer checks for itself.
 */
export const cancelsAlertOnScreen = (): boolean => !isNativeApp()

/** In the app, the end time the native timer was last given, so the same rest isn't sent twice. */
let nativeEndsAt: number | null = null
export function notificationsSupported(): boolean {
  return typeof Notification !== 'undefined' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported'
}

async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (notificationPermission() !== 'granted') return null
  try {
    // getRegistration, not ready: ready never settles when no service worker is installed.
    return (await navigator.serviceWorker.getRegistration()) ?? null
  } catch {
    return null
  }
}

function clockTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

/**
 * Whether this browser can replace a notification silently. Chromium can (and is the one with
 * `Notification.maxActions`); Safari on iOS alerts again for every replacement, so it gets no
 * "Resting" notification at all, only the alert at the end.
 */
export function canUpdateQuietly(): boolean {
  return typeof Notification !== 'undefined' && 'maxActions' in Notification
}

/** Shows the silent "Resting" notification, with the time rest ends. Call on start and on +15s. */
export async function showRestCountdown(endsAt: number) {
  // In the app, the native timer's notification is the countdown.
  if (isNativeApp() || !canUpdateQuietly()) return
  const reg = await registration()
  if (!reg) return
  const options: RichNotificationOptions = {
    tag: REST_NOTIFICATION_TAG,
    body: `Rest ends at ${clockTime(endsAt)}.\n${REST_OFF_HINT}`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    silent: true,
    renotify: false,
    timestamp: endsAt,
    actions: REST_ACTIONS,
    data: { url: '/#/workouts' },
  }
  try {
    await reg.showNotification('Resting', options)
  } catch {
    // Never let a notification failure break the timer.
  }
}

/** Whether this page fell back to the service worker's timer for the current rest. */
let usingWorkerTimer = false
/** Bumped by every schedule and cancel, so a schedule that finishes late can't undo a newer call. */
let alertGeneration = 0

async function postToWorker(endsAt: number | null) {
  const reg = await registration()
  reg?.active?.postMessage({ type: REST_TIMER_MESSAGE, endsAt })
}

/**
 * Arranges the "Rest over" alert for `endsAt`: a server push when this device can receive one,
 * the service worker's timer otherwise. Call on start and whenever `endsAt` changes.
 */
export async function scheduleRestAlert(endsAt: number) {
  if (isNativeApp()) {
    if (nativeEndsAt === endsAt) return
    nativeEndsAt = endsAt
    try {
      await RestTimer.start({ endsAt })
    } catch {
      nativeEndsAt = null
    }
    return
  }
  if (notificationPermission() !== 'granted') return
  const generation = ++alertGeneration
  const pushed = await armServerRestAlert(endsAt)
  // Skipped or rescheduled while the server answered: that call has set things up already.
  if (generation !== alertGeneration) return
  usingWorkerTimer = !pushed
  // Never both: two alerts for one rest would buzz twice.
  await postToWorker(pushed ? null : endsAt)
}

/**
 * Keeps the service worker's stand-in timer alive. Chrome gives one wait 5 minutes at most, so the
 * page re-posts while it counts. Does nothing when the server push is armed.
 */
export async function refreshWorkerRestAlert(endsAt: number) {
  if (usingWorkerTimer && !isNativeApp()) await postToWorker(endsAt)
}

/** Cancels the pending alert, wherever it was arranged. Keeps the notification on screen. */
export async function cancelRestAlert() {
  if (isNativeApp()) {
    nativeEndsAt = null
    await RestTimer.stop().catch(() => undefined)
    return
  }
  alertGeneration++
  usingWorkerTimer = false
  await Promise.all([cancelServerRestAlert(), postToWorker(null)])
}

/**
 * The native timer reported a change of its own (the notification's +15s or Skip, or the end), so
 * the app doesn't send that rest back to it.
 */
export function nativeRestChanged(endsAt: number | null) {
  nativeEndsAt = endsAt
}

export async function clearRestNotification() {
  await cancelRestAlert()
  if (isNativeApp()) return
  const reg = await registration()
  if (!reg) return
  try {
    for (const n of await reg.getNotifications({ tag: REST_NOTIFICATION_TAG })) n.close()
  } catch {
    // Nothing to clear.
  }
}
