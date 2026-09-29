import { formatRestTime } from './restTime'

/**
 * The rest timer in the notification bar. The page keeps a silent "Resting" notification up to
 * date while it counts, and tells the service worker when rest ends; the service worker shows
 * the "Rest over" alert (sound/vibration, heads-up popup) even if the app is in the background
 * or another app is open. One tag, so the alert replaces the countdown in place.
 */
export const REST_NOTIFICATION_TAG = 'fitlog-rest-timer'
export const REST_TIMER_MESSAGE = 'fitlog-rest-timer'

/** Notification options the DOM lib types leave out but Chrome on Android supports. */
export type RichNotificationOptions = NotificationOptions & {
  actions?: { action: string; title: string }[]
  renotify?: boolean
  timestamp?: number
  vibrate?: number[]
}

export const REST_OFF_HINT = 'You can turn these notifications off in Settings.'
export const REST_ACTIONS = [{ action: 'settings', title: 'Settings' }]

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
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/** Shows or updates the silent countdown. The end time keeps it useful if updates pause. */
export async function showRestCountdown(endsAt: number) {
  const reg = await registration()
  if (!reg) return
  const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
  const options: RichNotificationOptions = {
    tag: REST_NOTIFICATION_TAG,
    body: `${formatRestTime(left)} left, until ${clockTime(endsAt)}\n${REST_OFF_HINT}`,
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

/** Asks the service worker to alert at `endsAt`, or cancels the pending alert with null. */
export async function scheduleRestAlert(endsAt: number | null) {
  const reg = await registration()
  reg?.active?.postMessage({ type: REST_TIMER_MESSAGE, endsAt })
}

export async function clearRestNotification() {
  await scheduleRestAlert(null)
  const reg = await registration()
  if (!reg) return
  try {
    for (const n of await reg.getNotifications({ tag: REST_NOTIFICATION_TAG })) n.close()
  } catch {
    // Nothing to clear.
  }
}
