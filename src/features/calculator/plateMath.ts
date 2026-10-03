const EPS = 1e-6

export interface PlateResult {
  /** Plates to load on ONE side of the bar, largest first (load the other side identically). */
  perSide: number[]
  /** Total barbell weight actually achieved (bar + both sides). May be less than `target` when
   *  the exact target isn't reachable with the given plates - it's the closest achievable total
   *  without exceeding the target. */
  achievedTotal: number
  target: number
  barWeight: number
}

/**
 * Greedily picks plates (assumed available in unlimited pairs) to load onto each side of a
 * barbell to get as close to `targetTotal` as possible without going over.
 *
 * Each plate goes on BOTH sides of the bar, so the math is done in terms of half the total minus
 * half the bar weight (the "per-side target"), not the full target weight - e.g. a 100kg target
 * on a 20kg bar needs 40kg per side, not 80kg.
 */
export function calculatePlates(targetTotal: number, barWeight: number, availablePlates: number[]): PlateResult {
  const perSideTarget = (targetTotal - barWeight) / 2
  const sorted = [...availablePlates].filter((p) => p > 0).sort((a, b) => b - a)

  const perSide: number[] = []
  let remaining = perSideTarget

  if (remaining > EPS && sorted.length > 0) {
    outer: for (const plate of sorted) {
      while (plate - remaining <= EPS) {
        perSide.push(plate)
        remaining = Math.round((remaining - plate) * 1e6) / 1e6
        if (remaining <= EPS) break outer
      }
    }
  }

  const achievedPerSide = perSide.reduce((sum, p) => sum + p, 0)
  const achievedTotal = Math.round((barWeight + achievedPerSide * 2) * 100) / 100

  return { perSide, achievedTotal, target: targetTotal, barWeight }
}

// Standard plate sets. Imperial follows the common lb equivalents rather than a literal kg->lb
// conversion, matching how gyms actually stock plates.
export const METRIC_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25]
export const IMPERIAL_PLATES = [45, 35, 25, 10, 5, 2.5]
export const METRIC_BAR = 20
export const IMPERIAL_BAR = 45

export function formatPlate(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}
