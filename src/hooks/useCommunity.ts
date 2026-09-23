import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { normalizeFoodText } from '../lib/foodSearch'
import { supabase } from '../lib/supabase'
import type { DietWithFoods, Exercise, Food, MealPlanWithItems, Program } from '../types'
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
  | { kind: 'meal'; id: string; name: string; description: string | null; isOfficial: boolean; isMine: boolean; ownerId: string; createdAt: string; meal: MealPreset }
  | { kind: 'recipe'; id: string; name: string; description: string | null; isOfficial: boolean; isMine: boolean; ownerId: string; createdAt: string; recipe: RecipeWithIngredients }
  | { kind: 'workout'; id: string; name: string; description: string | null; isOfficial: boolean; isMine: boolean; ownerId: string; createdAt: string; workout: PresetWithItems }
  | { kind: 'program'; id: string; name: string; description: string | null; isOfficial: boolean; isMine: boolean; ownerId: string; createdAt: string; program: Program }
  /** `dietName` is set when the plan is one of a diet's sample days (migration_v29). */
  | { kind: 'plan'; id: string; name: string; description: string | null; isOfficial: boolean; isMine: boolean; ownerId: string; createdAt: string; plan: MealPlanWithItems; dietName: string | null }
  | { kind: 'diet'; id: string; name: string; description: string | null; isOfficial: boolean; isMine: boolean; ownerId: string; createdAt: string; diet: DietWithFoods; plans: MealPlanWithItems[] }

export type CommunityKind = CommunityItem['kind']

/** Report `item_type` values, matching the check constraint on community_reports. */
export const REPORT_TYPE: Record<CommunityKind, string> = {
  meal: 'meal_preset',
  recipe: 'recipe',
  workout: 'workout_preset',
  program: 'program',
  plan: 'meal_plan',
  diet: 'diet',
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
  if (item.kind === 'plan') parts.push(item.dietName ?? '', ...item.plan.meal_plan_items.map((i) => i.food?.name ?? ''))
  if (item.kind === 'diet') parts.push(...item.diet.diet_foods.map((f) => f.food?.name ?? ''), ...item.plans.map((p) => p.name))
  return normalizeFoodText(parts.join(' '))
}

export function useCommunity() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['community', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<CommunityItem[]> => {
      const [meals, recipes, workouts, programs, plans, diets] = await Promise.all([
        supabase.from('meal_presets').select('*, meal_preset_items(*, food:foods(*))').eq('is_shared', true).order('created_at', { ascending: false }).limit(PAGE),
        supabase.from('recipes').select('*, recipe_ingredients(*, food:foods(*))').eq('is_shared', true).order('created_at', { ascending: false }).limit(PAGE),
        supabase.from('workout_presets').select('*, workout_preset_items(*, exercise:exercises(*))').eq('is_shared', true).order('created_at', { ascending: false }).limit(PAGE),
        supabase.from('programs').select('*').eq('is_shared', true).order('created_at', { ascending: false }).limit(PAGE),
        // Standalone plans only - a diet's sample plans come in with the diet below.
        supabase.from('meal_plans').select('*, meal_plan_items(*, food:foods(*))').eq('is_shared', true).is('diet_id', null).order('created_at', { ascending: false }).limit(PAGE),
        supabase.from('diets').select('*, diet_foods(diet_id, food_id, food:foods(*)), meal_plans(*, meal_plan_items(*, food:foods(*)))').eq('is_shared', true).order('created_at', { ascending: false }).limit(PAGE),
      ])
      // One type failing (e.g. a table a pending migration hasn't created yet) shouldn't blank
      // the whole tab - skip that type. Only fail if nothing loaded at all.
      const results = [meals, recipes, workouts, programs, plans, diets]
      const failed = results.filter((r) => r.error)
      if (failed.length === results.length) throw failed[0].error
      for (const r of failed) console.warn('Community: skipped a type that failed to load', r.error)
      const rows = <T,>(r: { data: unknown; error: unknown }) => (r.error ? [] : ((r.data ?? []) as T[]))

      const base = (row: { id: string; name: string; user_id: string; created_at: string; is_official?: boolean; description?: string | null }) => ({
        id: row.id,
        name: row.name,
        description: row.description?.trim() || null,
        isOfficial: !!row.is_official,
        isMine: row.user_id === user?.id,
        ownerId: row.user_id,
        createdAt: row.created_at,
      })

      return sortCommunity([
        ...rows<MealPreset>(meals).filter((m) => m.meal_preset_items.length > 0).map((meal) => ({ kind: 'meal' as const, ...base(meal), meal })),
        ...rows<RecipeWithIngredients>(recipes).filter((r) => r.recipe_ingredients.length > 0).map((recipe) => ({ kind: 'recipe' as const, ...base(recipe), recipe })),
        ...rows<PresetWithItems>(workouts).filter((w) => w.workout_preset_items.length > 0).map((workout) => ({ kind: 'workout' as const, ...base(workout), workout })),
        ...rows<Program>(programs).map((program) => ({ kind: 'program' as const, ...base(program), program })),
        ...rows<MealPlanWithItems>(plans)
          .filter((p) => p.meal_plan_items.length > 0)
          .map((plan) => ({ kind: 'plan' as const, ...base(plan), plan, dietName: null })),
        ...rows<DietWithFoods & { meal_plans: MealPlanWithItems[] }>(diets)
          .filter((d) => d.diet_foods.length > 0)
          .flatMap((diet) => {
            const samples = [...diet.meal_plans].sort((a, b) => a.created_at.localeCompare(b.created_at))
            return [
              { kind: 'diet' as const, ...base(diet), diet, plans: samples },
              // Sample days are browsable as plans too, labeled with the diet they come from.
              ...samples
                .filter((p) => p.meal_plan_items.length > 0)
                .map((plan) => ({ kind: 'plan' as const, ...base({ ...plan, is_official: diet.is_official, user_id: diet.user_id }), plan, dietName: diet.name })),
            ]
          }),
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

/** Copies a meal plan (and its items) into your account; returns the new plan's id. */
async function copyPlan(userId: string, plan: MealPlanWithItems, dietId: string | null, foods: Map<string, string>): Promise<string> {
  const { data, error } = await supabase
    .from('meal_plans')
    .insert({ user_id: userId, name: plan.name, description: plan.description, days: plan.days, diet_id: dietId, source_id: plan.id })
    .select('id')
    .single()
  if (error) throw error
  const rows = []
  for (const i of plan.meal_plan_items) {
    if (!i.food) continue
    rows.push({
      plan_id: data.id, day_index: i.day_index, meal_name: i.meal_name, meal_order: i.meal_order, item_order: i.item_order,
      food_id: await ownFoodId(userId, i.food, foods), grams: i.grams, serving_label: i.serving_label,
    })
  }
  if (rows.length > 0) {
    const { error: itemsError } = await supabase.from('meal_plan_items').insert(rows)
    if (itemsError) throw itemsError
  }
  return data.id as string
}

/**
 * Saves a copy of a meal preset, recipe, workout preset, meal plan or diet into your account.
 * A diet brings its sample plans along; with `follow`, you also start following the copy.
 */
export function useSaveCommunityItem() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ item, follow = false }: { item: Exclude<CommunityItem, { kind: 'program' }>; follow?: boolean }) => {
      if (!user) throw new Error('Not signed in')
      const foods = new Map<string, string>()

      if (item.kind === 'plan') {
        await copyPlan(user.id, item.plan, null, foods)
        return
      }

      if (item.kind === 'diet') {
        const { data: diet, error } = await supabase
          .from('diets')
          .insert({ user_id: user.id, name: item.name, description: item.description, source_id: item.id })
          .select('id')
          .single()
        if (error) throw error
        const rows = []
        for (const f of item.diet.diet_foods) {
          if (!f.food) continue
          rows.push({ diet_id: diet.id, food_id: await ownFoodId(user.id, f.food, foods) })
        }
        if (rows.length > 0) {
          const { error: foodsError } = await supabase.from('diet_foods').upsert(rows, { ignoreDuplicates: true })
          if (foodsError) throw foodsError
        }
        for (const plan of item.plans) await copyPlan(user.id, plan, diet.id, foods)
        if (follow) {
          const { error: settingsError } = await supabase
            .from('user_settings')
            .upsert({ user_id: user.id, active_diet_id: diet.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
          if (settingsError) throw settingsError
        }
        return
      }

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
    onSuccess: (_data, { item }) => {
      const keys: Record<string, string[]> = {
        meal: ['meal-presets'],
        recipe: ['recipes'],
        workout: ['presets'],
        plan: ['meal-plans'],
        diet: ['diets', 'meal-plans', 'user-settings'],
      }
      for (const key of keys[item.kind]) qc.invalidateQueries({ queryKey: [key] })
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

/** True for the account that runs FitLog (is_site_owner, v25) - it gets moderation tools. */
export function useIsSiteOwner() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['is-site-owner', user?.id],
    enabled: !!user,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_site_owner')
      if (error) return false
      return data === true
    },
  })
}

export interface CommunityReport {
  id: string
  item_type: string
  item_id: string
  item_name: string | null
  reason: string | null
  created_at: string
}

/** Reports - only the owner can read them (RLS); everyone else just gets an empty list. */
export function useCommunityReports(enabled: boolean) {
  return useQuery({
    queryKey: ['community-reports'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from('community_reports').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as CommunityReport[]
    },
  })
}

/** Owner only: takes an item out of Community (it stays in its creator's account) and clears its reports. */
export function useModerateCommunityItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemType, itemId }: { itemType: string; itemId: string }) => {
      const { error } = await supabase.rpc('moderate_community_item', { p_type: itemType, p_id: itemId })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community'] })
      qc.invalidateQueries({ queryKey: ['community-reports'] })
    },
  })
}

export function useDismissReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase.from('community_reports').delete().eq('id', reportId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-reports'] }),
  })
}
