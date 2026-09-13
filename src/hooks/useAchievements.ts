import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Food } from '../types'
import { useAuth } from './useAuth'
import { todayISO } from './useWorkouts'

export interface Achievements {
  totalVolumeKg: number
  totalSets: number
  totalSessions: number
  preworkoutCount: number
  currentStreak: number
  bestStreak: number
  distinctExercises: number
  distinctMuscleGroups: number
  earlyBird: boolean
  nightOwl: boolean
  weekendWarrior: boolean
  comebackKid: boolean
  distinctFoods: number
  mealStreakBest: number
  maxDailyProtein: number
  hydrationStreakBest: number
}

export const VOLUME_BADGES = [
  { threshold: 1_000, label: '1,000 kg moved', emoji: '🥉' },
  { threshold: 10_000, label: '10,000 kg moved', emoji: '🥈' },
  { threshold: 50_000, label: '50,000 kg moved', emoji: '🥇' },
  { threshold: 100_000, label: '100,000 kg moved', emoji: '🏆' },
]

export const SESSION_BADGES = [
  { threshold: 1, label: 'First workout logged', emoji: '🎉' },
  { threshold: 10, label: '10 workouts', emoji: '🔥' },
  { threshold: 50, label: '50 workouts', emoji: '💪' },
  { threshold: 100, label: '100 workouts', emoji: '🏅' },
]

export const STREAK_BADGES = [
  { threshold: 3, label: '3-day workout streak', emoji: '🔥' },
  { threshold: 7, label: '1-week workout streak', emoji: '⚡' },
  { threshold: 30, label: '30-day workout streak', emoji: '🌟' },
]

export function funVolumeComparison(kg: number): string | null {
  if (kg < 200) return null
  const cars = kg / 1500
  if (cars < 1) return null
  return `That's about ${cars.toFixed(1)}× a small car (1,500 kg) moved in total.`
}

/** Converts a 'YYYY-MM-DD' string to a timezone-independent integer day count. */
export function toDayNumber(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}

export function computeDayStreaks(dateStrings: string[]): { current: number; best: number } {
  const days = Array.from(new Set(dateStrings.map(toDayNumber))).sort((a, b) => a - b)
  if (days.length === 0) return { current: 0, best: 0 }

  let best = 1
  let running = 1
  for (let i = 1; i < days.length; i++) {
    running = days[i] - days[i - 1] === 1 ? running + 1 : 1
    best = Math.max(best, running)
  }

  const daySet = new Set(days)
  const todayNum = toDayNumber(todayISO())
  const anchor = daySet.has(todayNum) ? todayNum : daySet.has(todayNum - 1) ? todayNum - 1 : null

  let current = 0
  if (anchor !== null) {
    let cursor = anchor
    while (daySet.has(cursor)) {
      current++
      cursor--
    }
  }

  return { current, best }
}

export function useAchievements() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['achievements', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Achievements> => {
      const [setsRes, sessionsRes, mealsRes, waterRes, settingsRes] = await Promise.all([
        supabase.from('workout_sets').select('weight, reps, exercise_id, created_at, exercise:exercises(muscle_group)'),
        supabase.from('workout_sessions').select('date, preworkout'),
        supabase.from('meals').select('date, meal_items(food_id, grams, food:foods(protein_per_100g))'),
        supabase.from('water_logs').select('date, ml'),
        supabase.from('user_settings').select('water_goal_ml').eq('user_id', user!.id).maybeSingle(),
      ])
      if (setsRes.error) throw setsRes.error
      if (sessionsRes.error) throw sessionsRes.error
      if (mealsRes.error) throw mealsRes.error
      if (waterRes.error) throw waterRes.error

      type SetRow = { weight: number; reps: number; exercise_id: string; created_at: string; exercise: { muscle_group: string } | null }
      const sets = (setsRes.data ?? []) as unknown as SetRow[]
      const sessions = sessionsRes.data ?? []
      type MealRow = { date: string; meal_items: { food_id: string; grams: number; food: Food | null }[] }
      const meals = (mealsRes.data ?? []) as unknown as MealRow[]
      const water = waterRes.data ?? []
      const waterGoal = settingsRes.data?.water_goal_ml ?? 2000

      const totalVolumeKg = sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
      const { current, best } = computeDayStreaks(sessions.map((s) => s.date))

      const distinctExercises = new Set(sets.map((s) => s.exercise_id)).size
      const distinctMuscleGroups = new Set(sets.map((s) => s.exercise?.muscle_group).filter(Boolean)).size
      const earlyBird = sets.some((s) => new Date(s.created_at).getHours() < 7)
      const nightOwl = sets.some((s) => new Date(s.created_at).getHours() >= 22)

      const sessionDays = Array.from(new Set(sessions.map((s) => toDayNumber(s.date)))).sort((a, b) => a - b)
      const sessionDaySet = new Set(sessionDays)
      const weekendWarrior = sessionDays.some((d) => {
        const utcDow = new Date(d * 86_400_000).getUTCDay()
        return utcDow === 6 && sessionDaySet.has(d + 1)
      })
      const comebackKid = sessionDays.some((d, i) => i > 0 && d - sessionDays[i - 1] >= 7)

      const mealItems = meals.flatMap((m) => m.meal_items.map((item) => ({ ...item, date: m.date })))
      const distinctFoods = new Set(mealItems.map((i) => i.food_id)).size

      const mealDates = Array.from(new Set(meals.filter((m) => m.meal_items.length > 0).map((m) => m.date)))
      const mealStreakBest = computeDayStreaks(mealDates).best

      const proteinByDate = new Map<string, number>()
      for (const item of mealItems) {
        if (!item.food) continue
        const protein = (item.food.protein_per_100g * item.grams) / 100
        proteinByDate.set(item.date, (proteinByDate.get(item.date) ?? 0) + protein)
      }
      const maxDailyProtein = Math.max(0, ...Array.from(proteinByDate.values()))

      const hydrationDates = water.filter((w) => w.ml >= waterGoal).map((w) => w.date)
      const hydrationStreakBest = computeDayStreaks(hydrationDates).best

      return {
        totalVolumeKg,
        totalSets: sets.length,
        totalSessions: sessions.length,
        preworkoutCount: sessions.filter((s) => s.preworkout).length,
        currentStreak: current,
        bestStreak: best,
        distinctExercises,
        distinctMuscleGroups,
        earlyBird,
        nightOwl,
        weekendWarrior,
        comebackKid,
        distinctFoods,
        mealStreakBest,
        maxDailyProtein,
        hydrationStreakBest,
      }
    },
  })
}
