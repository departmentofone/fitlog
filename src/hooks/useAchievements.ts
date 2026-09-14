import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { SetForAchievements } from '../lib/achievements'
import { useAuth } from './useAuth'
import { useDietStreak } from './useDiet'
import { useFastHistory } from './useFasting'
import { useGoals } from './useGoals'
import { useMealPresets } from './useMealPresets'
import { usePresets } from './usePresets'
import { useRecipes } from './useRecipes'
import { useUserSettings } from './useUserSettings'
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

/** Pulls together everything the Achievements tab needs, from data already tracked elsewhere. */
export function useAchievementsData() {
  const { data: settings } = useUserSettings()
  const allSets = useAllSetsForAchievements()
  const workoutStreaks = useWorkoutStreaks()
  const dietStreak = useDietStreak(settings?.calorie_goal ?? null, settings?.diet_goal ?? 'deficit')
  const recipes = useRecipes()
  const fasts = useFastHistory()
  const workoutPresets = usePresets()
  const mealPresets = useMealPresets()
  const goals = useGoals()

  const isLoading =
    allSets.isLoading || workoutStreaks.isLoading || recipes.isLoading || fasts.isLoading || workoutPresets.isLoading || mealPresets.isLoading || goals.isLoading

  return {
    isLoading,
    sets: allSets.data ?? [],
    currentWeightKg: settings?.current_weight ?? null,
    bestWorkoutStreak: workoutStreaks.data?.bestStreak ?? 0,
    bestDietStreak: dietStreak.data?.best ?? 0,
    recipeCount: recipes.data?.length ?? 0,
    completedFastCount: fasts.data?.length ?? 0,
    presetCount: (workoutPresets.data?.length ?? 0) + (mealPresets.data?.length ?? 0),
    completedGoalCount: (goals.data ?? []).filter((g) => g.completed).length,
  }
}
