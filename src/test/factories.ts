import type { Food } from '../types'

export function makeFood(overrides: Partial<Food> = {}): Food {
  return {
    id: 'food-1',
    user_id: null,
    name: 'Test food',
    calories_per_100g: 100,
    protein_per_100g: 10,
    carbs_per_100g: 10,
    fat_per_100g: 5,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
    cholesterol_mg: 0,
    potassium_mg: 0,
    calcium_mg: 0,
    iron_mg: 0,
    vitamin_c_mg: 0,
    vitamin_a_mcg: 0,
    common_servings: [],
    barcode: null,
    created_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}
