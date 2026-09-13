import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { todayISO } from './useWorkouts'

export interface Achievements {
  totalVolumeKg: number
  totalSets: number
  totalSessions: number
  preworkoutCount: number
  currentStreak: number
  bestStreak: number
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
  { threshold: 3, label: '3-day streak', emoji: '🔥' },
  { threshold: 7, label: '1-week streak', emoji: '⚡' },
  { threshold: 30, label: '30-day streak', emoji: '🌟' },
]

export function funVolumeComparison(kg: number): string | null {
  if (kg < 200) return null
  const cars = kg / 1500
  if (cars < 1) return null
  return `That's about ${cars.toFixed(1)}× a small car (1,500 kg) moved in total.`
}

/** Converts a 'YYYY-MM-DD' string to a timezone-independent integer day count. */
function toDayNumber(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}

function computeStreaks(dates: string[]): { current: number; best: number } {
  const days = Array.from(new Set(dates.map(toDayNumber))).sort((a, b) => a - b)
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
      const [setsRes, sessionsRes] = await Promise.all([
        supabase.from('workout_sets').select('weight, reps'),
        supabase.from('workout_sessions').select('date, preworkout'),
      ])
      if (setsRes.error) throw setsRes.error
      if (sessionsRes.error) throw sessionsRes.error

      const sets = setsRes.data ?? []
      const sessions = sessionsRes.data ?? []

      const totalVolumeKg = sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
      const { current, best } = computeStreaks(sessions.map((s) => s.date))

      return {
        totalVolumeKg,
        totalSets: sets.length,
        totalSessions: sessions.length,
        preworkoutCount: sessions.filter((s) => s.preworkout).length,
        currentStreak: current,
        bestStreak: best,
      }
    },
  })
}
