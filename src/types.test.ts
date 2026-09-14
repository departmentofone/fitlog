import { describe, expect, it } from 'vitest'
import { makeFood } from './test/factories'
import { macrosForGrams, microsForGrams, sumMacros, sumMicros } from './types'

describe('macrosForGrams', () => {
  it('scales per-100g macros linearly by the given grams', () => {
    const food = makeFood({ calories_per_100g: 200, protein_per_100g: 20, carbs_per_100g: 10, fat_per_100g: 5 })
    expect(macrosForGrams(food, 50)).toEqual({ calories: 100, protein: 10, carbs: 5, fat: 2.5 })
  })

  it('returns zero macros for zero grams', () => {
    const food = makeFood({ calories_per_100g: 200, protein_per_100g: 20, carbs_per_100g: 10, fat_per_100g: 5 })
    expect(macrosForGrams(food, 0)).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  })
})

describe('sumMacros', () => {
  it('adds macro totals across multiple items', () => {
    const totals = sumMacros([
      { calories: 100, protein: 10, carbs: 5, fat: 2 },
      { calories: 50, protein: 5, carbs: 2.5, fat: 1 },
    ])
    expect(totals).toEqual({ calories: 150, protein: 15, carbs: 7.5, fat: 3 })
  })

  it('returns all zeros for an empty list', () => {
    expect(sumMacros([])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  })
})

describe('microsForGrams / sumMicros', () => {
  it('scales micronutrients linearly and sums across items', () => {
    const food = makeFood({ fiber_g: 10, sugar_g: 4, sodium_mg: 200, cholesterol_mg: 0, potassium_mg: 100, calcium_mg: 50, iron_mg: 2, vitamin_c_mg: 20, vitamin_a_mcg: 30 })
    const micros = microsForGrams(food, 50)
    expect(micros).toEqual({
      fiber: 5,
      sugar: 2,
      sodium: 100,
      cholesterol: 0,
      potassium: 50,
      calcium: 25,
      iron: 1,
      vitaminC: 10,
      vitaminA: 15,
    })
    expect(sumMicros([micros, micros])).toEqual({
      fiber: 10,
      sugar: 4,
      sodium: 200,
      cholesterol: 0,
      potassium: 100,
      calcium: 50,
      iron: 2,
      vitaminC: 20,
      vitaminA: 30,
    })
  })
})
