import { describe, expect, it } from 'vitest'
import { estimateAlcoholCalories } from './useAlcoholLogs'

describe('estimateAlcoholCalories', () => {
  it('matches the known-good beer calculation (500ml, 5% ABV -> 138 kcal)', () => {
    // grams = 500 * 0.05 * 0.789 = 19.725; kcal = 19.725 * 7 = 138.075 -> 138
    expect(estimateAlcoholCalories(500, 5)).toBe(138)
  })

  it('matches a wine-strength calculation (150ml, 12% ABV)', () => {
    // grams = 150 * 0.12 * 0.789 = 14.202; kcal = 99.414 -> 99
    expect(estimateAlcoholCalories(150, 12)).toBe(99)
  })

  it('matches a spirit-strength calculation (40ml, 40% ABV)', () => {
    // grams = 40 * 0.4 * 0.789 = 12.624; kcal = 88.368 -> 88
    expect(estimateAlcoholCalories(40, 40)).toBe(88)
  })

  it('returns 0 for zero volume or zero ABV', () => {
    expect(estimateAlcoholCalories(0, 40)).toBe(0)
    expect(estimateAlcoholCalories(500, 0)).toBe(0)
  })
})
