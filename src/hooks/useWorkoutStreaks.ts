import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { computeDayStreaks } from '../lib/streaks'
import { useAuth } from './useAuth'

export interface WorkoutStreaks {
  totalSessions: number
  currentStreak: number
  bestStreak: number
}

export function useWorkoutStreaks() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['workout-streaks', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<WorkoutStreaks> => {
      // !inner excludes sessions with no logged sets (e.g. auto-created just by viewing a date).
      const [sessionsRes, restDaysRes] = await Promise.all([
        supabase.from('workout_sessions').select('date, workout_sets!inner(id)'),
        supabase.from('rest_days').select('date'),
      ])
      if (sessionsRes.error) throw sessionsRes.error
      // rest_days may not exist yet on a database that hasn't run migration_v14 - degrade to no
      // rest-day bridging rather than breaking the whole streak query.
      const dates = (sessionsRes.data ?? []).map((s) => s.date)
      const restDays = restDaysRes.error ? [] : (restDaysRes.data ?? []).map((r) => r.date as string)
      const { current, best } = computeDayStreaks(dates, restDays)
      return { totalSessions: dates.length, currentStreak: current, bestStreak: best }
    },
  })
}
