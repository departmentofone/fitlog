import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Exercise, WorkoutPreset, WorkoutPresetItem } from '../types'
import { useAuth } from './useAuth'
import type { SetWithExercise } from './useWorkouts'

export interface PresetItemWithExercise extends WorkoutPresetItem {
  exercise: Exercise
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
      const { data, error } = await supabase
        .from('workout_presets')
        .select('*, workout_preset_items(*, exercise:exercises(*))')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as PresetWithItems[]
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['presets', user?.id] }),
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

/** Loads a preset's items into a session as real logged sets, continuing set numbering per exercise. */
export function useLoadPreset(sessionId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (preset: PresetWithItems) => {
      if (!sessionId) throw new Error('No active session')

      const { data: existing, error: existingError } = await supabase
        .from('workout_sets')
        .select('exercise_id, set_number')
        .eq('session_id', sessionId)
      if (existingError) throw existingError

      const countByExercise = new Map<string, number>()
      for (const row of existing ?? []) {
        countByExercise.set(row.exercise_id, (countByExercise.get(row.exercise_id) ?? 0) + 1)
      }

      const rows = preset.workout_preset_items.map((item) => {
        const offset = countByExercise.get(item.exercise_id) ?? 0
        countByExercise.set(item.exercise_id, offset + 1)
        return {
          session_id: sessionId,
          exercise_id: item.exercise_id,
          set_number: offset + 1,
          weight: item.weight,
          reps: item.reps,
          difficulty: 6,
        }
      })

      const { error } = await supabase.from('workout_sets').insert(rows)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sets', sessionId] }),
  })
}
