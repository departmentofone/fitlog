import { apiUrl } from './platform'
import { devicePushSubscription } from './pushSubscription'
import { supabase } from './supabase'

/**
 * Arms or cancels the server-sent "Rest over" push (api/rest-alert.ts) for this device. A push is
 * the only alert that reliably arrives while the phone is locked or another app is open: iOS
 * suspends a backgrounded web app within seconds and Android freezes it, so nothing on the device
 * can wake it up at the right time.
 *
 * Requests go out one at a time, in order, so a quick start-then-skip can't reach the server as
 * skip-then-start and leave a stray alert behind.
 */
let queue: Promise<unknown> = Promise.resolve()
let armed = false

async function send(inMs: number | null): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false
  const registration = await navigator.serviceWorker.getRegistration().catch(() => undefined)
  if (!registration) return false
  const subscription = await devicePushSubscription(registration, inMs !== null)
  if (!subscription) return false
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return false
  try {
    const response = await fetch(apiUrl('/api/rest-alert'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ inMs, subscription: subscription.toJSON() }),
      // Lets the request finish when the app is being put in the background or closed.
      keepalive: true,
      // Requests wait their turn, so one that never answers mustn't hold up the next.
      signal: AbortSignal.timeout(10_000),
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Asks the server to alert at `endsAt` (this device's clock; sent as a delay, so the server's
 * clock doesn't matter). Resolves to whether the server took it, so the caller can fall back.
 */
export function armServerRestAlert(endsAt: number): Promise<boolean> {
  const result = queue.then(() => {
    // Set even if the response is lost: a cancel that finds nothing to cancel costs nothing.
    armed = true
    return send(Math.max(0, endsAt - Date.now()))
  })
  queue = result.catch(() => false)
  return result
}

/** Cancels this device's pending alert. Does nothing when this page never armed one. */
export function cancelServerRestAlert(): Promise<void> {
  const result = queue.then(async () => {
    if (!armed) return
    armed = false
    await send(null)
  })
  queue = result.catch(() => undefined)
  return result
}
