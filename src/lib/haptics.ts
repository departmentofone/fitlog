export function vibrate(pattern: number | number[] = 15) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
  } catch {
    // Vibration API not supported — ignore.
  }
}

export const haptics = {
  tap: () => vibrate(12),
  success: () => vibrate([15, 40, 15]),
  pr: () => vibrate([20, 60, 20, 60, 30]),
}
