import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { macrosForGrams, microsForGrams, sumMacros, sumMicros, type Food, type Meal, type MealItem } from '../types'
import { useAuth } from './useAuth'
import { todayISO } from './useWorkouts'

export interface MealItemWithFood extends MealItem {
  food: Food
}

export interface MealWithItems extends Meal {
  meal_items: MealItemWithFood[]
}

export function useMealsForDate(date: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['meals', user?.id, date],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meals')
        .select('*, meal_items(*, food:foods(*))')
        .eq('date', date)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as unknown as MealWithItems[]
    },
  })
}

export function useCreateMeal() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ date, name }: { date: string; name: string }) => {
      if (!user) throw new Error('Not signed in')
      const { data, error } = await supabase
        .from('meals')
        .insert({ user_id: user.id, date, name })
        .select()
        .single()
      if (error) throw error
      return data as Meal
    },
    onSuccess: (meal) => qc.invalidateQueries({ queryKey: ['meals', user?.id, meal.date] }),
  })
}

export function useAddMealItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      mealId,
      foodId,
      grams,
      servingLabel,
    }: {
      mealId: string
      foodId: string
      grams: number
      servingLabel?: string | null
    }) => {
      const { error } = await supabase
        .from('meal_items')
        .insert({ meal_id: mealId, food_id: foodId, grams, serving_label: servingLabel ?? null })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meals'] }),
  })
}

export function useSetMealCompleted() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ mealId, completed }: { mealId: string; completed: boolean }) => {
      const { error } = await supabase.from('meals').update({ completed }).eq('id', mealId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meals'] }),
  })
}

export function useCopyMealsDay() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ fromDate, toDate }: { fromDate: string; toDate: string }) => {
      if (!user) throw new Error('Not signed in')
      const { data: meals, error } = await supabase
        .from('meals')
        .select('*, meal_items(*)')
        .eq('date', fromDate)
      if (error) throw error

      for (const meal of (meals as unknown as (Meal & { meal_items: MealItem[] })[]) ?? []) {
        const { data: newMeal, error: mealError } = await supabase
          .from('meals')
          .insert({ user_id: user.id, date: toDate, name: meal.name })
          .select()
          .single()
        if (mealError) throw mealError

        if (meal.meal_items.length > 0) {
          const items = meal.meal_items.map((i) => ({
            meal_id: newMeal.id,
            food_id: i.food_id,
            grams: i.grams,
            serving_label: i.serving_label,
          }))
          const { error: itemsError } = await supabase.from('meal_items').insert(items)
          if (itemsError) throw itemsError
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meals'] }),
  })
}

export function useDeleteMealItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('meal_items').delete().eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meals'] }),
  })
}

const MEAL_PHOTOS_BUCKET = 'meal-photos'

/**
 * Uploads (or replaces) the photo attached to a logged meal. Mirrors
 * useUploadProgressPhoto in useProgressEntries.ts: private bucket, path
 * `<user_id>/<meal_id>.<ext>`, old file cleaned up once the new one is stored.
 *
 * This is a user-triggered write, not a query that runs automatically on page load, so it's
 * fine for it to simply fail (surfaced by the caller's mutation `onError`) on a database that
 * hasn't run migration_v17_meal_photos.sql yet rather than needing to degrade silently.
 */
export function useUploadMealPhoto() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      mealId,
      file,
      previousPath,
    }: {
      mealId: string
      date: string
      file: File
      previousPath?: string | null
    }) => {
      if (!user) throw new Error('Not signed in')
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/${mealId}.${ext}`

      const { error: uploadError } = await supabase.storage.from(MEAL_PHOTOS_BUCKET).upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      if (previousPath && previousPath !== path) {
        await supabase.storage.from(MEAL_PHOTOS_BUCKET).remove([previousPath])
      }

      const { error } = await supabase.from('meals').update({ photo_path: path }).eq('id', mealId)
      if (error) throw error
    },
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: ['meals', user?.id, variables.date] }),
  })
}

/** Mirrors useSignedPhotoUrl in useProgressEntries.ts, against the meal-photos bucket. */
export function useSignedMealPhotoUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ['meal-photo-url', path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(MEAL_PHOTOS_BUCKET).createSignedUrl(path!, 3600)
      if (error) throw error
      return data.signedUrl
    },
  })
}

export function dailyTotals(meals: MealWithItems[] | undefined) {
  if (!meals) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  const all = meals.flatMap((m) => m.meal_items.map((item) => macrosForGrams(item.food, item.grams)))
  return sumMacros(all)
}

export function dailyMicroTotals(meals: MealWithItems[] | undefined) {
  const all = (meals ?? []).flatMap((m) => m.meal_items.map((item) => microsForGrams(item.food, item.grams)))
  return sumMicros(all)
}

export interface DayMacroPoint {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export function useMacroTrend(days: number) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['macro-trend', user?.id, days],
    enabled: !!user,
    queryFn: async (): Promise<DayMacroPoint[]> => {
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - (days - 1))
      const startISO = start.toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('meals')
        .select('date, meal_items(grams, food:foods(*))')
        .gte('date', startISO)
        .lte('date', todayISO())
      if (error) throw error

      const byDate = new Map<string, DayMacroPoint>()
      for (let i = 0; i < days; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        const key = d.toISOString().slice(0, 10)
        byDate.set(key, { date: key, calories: 0, protein: 0, carbs: 0, fat: 0 })
      }

      type Row = { date: string; meal_items: { grams: number; food: Food }[] }
      for (const meal of (data as unknown as Row[]) ?? []) {
        const point = byDate.get(meal.date)
        if (!point) continue
        for (const item of meal.meal_items) {
          if (!item.food) continue
          const m = macrosForGrams(item.food, item.grams)
          point.calories += m.calories
          point.protein += m.protein
          point.carbs += m.carbs
          point.fat += m.fat
        }
      }

      return Array.from(byDate.values())
    },
  })
}
