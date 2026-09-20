import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Recipe } from '../types'
import { useAuth } from './useAuth'

export { computeRecipeMacros, type RecipeIngredientWithFood } from '../lib/recipeMacros'
import type { RecipeIngredientWithFood } from '../lib/recipeMacros'

export interface RecipeWithIngredients extends Recipe {
  recipe_ingredients: RecipeIngredientWithFood[]
}

export function useRecipes() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['recipes', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*, recipe_ingredients(*, food:foods(*))')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as RecipeWithIngredients[]
    },
  })
}

export function useCreateRecipe() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      name,
      servings,
      ingredients,
    }: {
      name: string
      servings: number
      ingredients: { foodId: string; grams: number; servingLabel: string | null }[]
    }) => {
      if (!user) throw new Error('Not signed in')
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({ user_id: user.id, name, servings })
        .select()
        .single()
      if (recipeError) throw recipeError

      const items = ingredients.map((i) => ({
        recipe_id: recipe.id,
        food_id: i.foodId,
        grams: i.grams,
        serving_label: i.servingLabel,
      }))
      if (items.length > 0) {
        const { error: itemsError } = await supabase.from('recipe_ingredients').insert(items)
        if (itemsError) throw itemsError
      }
      return recipe as Recipe
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes', user?.id] }),
  })
}

export function useAddRecipeIngredient() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      recipeId,
      foodId,
      grams,
      servingLabel,
    }: {
      recipeId: string
      foodId: string
      grams: number
      servingLabel: string | null
    }) => {
      const { error } = await supabase
        .from('recipe_ingredients')
        .insert({ recipe_id: recipeId, food_id: foodId, grams, serving_label: servingLabel })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes', user?.id] }),
  })
}

export function useRemoveRecipeIngredient() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ingredientId: string) => {
      const { error } = await supabase.from('recipe_ingredients').delete().eq('id', ingredientId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes', user?.id] }),
  })
}

export function useDeleteRecipe() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (recipeId: string) => {
      const { error } = await supabase.from('recipes').delete().eq('id', recipeId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes', user?.id] }),
  })
}

export function useSetRecipeShared() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ recipeId, isShared }: { recipeId: string; isShared: boolean }) => {
      const { error } = await supabase.from('recipes').update({ is_shared: isShared }).eq('id', recipeId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes', user?.id] }),
  })
}

export function useUpdateRecipeServings() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ recipeId, servings }: { recipeId: string; servings: number }) => {
      const { error } = await supabase.from('recipes').update({ servings }).eq('id', recipeId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes', user?.id] }),
  })
}

/**
 * Rescales a recipe to a new serving count: updates `servings` and multiplies every
 * ingredient's `grams` by the same ratio, so the recipe's total (and per-serving) macros
 * stay proportionally consistent instead of just changing the serving count in place.
 */
export function useRescaleRecipe() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      recipe,
      newServings,
    }: {
      recipe: RecipeWithIngredients
      newServings: number
    }) => {
      if (recipe.servings <= 0) throw new Error('Recipe has no servings')
      if (newServings <= 0) throw new Error('Servings must be positive')
      const scale = newServings / recipe.servings

      // Ingredients first, servings last: if an ingredient update fails mid-batch, servings still
      // matches the old grams, so per-serving macros stay correct instead of silently drifting.
      const results = await Promise.all(
        recipe.recipe_ingredients.map((i) =>
          supabase
            .from('recipe_ingredients')
            .update({ grams: i.grams * scale })
            .eq('id', i.id),
        ),
      )
      const failed = results.find((r) => r.error)
      if (failed?.error) throw failed.error

      const { error: recipeError } = await supabase
        .from('recipes')
        .update({ servings: newServings })
        .eq('id', recipe.id)
      if (recipeError) throw recipeError
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes', user?.id] }),
  })
}

/** Adds a scaled portion of a recipe's ingredients into an existing logged meal. */
export function useAddRecipeToMeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      recipe,
      mealId,
      servingsToAdd,
    }: {
      recipe: RecipeWithIngredients
      mealId: string
      servingsToAdd: number
    }) => {
      if (recipe.servings <= 0) throw new Error('Recipe has no servings')
      const scale = servingsToAdd / recipe.servings

      const items = recipe.recipe_ingredients.map((i) => ({
        meal_id: mealId,
        food_id: i.food_id,
        grams: i.grams * scale,
        serving_label: scale === 1 ? i.serving_label : null,
      }))
      if (items.length > 0) {
        const { error } = await supabase.from('meal_items').insert(items)
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meals'] }),
  })
}
