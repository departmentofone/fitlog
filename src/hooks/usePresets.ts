import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Exercise, PlannedSet, WorkoutPreset, WorkoutPresetItem } from '../types'
import { useAuth } from './useAuth'
import type { SetWithExercise } from './useWorkouts'

export interface PresetItemWithExercise extends WorkoutPresetItem {
  /** Null when the exercise belongs to another user and RLS hides it (shared preset). */
  exercise: Exercise | null
}

export interface PresetWithItems extends WorkoutPreset {
  workout_preset_items: PresetItemWithExercise[]
}

export function usePresets() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['presets', user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Only your own - shared and official items are browsed in the Community tab (see useMealPresets).
      const { data, error } = await supabase
        .from('workout_presets')
        .select('*, workout_preset_items(*, exercise:exercises(*))')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as unknown as PresetWithItems[]).filter((p) => !p.is_official)
    },
  })
}

export function useCreatePresetFromSets() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, sets }: { name: string; sets: SetWithExercise[] }) => {
      if (!user) throw new Error('Not signed in')
      const { data: preset, error: presetError } = await supabase
        .from('workout_presets')
        .insert({ user_id: user.id, name })
        .select()
        .single()
      if (presetError) throw presetError

      const items = sets.map((s) => ({
        preset_id: preset.id,
        exercise_id: s.exercise_id,
        set_number: s.set_number,
        weight: s.weight,
        reps: s.reps,
        is_warmup: s.is_warmup,
      }))
      const { error: itemsError } = await supabase.from('workout_preset_items').insert(items)
      if (itemsError) throw itemsError

      return preset as WorkoutPreset
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['presets', user?.id] }),
  })
}

export function useSetPresetShared() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ presetId, isShared }: { presetId: string; isShared: boolean }) => {
      const { error } = await supabase.from('workout_presets').update({ is_shared: isShared }).eq('id', presetId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presets', user?.id] })
      qc.invalidateQueries({ queryKey: ['community'] })
    },
  })
}

export function useDeletePreset() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (presetId: string) => {
      const { error } = await supabase.from('workout_presets').delete().eq('id', presetId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['presets', user?.id] }),
  })
}

/** Recreates a deleted preset from its last-known snapshot, for the undo toast. */
export function useRestorePreset() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (preset: PresetWithItems) => {
      if (!user) throw new Error('Not signed in')
      const { data: created, error: presetError } = await supabase
        .from('workout_presets')
        .insert({ user_id: user.id, name: preset.name, is_shared: preset.is_shared })
        .select()
        .single()
      if (presetError) throw presetError

      const items = preset.workout_preset_items.map((i) => ({
        preset_id: created.id,
        exercise_id: i.exercise_id,
        set_number: i.set_number,
        weight: i.weight,
        reps: i.reps,
      }))
      if (items.length > 0) {
        const { error: itemsError } = await supabase.from('workout_preset_items').insert(items)
        if (itemsError) throw itemsError
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['presets', user?.id] }),
  })
}

/**
 * Starts a preset: its sets become the session's plan, ticked off one by one in the set form
 * (migration_v36). Before that migration runs, falls back to logging them all at once as done.
 */
export function useLoadPreset(sessionId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (preset: PresetWithItems) => {
      if (!sessionId) throw new Error('No active session')

      const planned = await plannedFromPreset(preset)
      const { data: current, error: planError } = await supabase.from('workout_sessions').select('plan').eq('id', sessionId).single()
      if (!planError) {
        const existing = ((current as { plan: PlannedSet[] | null }).plan ?? []) as PlannedSet[]
        const { error } = await supabase.from('workout_sessions').update({ plan: [...existing, ...planned] }).eq('id', sessionId)
        if (error) throw error
        return
      }

      const { data: existing, error: existingError } = await supabase
        .from('workout_sets')
        .select('exercise_id, set_number')
        .eq('session_id', sessionId)
      if (existingError) throw existingError

      const countByExercise = new Map<string, number>()
      for (const row of existing ?? []) {
        countByExercise.set(row.exercise_id, (countByExercise.get(row.exercise_id) ?? 0) + 1)
      }

      // Templates (the official workouts, a program someone shared) leave weights at 0, since they
      // can't know what you lift. Those sets start from the weight you last logged for the exercise.
      const lastWeight = new Map<string, number>()
      const blankIds = [...new Set(preset.workout_preset_items.filter((i) => !i.weight).map((i) => i.exercise_id))]
      if (blankIds.length > 0) {
        const { data: recent, error: recentError } = await supabase
          .from('workout_sets')
          .select('exercise_id, weight')
          .in('exercise_id', blankIds)
          .eq('is_warmup', false)
          .gt('weight', 0)
          .order('created_at', { ascending: false })
          .limit(300)
        if (recentError) throw recentError
        for (const r of recent ?? []) if (!lastWeight.has(r.exercise_id)) lastWeight.set(r.exercise_id, r.weight)
      }

      const rows = preset.workout_preset_items.map((item) => {
        const offset = countByExercise.get(item.exercise_id) ?? 0
        countByExercise.set(item.exercise_id, offset + 1)
        return {
          session_id: sessionId,
          exercise_id: item.exercise_id,
          set_number: offset + 1,
          weight: item.weight || (item.is_warmup ? 0 : (lastWeight.get(item.exercise_id) ?? 0)),
          reps: item.reps,
          is_warmup: item.is_warmup ?? false,
          difficulty: 6,
        }
      })

      const { error } = await supabase.from('workout_sets').insert(rows)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sets', sessionId] })
      qc.invalidateQueries({ queryKey: ['session'] })
    },
  })
}

/**
 * A preset's items as planned sets. Templates (the official workouts, a shared program) leave
 * weights at 0 since they can't know what you lift, so those start from the weight you last logged.
 */
async function plannedFromPreset(preset: PresetWithItems): Promise<PlannedSet[]> {
  const lastWeight = new Map<string, number>()
  const blankIds = [...new Set(preset.workout_preset_items.filter((i) => !i.weight).map((i) => i.exercise_id))]
  if (blankIds.length > 0) {
    const { data: recent } = await supabase
      .from('workout_sets')
      .select('exercise_id, weight')
      .in('exercise_id', blankIds)
      .eq('is_warmup', false)
      .gt('weight', 0)
      .order('created_at', { ascending: false })
      .limit(300)
    for (const r of recent ?? []) if (!lastWeight.has(r.exercise_id)) lastWeight.set(r.exercise_id, r.weight)
  }
  return [...preset.workout_preset_items]
    .sort((a, b) => a.set_number - b.set_number)
    .sort((a, b) => preset.workout_preset_items.findIndex((x) => x.exercise_id === a.exercise_id) - preset.workout_preset_items.findIndex((x) => x.exercise_id === b.exercise_id))
    .map((item) => ({
      exerciseId: item.exercise_id,
      exerciseName: item.exercise?.name ?? 'Exercise',
      muscleGroup: item.exercise?.muscle_group ?? 'cardio',
      weight: item.weight || (item.is_warmup ? 0 : (lastWeight.get(item.exercise_id) ?? 0)),
      reps: item.reps,
      isWarmup: item.is_warmup ?? false,
    }))
}
