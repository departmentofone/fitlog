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

export const haptics = {
  /** A minor, frequent confirmation - a logged set, an item added. */
  tap: () => vibrate(12),
  /** Something finished successfully - a completed fast, a saved recipe. */
  success: () => vibrate([15, 40, 15]),
  /** A personal record. */
  pr: () => vibrate([20, 60, 20, 60, 30]),
  /** A streak milestone or achievement unlock - the biggest, least frequent moments. */
  celebrate: () => vibrate([15, 50, 15, 50, 30]),
}
