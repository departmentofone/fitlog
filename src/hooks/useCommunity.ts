import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { normalizeFoodText } from '../lib/foodSearch'
import { supabase } from '../lib/supabase'
import type { Exercise, Food, Program } from '../types'
import { useAuth } from './useAuth'
import type { MealPreset } from './useMealPresets'
import type { PresetWithItems } from './usePresets'
import type { RecipeWithIngredients } from './useRecipes'

/**
 * The Community tab: everything shared on FitLog (meal presets, recipes, workout presets,
 * programs), plus official items curated by FitLog (migration_v28). Browsing never touches your
 * own lists - saving makes an independent copy in your account, tagged with `source_id` so the
 * card can show "Saved".
 */
export type CommunityItem =
  | { kind: 'meal'; id: string; name: string; description: string | null; isOfficial: boolean; isMine: boolean; createdAt: string; meal: MealPreset }
  | { kind: 'recipe'; id: string; name: string; description: string | null; isOfficial: boolean; isMine: boolean; createdAt: string; recipe: RecipeWithIngredients }
  | { kind: 'workout'; id: string; name: string; description: string | null; isOfficial: boolean; isMine: boolean; createdAt: string; workout: PresetWithItems }
  | { kind: 'program'; id: string; name: string; description: string | null; isOfficial: boolean; isMine: boolean; createdAt: string; program: Program }

export type CommunityKind = CommunityItem['kind']

/** Report `item_type` values, matching the check constraint on community_reports. */
export const REPORT_TYPE: Record<CommunityKind, string> = {
  meal: 'meal_preset',
  recipe: 'recipe',
  workout: 'workout_preset',
  program: 'program',
}

// Plenty for browsing today; revisit with paging once there's real traffic.
const PAGE = 200

/** Official first (in the order they were curated), then everyone else's, newest first. */
export function sortCommunity(items: CommunityItem[]): CommunityItem[] {
  return [...items].sort((a, b) => {
    if (a.isOfficial !== b.isOfficial) return a.isOfficial ? -1 : 1
    return a.isOfficial ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)
  })
}

/** Everything a Community search matches on: the item's name and description plus what's inside it. */
export function communitySearchText(item: CommunityItem): string {
  const parts = [item.name, item.description ?? '']
  if (item.kind === 'meal') parts.push(...item.meal.meal_preset_items.map((i) => i.food?.name ?? ''))
  if (item.kind === 'recipe') parts.push(...item.recipe.recipe_ingredients.map((i) => i.food?.name ?? ''))
  if (item.kind === 'workout') parts.push(...item.workout.workout_preset_items.map((i) => i.exercise?.name ?? ''))
  if (item.kind === 'program') {
    const p = item.program
    parts.push(...p.workouts.map((w) => w.name), ...p.recipes.map((r) => r.name), ...p.meal_presets.map((m) => m.name))
  }
  return normalizeFoodText(parts.join(' '))
}

export function useCommunity() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['community', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<CommunityItem[]> => {
      const [meals, recipes, workouts, programs] = await Promise.all([
        supabase.from('meal_presets').select('*, meal_preset_items(*, food:foods(*))').eq('is_shared', true).order('created_at', { ascending: false }).limit(PAGE),
        supabase.from('recipes').select('*, recipe_ingredients(*, food:foods(*))').eq('is_shared', true).order('created_at', { ascending: false }).limit(PAGE),
        supabase.from('workout_presets').select('*, workout_preset_items(*, exercise:exercises(*))').eq('is_shared', true).order('created_at', { ascending: false }).limit(PAGE),
        supabase.from('programs').select('*').eq('is_shared', true).order('created_at', { ascending: false }).limit(PAGE),
      ])
      for (const r of [meals, recipes, workouts, programs]) if (r.error) throw r.error

      const base = (row: { id: string; name: string; user_id: string; created_at: string; is_official?: boolean; description?: string | null }) => ({
        id: row.id,
        name: row.name,
        description: row.description?.trim() || null,
        isOfficial: !!row.is_official,
        isMine: row.user_id === user?.id,
        createdAt: row.created_at,
      })

      return sortCommunity([
        ...(meals.data as unknown as MealPreset[]).filter((m) => m.meal_preset_items.length > 0).map((meal) => ({ kind: 'meal' as const, ...base(meal), meal })),
        ...(recipes.data as unknown as RecipeWithIngredients[]).filter((r) => r.recipe_ingredients.length > 0).map((recipe) => ({ kind: 'recipe' as const, ...base(recipe), recipe })),
        ...(workouts.data as unknown as PresetWithItems[]).filter((w) => w.workout_preset_items.length > 0).map((workout) => ({ kind: 'workout' as const, ...base(workout), workout })),
        ...(programs.data as unknown as Program[]).map((program) => ({ kind: 'program' as const, ...base(program), program })),
      ])
    },
  })
}

const FOOD_COPY_FIELDS = [
  'name', 'calories_per_100g', 'protein_per_100g', 'carbs_per_100g', 'fat_per_100g', 'common_servings',
  'fiber_g', 'sugar_g', 'sodium_mg', 'cholesterol_mg', 'potassium_mg', 'calcium_mg', 'iron_mg', 'vitamin_c_mg', 'vitamin_a_mcg',
] as const

/**
 * A copy must not depend on someone else's private food: if they stop sharing (or delete their
 * account), their food turns into "Unavailable food" in your copy. Shared-library foods and your
 * own are used as-is; another user's custom food is copied into your account first.
 */
async function ownFoodId(userId: string, food: Food, cache: Map<string, string>): Promise<string> {
  if (food.user_id === null || food.user_id === userId) return food.id
  const cached = cache.get(food.id)
  if (cached) return cached
  const row: Record<string, unknown> = { user_id: userId }
  for (const key of FOOD_COPY_FIELDS) row[key] = food[key]
  const { data, error } = await supabase.from('foods').insert(row).select('id').single()
  if (error) throw error
  cache.set(food.id, data.id)
  return data.id
}

/** Same idea for exercises: reuse a shared-library or own exercise with that name, else create one. */
async function ownExerciseId(userId: string, exercise: Exercise, cache: Map<string, string>): Promise<string> {
  if (exercise.user_id === null || exercise.user_id === userId) return exercise.id
  const cached = cache.get(exercise.id)
  if (cached) return cached
  const { data: existing, error: findError } = await supabase
    .from('exercises')
    .select('id')
    .ilike('name', exercise.name)
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .limit(1)
    .maybeSingle()
  if (findError) throw findError
  let id = existing?.id as string | undefined
  if (!id) {
    const { data, error } = await supabase.from('exercises').insert({ user_id: userId, name: exercise.name, muscle_group: exercise.muscle_group }).select('id').single()
    if (error) throw error
    id = data.id as string
  }
  cache.set(exercise.id, id)
  return id
}

/** Saves a copy of a meal preset, recipe or workout preset into your account. */
export function useSaveCommunityItem() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (item: Exclude<CommunityItem, { kind: 'program' }>) => {
      if (!user) throw new Error('Not signed in')
      const foods = new Map<string, string>()

      if (item.kind === 'meal') {
        const { data: preset, error } = await supabase
          .from('meal_presets')
          .insert({ user_id: user.id, name: item.name, description: item.description, source_id: item.id })
          .select('id')
          .single()
        if (error) throw error
        const rows = []
        for (const i of item.meal.meal_preset_items) {
          if (!i.food) continue // unreadable to us - nothing to copy
          rows.push({ preset_id: preset.id, food_id: await ownFoodId(user.id, i.food, foods), grams: i.grams, serving_label: i.serving_label })
        }
        if (rows.length > 0) {
          const { error: itemsError } = await supabase.from('meal_preset_items').insert(rows)
          if (itemsError) throw itemsError
        }
        return
      }

      if (item.kind === 'recipe') {
        const { data: recipe, error } = await supabase
          .from('recipes')
          .insert({ user_id: user.id, name: item.name, servings: item.recipe.servings, description: item.description, source_id: item.id })
          .select('id')
          .single()
        if (error) throw error
        const rows = []
        for (const i of item.recipe.recipe_ingredients) {
          if (!i.food) continue
          rows.push({ recipe_id: recipe.id, food_id: await ownFoodId(user.id, i.food, foods), grams: i.grams, serving_label: i.serving_label })
        }
        if (rows.length > 0) {
          const { error: itemsError } = await supabase.from('recipe_ingredients').insert(rows)
          if (itemsError) throw itemsError
        }
        return
      }

      const exercises = new Map<string, string>()
      const { data: preset, error } = await supabase
        .from('workout_presets')
        .insert({ user_id: user.id, name: item.name, description: item.description, source_id: item.id })
        .select('id')
        .single()
      if (error) throw error
      const rows = []
      for (const i of item.workout.workout_preset_items) {
        if (!i.exercise) continue
        rows.push({
          preset_id: preset.id,
          exercise_id: await ownExerciseId(user.id, i.exercise, exercises),
          set_number: i.set_number,
          weight: i.weight,
          reps: i.reps,
          is_warmup: i.is_warmup ?? false,
        })
      }
      if (rows.length > 0) {
        const { error: itemsError } = await supabase.from('workout_preset_items').insert(rows)
        if (itemsError) throw itemsError
      }
    },
    onSuccess: (_data, item) => {
      const key = item.kind === 'meal' ? 'meal-presets' : item.kind === 'recipe' ? 'recipes' : 'presets'
      qc.invalidateQueries({ queryKey: [key] })
      qc.invalidateQueries({ queryKey: ['foods'] })
      qc.invalidateQueries({ queryKey: ['exercises'] })
    },
  })
}

export function useReportCommunityItem() {
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ item, reason }: { item: CommunityItem; reason: string }) => {
      if (!user) throw new Error('Not signed in')
      const { error } = await supabase.from('community_reports').insert({
        reporter_id: user.id,
        item_type: REPORT_TYPE[item.kind],
        item_id: item.id,
        item_name: item.name,
        reason: reason.trim().slice(0, 500) || null,
      })
      if (error) throw error
    },
  })
}
