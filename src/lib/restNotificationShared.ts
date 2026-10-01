/** Shared by the page (restNotification.ts) and the service worker (sw.ts), so nothing else here. */
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
