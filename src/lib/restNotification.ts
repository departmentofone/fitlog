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
 */
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
  if (!canUpdateQuietly()) return
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
  if (usingWorkerTimer) await postToWorker(endsAt)
}

/** Cancels the pending alert, wherever it was arranged. Keeps the notification on screen. */
export async function cancelRestAlert() {
  alertGeneration++
  usingWorkerTimer = false
  await Promise.all([cancelServerRestAlert(), postToWorker(null)])
}

export async function clearRestNotification() {
  await cancelRestAlert()
  const reg = await registration()
  if (!reg) return
  try {
    for (const n of await reg.getNotifications({ tag: REST_NOTIFICATION_TAG })) n.close()
  } catch {
    // Nothing to clear.
  }
}
