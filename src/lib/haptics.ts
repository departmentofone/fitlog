import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { isNativeApp } from './platform'

// Module-level flag rather than a hook so every existing call site (haptics.tap(), etc.) can
// stay a plain function call instead of needing to be inside a component. Kept in sync with
// Settings > Motion & Haptics by useApplyTheme (see src/hooks/useApplyTheme.ts), the same place
// that already reacts to other user_settings changes on load.
let hapticsEnabled = true

export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled
}

export function vibrate(pattern: number | number[] = 15) {
  if (!hapticsEnabled) return
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
  } catch {
    // Vibration API not supported — ignore.
  }
}

/**
 * In the app, the phone's own haptic engine (Android's WebView has no vibration API, and the
 * native feedback feels better anyway); on the web, the vibration patterns.
 */
function native(run: () => Promise<void>) {
  if (!hapticsEnabled) return
  void run().catch(() => undefined)
}

export const haptics = {
  /** A minor, frequent confirmation - a logged set, an item added. */
  tap: () => (isNativeApp() ? native(() => Haptics.impact({ style: ImpactStyle.Light })) : vibrate(12)),
  /** Something finished successfully - a completed fast, a saved recipe. */
  success: () => (isNativeApp() ? native(() => Haptics.notification({ type: NotificationType.Success })) : vibrate([15, 40, 15])),
  /** A personal record. */
  pr: () =>
    isNativeApp()
      ? native(async () => {
          await Haptics.notification({ type: NotificationType.Success })
          setTimeout(() => void Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => undefined), 180)
        })
      : vibrate([20, 60, 20, 60, 30]),
  /** A streak milestone or achievement unlock - the biggest, least frequent moments. */
  celebrate: () =>
    isNativeApp()
      ? native(async () => {
          await Haptics.impact({ style: ImpactStyle.Medium })
          setTimeout(() => void Haptics.notification({ type: NotificationType.Success }).catch(() => undefined), 120)
        })
      : vibrate([15, 50, 15, 50, 30]),
}
