/**
 * Parses a number the user typed, accepting either a comma or a dot as the decimal separator.
 *
 * The number inputs use `type="text" inputMode="decimal"` rather than `type="number"`: on phones set
 * to a comma-decimal locale (e.g. Serbian, German) the keyboard offers "," but a number input
 * rejects it, so "62,5" couldn't be typed at all. Returns NaN for anything that isn't a number, so
 * callers keep their existing `Number.isNaN` / `Number.isFinite` checks.
 */
export function parseDecimal(input: string | number | null | undefined): number {
  if (typeof input === 'number') return input
  if (input == null) return Number.NaN
  const normalized = input.trim().replace(/\s/g, '').replace(',', '.')
  // Only digits with at most one separator (and an optional leading minus). parseFloat alone
  // would accept "12abc" as 12 or "1.2.3" as 1.2.
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(normalized)) return Number.NaN
  return Number.parseFloat(normalized)
}
