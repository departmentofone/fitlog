import { macrosForGrams, sumMacros, type Food, type MacroTotals } from '../types'
import type { RecipeIngredient } from '../types'

export interface RecipeIngredientWithFood extends RecipeIngredient {
  /** Null when the food belongs to another user and RLS hides it - see macrosForGrams. */
  food: Food | null
}

export function computeRecipeMacros(ingredients: RecipeIngredientWithFood[]): {
  total: MacroTotals
  perServing: (servings: number) => MacroTotals
} {
  const total = sumMacros(ingredients.map((i) => macrosForGrams(i.food, i.grams)))
  return {
    total,
    perServing: (servings: number) => {
      if (servings <= 0) return total
      return {
        calories: total.calories / servings,
        protein: total.protein / servings,
        carbs: total.carbs / servings,
        fat: total.fat / servings,
      }
    },
  }
}
