import { describe, expect, it } from 'vitest'
import { mergeAmounts } from './mergeServing'

describe('mergeAmounts', () => {
  it('adds up the same serving: 2 eggs + 2 eggs = 4 eggs', () => {
    expect(mergeAmounts({ grams: 100, servingLabel: '2 × 1 large egg' }, { grams: 100, servingLabel: '2 × 1 large egg' })).toEqual({
      grams: 200,
      servingLabel: '4 × 1 large egg',
    })
  })

  it('counts a plain label as one serving', () => {
    expect(mergeAmounts({ grams: 50, servingLabel: '1 large egg' }, { grams: 100, servingLabel: '2 × 1 large egg' })).toEqual({
      grams: 150,
      servingLabel: '3 × 1 large egg',
    })
  })

  it('falls back to grams when the servings differ or one was typed in grams', () => {
    expect(mergeAmounts({ grams: 100, servingLabel: '2 × 1 large egg' }, { grams: 44, servingLabel: '1 medium egg' })).toEqual({ grams: 144, servingLabel: null })
    expect(mergeAmounts({ grams: 100, servingLabel: '2 × 1 large egg' }, { grams: 30, servingLabel: null })).toEqual({ grams: 130, servingLabel: null })
  })

  it('falls back to grams when the grams per serving disagree (a half serving)', () => {
    expect(mergeAmounts({ grams: 25, servingLabel: '1 large egg' }, { grams: 50, servingLabel: '1 large egg' })).toEqual({ grams: 75, servingLabel: null })
  })
})
