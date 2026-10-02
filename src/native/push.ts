import { PushNotifications } from '@capacitor/push-notifications'
import { nativePlatform } from '../lib/platform'
import { supabase } from '../lib/supabase'
import { RestTimer } from './restTimer'

/**
 * The weekly summary and streak reminders in the app, through Firebase Cloud Messaging. The app
 * can't use Web Push, so it registers an FCM token in native_push_tokens (migration v34), and the
 * crons send to it (api/_fcm.ts). Only builds made with google-services.json can do this; the
 * Settings card hides otherwise.
 */
const TOKEN_KEY = 'fitlog-native-push-token'

export async function nativePushAvailable(): Promise<boolean> {
  try {
    return (await RestTimer.pushAvailable()).available
  } catch {
    return false
  }
}

export function nativePushOn(): boolean {
  try {
    return !!localStorage.getItem(TOKEN_KEY)
  } catch {
    return false
  }
}

/** Gets this device's token from Firebase (asking for notification permission if needed). */
async function registerForToken(): Promise<string> {
  const { receive } = await PushNotifications.requestPermissions()
  if (receive !== 'granted') throw new Error('Notifications are off for FitLog. Turn them on in your phone’s settings.')
  await PushNotifications.createChannel({
    id: 'reminders',
    name: 'Weekly summary and streak reminders',
    description: 'A summary of your week every Sunday, and a heads-up when your streak is about to end.',
    importance: 3,
  }).catch(() => undefined)
  return new Promise<string>((resolve, reject) => {
    let done = false
    void PushNotifications.addListener('registration', ({ value }) => {
      if (!done) {
        done = true
        resolve(value)
      }
    })
    void PushNotifications.addListener('registrationError', ({ error }) => {
      if (!done) {
        done = true
        reject(new Error(error))
      }
    })
    void PushNotifications.register()
    setTimeout(() => {
      if (!done) {
        done = true
        reject(new Error("Couldn't reach Google's notification service. Try again."))
      }
    }, 15_000)
  })
}

async function saveToken(userId: string, token: string) {
  const { error } = await supabase.from('native_push_tokens').upsert(
    { token, user_id: userId, platform: nativePlatform() ?? 'android', updated_at: new Date().toISOString() },
    { onConflict: 'token' },
  )
  if (error) throw error
  localStorage.setItem(TOKEN_KEY, token)
}

export async function enableNativePush(userId: string) {
  await saveToken(userId, await registerForToken())
}

export async function disableNativePush() {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) await supabase.from('native_push_tokens').delete().eq('token', token)
  localStorage.removeItem(TOKEN_KEY)
  await PushNotifications.removeAllListeners().catch(() => undefined)
  await PushNotifications.unregister().catch(() => undefined)
}

/**
 * At startup: if pushes are on for this device, refresh the token (Firebase can replace it) and
 * open the app where a tapped notification points.
 */
export async function startPush(userId: string | null, openUrl: (url: string) => void) {
  void PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
    const url = (notification.data as { url?: string } | undefined)?.url
    if (url) openUrl(url)
  })
  if (!userId || !nativePushOn() || !(await nativePushAvailable())) return
  try {
    const { receive } = await PushNotifications.checkPermissions()
    if (receive !== 'granted') return
    const token = await registerForToken()
    if (token !== localStorage.getItem(TOKEN_KEY)) {
      const old = localStorage.getItem(TOKEN_KEY)
      if (old) await supabase.from('native_push_tokens').delete().eq('token', old)
    }
    await saveToken(userId, token)
  } catch {
    // Next start tries again.
  }
}
