import { describe, expect, it } from 'vitest'
import { estimate1RM } from './oneRepMax'

describe('estimate1RM (Epley formula)', () => {
  it('returns the weight unchanged for 1 rep', () => {
    expect(estimate1RM(100, 1)).toBe(100)
  })

  it('returns the weight unchanged for 0 reps (guarded, not just the formula)', () => {
    expect(estimate1RM(100, 0)).toBe(100)
  })

  it('applies weight * (1 + reps/30) above 1 rep', () => {
    expect(estimate1RM(70, 10)).toBeCloseTo(70 * (1 + 10 / 30), 5)
    expect(estimate1RM(50, 5)).toBeCloseTo(50 * (1 + 5 / 30), 5)
  })

  it('matches the specific value shown in the exercise detail modal for 70kg x 10', () => {
    // 70 * 1.3333... = 93.33, which the UI rounds to 93kg.
    expect(Math.round(estimate1RM(70, 10))).toBe(93)
  })
})
