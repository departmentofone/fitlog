import { describe, expect, it } from 'vitest'
import { macrosForGrams, microsForGrams, sumMacros } from '../types'
import { makeFood } from '../test/factories'

/**
 * A shared preset/recipe can reference a custom food owned by someone else, which row-level
 * security hides from this reader - PostgREST returns `food: null` rather than failing. Totals
 * must keep working; before this, the whole Meals/Diet tab crashed on that row.
 */
describe('macros for an unreadable food', () => {
  it('counts a null food as zero instead of throwing', () => {
    expect(macrosForGrams(null, 150)).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 })
    expect(() => microsForGrams(null, 150)).not.toThrow()
    expect(microsForGrams(null, 150).fiber).toBe(0)
  })

  it('still totals the readable rows in the same meal', () => {
    const food = makeFood({ calories_per_100g: 200, protein_per_100g: 10, carbs_per_100g: 20, fat_per_100g: 5 })
    const totals = sumMacros([macrosForGrams(food, 100), macrosForGrams(null, 250)])
    expect(totals.calories).toBe(200)
    expect(totals.protein).toBe(10)
  })
})
