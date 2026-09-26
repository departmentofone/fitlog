import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { DietGoal, Food } from '../types'
import { useAuth } from './useAuth'
import { computeDayStreaks } from '../lib/streaks'

function meetsGoal(consumed: number, goal: number, type: DietGoal): boolean {
  if (type === 'deficit') return consumed <= goal
  if (type === 'surplus') return consumed >= goal
  return Math.abs(consumed - goal) <= goal * 0.1
}

export function useDietStreak(calorieGoal: number | null, dietGoal: DietGoal) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['diet-streak', user?.id, calorieGoal, dietGoal],
    enabled: !!user && !!calorieGoal,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meals')
        .select('date, meal_items(grams, food:foods(calories_per_100g))')
      if (error) throw error

      type Row = { date: string; meal_items: { grams: number; food: Food | null }[] }
      const byDate = new Map<string, number>()
      for (const meal of (data as unknown as Row[]) ?? []) {
        let total = byDate.get(meal.date) ?? 0
        for (const item of meal.meal_items) {
          if (!item.food) continue
          total += (item.food.calories_per_100g * item.grams) / 100
        }
        byDate.set(meal.date, total)
      }

      const qualifyingDates = Array.from(byDate.entries())
        .filter(([, calories]) => meetsGoal(calories, calorieGoal!, dietGoal))
        .map(([date]) => date)

      return computeDayStreaks(qualifyingDates)
    },
  })
}

export interface WeeklyAdherence {
  daysOnTarget: number
  daysWithData: number
}

/** How many of the last 7 days (including today) hit the calorie goal - the diet-side sibling of
 * the workout streak's weekly volume view. Days with no logged food don't count against you. */
export function useWeeklyAdherence(calorieGoal: number | null, dietGoal: DietGoal) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['weekly-adherence', user?.id, calorieGoal, dietGoal],
    enabled: !!user && !!calorieGoal,
    queryFn: async (): Promise<WeeklyAdherence> => {
      const today = new Date()
      const start = new Date(today)
      start.setDate(today.getDate() - 6)
      const startISO = start.toISOString().slice(0, 10)
      const endISO = today.toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('meals')
        .select('date, meal_items(grams, food:foods(calories_per_100g))')
        .gte('date', startISO)
        .lte('date', endISO)
      if (error) throw error

      type Row = { date: string; meal_items: { grams: number; food: Food | null }[] }
      const byDate = new Map<string, number>()
      for (const meal of (data as unknown as Row[]) ?? []) {
        let total = byDate.get(meal.date) ?? 0
        for (const item of meal.meal_items) {
          if (!item.food) continue
          total += (item.food.calories_per_100g * item.grams) / 100
        }
        byDate.set(meal.date, total)
      }

      const daysWithData = byDate.size
      const daysOnTarget = Array.from(byDate.values()).filter((calories) => meetsGoal(calories, calorieGoal!, dietGoal)).length
      return { daysOnTarget, daysWithData }
    },
  })
}

export interface RemainingInfo {
  remaining: number
  text: string
  tone: 'good' | 'warn' | 'neutral'
}

export function remainingCaloriesInfo(consumed: number, goal: number, type: DietGoal): RemainingInfo {
  const remaining = goal - consumed
  if (type === 'deficit') {
    if (remaining >= 0) return { remaining, text: `${Math.round(remaining)} kcal left today`, tone: 'good' }
    return { remaining, text: `${Math.round(-remaining)} kcal over budget`, tone: 'warn' }
  }
  if (type === 'surplus') {
    if (remaining > 0) return { remaining, text: `${Math.round(remaining)} kcal to go`, tone: 'neutral' }
    return { remaining, text: `Goal reached! +${Math.round(-remaining)} kcal over`, tone: 'good' }
  }
  // maintenance
  const band = goal * 0.1
  if (Math.abs(remaining) <= band) return { remaining, text: `On target (±${Math.round(band)} kcal)`, tone: 'good' }
  // Under target is where every day starts, so it's informational; only going over is a warning.
  return remaining > 0
    ? { remaining, text: `${Math.round(remaining)} kcal under target`, tone: 'neutral' }
    : { remaining, text: `${Math.round(-remaining)} kcal over target`, tone: 'warn' }
}
