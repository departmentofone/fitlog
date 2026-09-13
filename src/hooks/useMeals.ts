import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { macrosForGrams, sumMacros, type Food, type Meal, type MealItem } from '../types'
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

export function dailyTotals(meals: MealWithItems[] | undefined) {
  if (!meals) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  const all = meals.flatMap((m) => m.meal_items.map((item) => macrosForGrams(item.food, item.grams)))
  return sumMacros(all)
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
