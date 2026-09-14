import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Food } from '../types'
import { useAuth } from './useAuth'

export interface WeeklyDigest {
  workoutsThisWeek: number
  workoutsLastWeek: number
  totalVolume: number
  avgCalories: number
  avgProtein: number
  weightChange: number | null
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function useWeeklyDigest() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['weekly-digest', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<WeeklyDigest> => {
      const today = new Date()
      const startThisWeek = new Date(today)
      startThisWeek.setDate(today.getDate() - 6)
      const startLastWeek = new Date(today)
      startLastWeek.setDate(today.getDate() - 13)
      const endLastWeek = new Date(today)
      endLastWeek.setDate(today.getDate() - 7)

      // !inner excludes sessions with no logged sets (e.g. auto-created just by viewing a date).
      const [sessionsThis, sessionsLast, meals, setsRes, progress] = await Promise.all([
        supabase.from('workout_sessions').select('id, workout_sets!inner(id)').gte('date', iso(startThisWeek)).lte('date', iso(today)),
        supabase.from('workout_sessions').select('id, workout_sets!inner(id)').gte('date', iso(startLastWeek)).lte('date', iso(endLastWeek)),
        supabase
          .from('meals')
          .select('date, meal_items(grams, food:foods(calories_per_100g, protein_per_100g))')
          .gte('date', iso(startThisWeek))
          .lte('date', iso(today)),
        supabase
          .from('workout_sets')
          .select('weight, reps, session:workout_sessions!inner(date)')
          .gte('session.date', iso(startThisWeek)),
        supabase.from('progress_entries').select('date, weight').gte('date', iso(startThisWeek)).order('date'),
      ])

      type MealRow = { date: string; meal_items: { grams: number; food: Food | null }[] }
      let totalCalories = 0
      let totalProtein = 0
      for (const meal of (meals.data as unknown as MealRow[]) ?? []) {
        for (const item of meal.meal_items) {
          if (!item.food) continue
          totalCalories += (item.food.calories_per_100g * item.grams) / 100
          totalProtein += (item.food.protein_per_100g * item.grams) / 100
        }
      }

      type SetRow = { weight: number; reps: number }
      const totalVolume = ((setsRes.data as unknown as SetRow[]) ?? []).reduce((sum, s) => sum + s.weight * s.reps, 0)

      const weights = (progress.data ?? []).filter((p) => p.weight != null)
      const weightChange =
        weights.length >= 2 ? (weights[weights.length - 1].weight as number) - (weights[0].weight as number) : null

      return {
        workoutsThisWeek: sessionsThis.data?.length ?? 0,
        workoutsLastWeek: sessionsLast.data?.length ?? 0,
        totalVolume,
        avgCalories: totalCalories / 7,
        avgProtein: totalProtein / 7,
        weightChange,
      }
    },
  })
}
