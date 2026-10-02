import { cancelRestAlert } from './restNotification'
import { isNativeApp } from './platform'
import { supabase } from './supabase'

/**
 * Signs out, first unlinking this device from the account: its push registration (so the next
 * person to sign in here doesn't get this account's weekly summary) and any rest alert waiting on
 * the server. Done before signing out, while the session can still delete them.
 */
export async function signOut() {
  await cancelRestAlert().catch(() => undefined)
  try {
    if (isNativeApp()) {
      const { disableNativePush, nativePushOn } = await import('../native/push')
      if (nativePushOn()) await disableNativePush()
    } else if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      const subscription = await registration?.pushManager?.getSubscription()
      if (subscription) await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
    }
  } catch {
    // Signing out matters more than tidying up.
  }
  await supabase.auth.signOut()
}
