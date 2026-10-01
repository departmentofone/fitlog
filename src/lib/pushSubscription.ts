/**
 * This device's Web Push subscription, shared by the weekly summary and streak pushes
 * (push_subscriptions, see usePushSubscription.ts) and the rest timer's "Rest over" alert
 * (rest_alerts, see restAlert.ts). A device has one subscription per service worker, so turning
 * one of them off must never unsubscribe the browser: that would silently break the other.
 */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64Safe)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

export function vapidPublicKey(): string | undefined {
  return (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) || undefined
}

/**
 * The existing subscription, or a new one when `create` is set. Null when push isn't available:
 * no service worker yet, no permission, no VAPID key, or the browser refused (iOS can refuse
 * outside a tap).
 */
export async function devicePushSubscription(registration: ServiceWorkerRegistration, create: boolean): Promise<PushSubscription | null> {
  if (!('pushManager' in registration)) return null
  try {
    const existing = await registration.pushManager.getSubscription()
    if (existing || !create) return existing
    const key = vapidPublicKey()
    if (!key || Notification.permission !== 'granted') return null
    return await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) })
  } catch {
    return null
  }
}
