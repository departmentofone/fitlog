import { describe, expect, it } from 'vitest'
import { calculatePlates } from './plateMath'

const METRIC_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25]
const IMPERIAL_PLATES = [45, 35, 25, 10, 5, 2.5]

describe('calculatePlates', () => {
  it('picks the largest plates first to hit an exact target', () => {
    const result = calculatePlates(100, 20, METRIC_PLATES)
    expect(result.perSide).toEqual([25, 15])
    expect(result.achievedTotal).toBe(100)
  })

  it('accounts for plates going on both sides (per-side target, not full target)', () => {
    // 60kg total on a 20kg bar -> 20kg per side -> a single 20 plate per side, not one 20 total.
    const result = calculatePlates(60, 20, METRIC_PLATES)
    expect(result.perSide).toEqual([20])
    expect(result.achievedTotal).toBe(60)
  })

  it('rounds down to the closest achievable total when the exact target is unreachable', () => {
    const result = calculatePlates(27, 20, METRIC_PLATES)
    expect(result.perSide).toEqual([2.5])
    expect(result.achievedTotal).toBe(25)
  })

  it('never suggests going below the bar weight when the target is lighter than the bar', () => {
    const result = calculatePlates(15, 20, METRIC_PLATES)
    expect(result.perSide).toEqual([])
    expect(result.achievedTotal).toBe(20)
  })

  it('treats a target equal to the bar weight as an exact match with no plates', () => {
    const result = calculatePlates(20, 20, METRIC_PLATES)
    expect(result.perSide).toEqual([])
    expect(result.achievedTotal).toBe(20)
  })

  it('works with an imperial plate set and bar', () => {
    const result = calculatePlates(225, 45, IMPERIAL_PLATES)
    expect(result.perSide).toEqual([45, 45])
    expect(result.achievedTotal).toBe(225)
  })

  it('handles fractional plates without floating point drift', () => {
    // 43.75kg per side across many small plates - a classic source of float rounding bugs.
    const result = calculatePlates(107.5, 20, METRIC_PLATES)
    expect(result.perSide).toEqual([25, 15, 2.5, 1.25])
    expect(result.achievedTotal).toBe(107.5)
  })
})
