import { useQuery } from '@tanstack/react-query'
import type { SetForAchievements } from '../lib/achievements'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useDietStreak } from './useDiet'
import { useUserSettings } from './useUserSettings'
import { useSessionDates } from './useWorkouts'
import { useWorkoutStreaks } from './useWorkoutStreaks'

function useAllSetsForAchievements() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['achievement-sets', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<SetForAchievements[]> => {
      const { data, error } = await supabase
        .from('workout_sets')
        .select('exercise_id, weight, reps, is_warmup, created_at, exercise:exercises(name)')
        .order('created_at', { ascending: true })
      if (error) throw error
      type Row = { exercise_id: string; weight: number; reps: number; is_warmup: boolean; created_at: string; exercise: { name: string } | null }
      return ((data as unknown as Row[]) ?? []).map((r) => ({
        exercise_id: r.exercise_id,
        exercise_name: r.exercise?.name ?? '',
        weight: r.weight,
        reps: r.reps,
        is_warmup: r.is_warmup,
        created_at: r.created_at,
      }))
    },
  })
}

/**
 * Fasts that reached their target length. (The old count used "any ended fast" from a list capped
 * at 10, so a fast stopped after a minute counted, and nothing past 10 ever did.)
 */
function useCompletedFastCount() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['fast-history', user?.id, 'completed-count'],
    enabled: !!user,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from('fasting_sessions')
        .select('start_time, end_time, target_hours')
        .not('end_time', 'is', null)
      if (error) throw error
      return (data ?? []).filter(
        (f) => new Date(f.end_time as string).getTime() - new Date(f.start_time).getTime() >= f.target_hours * 3_600_000,
      ).length
    },
  })
}

/** Everything the Awards screen and the unlock celebrations need, from data already tracked elsewhere. */
export function useAchievementsData() {
  const { data: settings } = useUserSettings()
  const allSets = useAllSetsForAchievements()
  const workoutStreaks = useWorkoutStreaks()
  const dietStreak = useDietStreak(settings?.calorie_goal ?? null, settings?.diet_goal ?? 'deficit')
  const completedFasts = useCompletedFastCount()
  const sessionDates = useSessionDates()

  return {
    isLoading: allSets.isLoading || workoutStreaks.isLoading || completedFasts.isLoading || sessionDates.isLoading,
    sets: allSets.data ?? [],
    sessionDates: sessionDates.data ?? [],
    currentWeightKg: settings?.current_weight ?? null,
    totalWorkouts: workoutStreaks.data?.totalSessions ?? 0,
    bestWorkoutStreak: workoutStreaks.data?.bestStreak ?? 0,
    bestDietStreak: dietStreak.data?.best ?? 0,
    completedFasts: completedFasts.data ?? 0,
  }
}
