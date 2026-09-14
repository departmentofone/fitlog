import { describe, expect, it } from 'vitest'
import { makeFood } from '../test/factories'
import { computeRecipeMacros, type RecipeIngredientWithFood } from './recipeMacros'

function ingredient(overrides: Partial<RecipeIngredientWithFood> = {}): RecipeIngredientWithFood {
  return {
    id: 'ri-1',
    recipe_id: 'recipe-1',
    food_id: 'food-1',
    grams: 100,
    serving_label: null,
    created_at: '2024-01-01T00:00:00.000Z',
    food: makeFood(),
    ...overrides,
  }
}

describe('computeRecipeMacros', () => {
  it('sums macros across all ingredients for the total', () => {
    const ingredients = [
      ingredient({ grams: 100, food: makeFood({ calories_per_100g: 200, protein_per_100g: 20, carbs_per_100g: 10, fat_per_100g: 5 }) }),
      ingredient({ grams: 50, food: makeFood({ calories_per_100g: 100, protein_per_100g: 10, carbs_per_100g: 5, fat_per_100g: 2 }) }),
    ]
    const { total } = computeRecipeMacros(ingredients)
    // first: 200 kcal / 20p / 10c / 5f; second (50g of 100/100g food): 50 kcal / 5p / 2.5c / 1f
    expect(total).toEqual({ calories: 250, protein: 25, carbs: 12.5, fat: 6 })
  })

  it('divides the total evenly across servings', () => {
    const ingredients = [ingredient({ grams: 100, food: makeFood({ calories_per_100g: 400, protein_per_100g: 40, carbs_per_100g: 20, fat_per_100g: 10 }) })]
    const { perServing } = computeRecipeMacros(ingredients)
    expect(perServing(4)).toEqual({ calories: 100, protein: 10, carbs: 5, fat: 2.5 })
  })

  it('falls back to the total (not NaN/Infinity) when servings is zero or negative', () => {
    const ingredients = [ingredient({ grams: 100, food: makeFood({ calories_per_100g: 400, protein_per_100g: 40, carbs_per_100g: 20, fat_per_100g: 10 }) })]
    const { total, perServing } = computeRecipeMacros(ingredients)
    expect(perServing(0)).toEqual(total)
    expect(perServing(-1)).toEqual(total)
  })

  it('returns all-zero totals for an empty ingredient list without crashing', () => {
    const { total, perServing } = computeRecipeMacros([])
    expect(total).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 })
    expect(perServing(2)).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  })
})
