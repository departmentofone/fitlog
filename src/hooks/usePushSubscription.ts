import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/** Tracks Notification.permission reactively (it only changes via user action, so we poll on focus). */
export function usePushPermission() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    isPushSupported() ? Notification.permission : 'unsupported',
  )

  useEffect(() => {
    if (!isPushSupported()) return
    const update = () => setPermission(Notification.permission)
    window.addEventListener('focus', update)
    return () => window.removeEventListener('focus', update)
  }, [])

  return permission
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64Safe)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

/**
 * Requests notification permission, subscribes via the service worker's PushManager, and
 * stores the subscription in Supabase so a future server-side sender can find it.
 *
 * NOTE: push_subscriptions doesn't exist in the database yet (see
 * supabase/migration_v9_draft_DO_NOT_RUN_YET.sql) - subscribing will succeed locally
 * (permission + browser subscription) but fail to persist until that migration runs.
 * That's expected at this stage; see PUSH_NOTIFICATIONS.md.
 */
export async function subscribeToPush(userId: string): Promise<void> {
  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
  if (!publicKey) throw new Error('Push isn\'t configured yet (missing VITE_VAPID_PUBLIC_KEY).')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission was not granted.')

  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('No active service worker (try reloading the app).')), 5000)),
  ])
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })

  const json = subscription.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw error
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
  await subscription.unsubscribe()
}

export function useIsPushSubscribed() {
  const { user } = useAuth()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!user || !isPushSupported()) {
      setChecked(true)
      return
    }
    // .ready never resolves if no service worker ever takes control (e.g. local dev, where
    // vite-plugin-pwa doesn't register one by default) - race it so the card still renders
    // instead of silently hiding the feature forever.
    let cancelled = false
    Promise.race([navigator.serviceWorker.ready, new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))])
      .then((reg) => (reg ? reg.pushManager.getSubscription() : null))
      .then((sub) => {
        if (!cancelled) setIsSubscribed(!!sub)
      })
      .finally(() => {
        if (!cancelled) setChecked(true)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  return { isSubscribed, checked, setIsSubscribed }
}
