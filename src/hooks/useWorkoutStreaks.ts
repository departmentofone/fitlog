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
      const { data, error } = await supabase.from('workout_sessions').select('date, workout_sets!inner(id)')
      if (error) throw error
      const dates = (data ?? []).map((s) => s.date)
      const { current, best } = computeDayStreaks(dates)
      return { totalSessions: dates.length, currentStreak: current, bestStreak: best }
    },
  })
}
