/**
 * The meal someone was adding food to when they tapped Scan, so the scanner offers to log the
 * scanned food straight into that meal. Set right before opening the scanner; read once there.
 */
let pending: string | null = null

export function preferScanMeal(mealName: string) {
  pending = mealName
}

export function peekScanMeal(): string | null {
  return pending
}

export function clearScanMeal() {
  pending = null
}
