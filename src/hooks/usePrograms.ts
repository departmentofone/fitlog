import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Program, ProgramFoodSnapshot } from '../types'
import { useAuth } from './useAuth'
import type { MealPreset } from './useMealPresets'
import type { PresetWithItems } from './usePresets'
import type { RecipeWithIngredients } from './useRecipes'

export function usePrograms() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['programs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('programs').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as Program[]
    },
  })
}

export interface CreateProgramInput {
  name: string
  description: string
  dietGoal: Program['diet_goal']
  calorieGoal: number | null
  waterGoalMl: number | null
  workoutPresets: PresetWithItems[]
  recipes: RecipeWithIngredients[]
  mealPresets: MealPreset[]
}

function foodSnapshot(grams: number, servingLabel: string | null, food: { name: string; calories_per_100g: number; protein_per_100g: number; carbs_per_100g: number; fat_per_100g: number }): ProgramFoodSnapshot {
  return {
    foodName: food.name,
    caloriesPer100g: food.calories_per_100g,
    proteinPer100g: food.protein_per_100g,
    carbsPer100g: food.carbs_per_100g,
    fatPer100g: food.fat_per_100g,
    grams,
    servingLabel,
  }
}

export function useCreateProgram() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateProgramInput) => {
      if (!user) throw new Error('Not signed in')

      const workouts = input.workoutPresets.map((p) => ({
        name: p.name,
        items: p.workout_preset_items.map((i) => ({
          exerciseName: i.exercise.name,
          muscleGroup: i.exercise.muscle_group,
          setNumber: i.set_number,
          weight: i.weight,
          reps: i.reps,
        })),
      }))

      const recipes = input.recipes.map((r) => ({
        name: r.name,
        servings: r.servings,
        ingredients: r.recipe_ingredients.map((i) => foodSnapshot(i.grams, i.serving_label, i.food)),
      }))

      const mealPresets = input.mealPresets.map((p) => ({
        name: p.name,
        items: p.meal_preset_items.map((i) => foodSnapshot(i.grams, i.serving_label, i.food)),
      }))

      const { data, error } = await supabase
        .from('programs')
        .insert({
          user_id: user.id,
          name: input.name,
          description: input.description,
          diet_goal: input.dietGoal,
          calorie_goal: input.calorieGoal,
          water_goal_ml: input.waterGoalMl,
          workouts,
          recipes,
          meal_presets: mealPresets,
        })
        .select()
        .single()
      if (error) throw error
      return data as unknown as Program
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs', user?.id] }),
  })
}

export function useSetProgramShared() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ programId, isShared }: { programId: string; isShared: boolean }) => {
      const { error } = await supabase.from('programs').update({ is_shared: isShared }).eq('id', programId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs', user?.id] }),
  })
}

export function useDeleteProgram() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (programId: string) => {
      const { error } = await supabase.from('programs').delete().eq('id', programId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs', user?.id] }),
  })
}

/** Recreates a deleted program from its last-known snapshot, for the undo toast. */
export function useRestoreProgram() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (program: Program) => {
      if (!user) throw new Error('Not signed in')
      const { error } = await supabase.from('programs').insert({
        user_id: user.id,
        name: program.name,
        description: program.description,
        is_shared: program.is_shared,
        diet_goal: program.diet_goal,
        calorie_goal: program.calorie_goal,
        water_goal_ml: program.water_goal_ml,
        workouts: program.workouts,
        recipes: program.recipes,
        meal_presets: program.meal_presets,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs', user?.id] }),
  })
}

async function findOrCreateExercise(userId: string, name: string, muscleGroup: string): Promise<string> {
  const { data: existing, error: findError } = await supabase.from('exercises').select('id').ilike('name', name).limit(1).maybeSingle()
  if (findError) throw findError
  if (existing) return existing.id

  const { data: created, error: createError } = await supabase
    .from('exercises')
    .insert({ user_id: userId, name, muscle_group: muscleGroup })
    .select('id')
    .single()
  if (createError) throw createError
  return created.id
}

async function findOrCreateFood(userId: string, snapshot: ProgramFoodSnapshot): Promise<string> {
  const { data: existing, error: findError } = await supabase.from('foods').select('id').ilike('name', snapshot.foodName).limit(1).maybeSingle()
  if (findError) throw findError
  if (existing) return existing.id

  const { data: created, error: createError } = await supabase
    .from('foods')
    .insert({
      user_id: userId,
      name: snapshot.foodName,
      calories_per_100g: snapshot.caloriesPer100g,
      protein_per_100g: snapshot.proteinPer100g,
      carbs_per_100g: snapshot.carbsPer100g,
      fat_per_100g: snapshot.fatPer100g,
      common_servings: [],
    })
    .select('id')
    .single()
  if (createError) throw createError
  return created.id
}

export interface ImportProgramResult {
  workoutsImported: number
  recipesImported: number
  mealPresetsImported: number
}

export function useImportProgram() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ program, applyGoals }: { program: Program; applyGoals: boolean }): Promise<ImportProgramResult> => {
      if (!user) throw new Error('Not signed in')

      for (const workout of program.workouts) {
        const { data: preset, error: presetError } = await supabase
          .from('workout_presets')
          .insert({ user_id: user.id, name: workout.name })
          .select()
          .single()
        if (presetError) throw presetError

        const items = []
        for (const item of workout.items) {
          const exerciseId = await findOrCreateExercise(user.id, item.exerciseName, item.muscleGroup)
          items.push({ preset_id: preset.id, exercise_id: exerciseId, set_number: item.setNumber, weight: item.weight, reps: item.reps })
        }
        if (items.length > 0) {
          const { error: itemsError } = await supabase.from('workout_preset_items').insert(items)
          if (itemsError) throw itemsError
        }
      }

      for (const recipe of program.recipes) {
        const { data: created, error: recipeError } = await supabase
          .from('recipes')
          .insert({ user_id: user.id, name: recipe.name, servings: recipe.servings })
          .select()
          .single()
        if (recipeError) throw recipeError

        const ingredients = []
        for (const ing of recipe.ingredients) {
          const foodId = await findOrCreateFood(user.id, ing)
          ingredients.push({ recipe_id: created.id, food_id: foodId, grams: ing.grams, serving_label: ing.servingLabel })
        }
        if (ingredients.length > 0) {
          const { error: ingredientsError } = await supabase.from('recipe_ingredients').insert(ingredients)
          if (ingredientsError) throw ingredientsError
        }
      }

      for (const mealPreset of program.meal_presets) {
        const { data: created, error: presetError } = await supabase
          .from('meal_presets')
          .insert({ user_id: user.id, name: mealPreset.name })
          .select()
          .single()
        if (presetError) throw presetError

        const items = []
        for (const item of mealPreset.items) {
          const foodId = await findOrCreateFood(user.id, item)
          items.push({ preset_id: created.id, food_id: foodId, grams: item.grams, serving_label: item.servingLabel })
        }
        if (items.length > 0) {
          const { error: itemsError } = await supabase.from('meal_preset_items').insert(items)
          if (itemsError) throw itemsError
        }
      }

      if (applyGoals) {
        const { error: settingsError } = await supabase.from('user_settings').upsert(
          {
            user_id: user.id,
            ...(program.diet_goal ? { diet_goal: program.diet_goal } : {}),
            ...(program.calorie_goal != null ? { calorie_goal: program.calorie_goal } : {}),
            ...(program.water_goal_ml != null ? { water_goal_ml: program.water_goal_ml } : {}),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
        if (settingsError) throw settingsError
      }

      return {
        workoutsImported: program.workouts.length,
        recipesImported: program.recipes.length,
        mealPresetsImported: program.meal_presets.length,
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presets'] })
      qc.invalidateQueries({ queryKey: ['recipes'] })
      qc.invalidateQueries({ queryKey: ['meal-presets'] })
      qc.invalidateQueries({ queryKey: ['exercises'] })
      qc.invalidateQueries({ queryKey: ['foods'] })
      qc.invalidateQueries({ queryKey: ['user-settings', user?.id] })
    },
  })
}
