import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useExerciseNote(exerciseId: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['exercise-note', user?.id, exerciseId],
    enabled: !!user && !!exerciseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_notes')
        .select('notes')
        .eq('exercise_id', exerciseId!)
        .maybeSingle()
      if (error) throw error
      return data?.notes ?? ''
    },
  })
}

export function useSetExerciseNote() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ exerciseId, notes }: { exerciseId: string; notes: string }) => {
      if (!user) throw new Error('Not signed in')
      const { error } = await supabase
        .from('exercise_notes')
        .upsert({ user_id: user.id, exercise_id: exerciseId, notes, updated_at: new Date().toISOString() }, { onConflict: 'user_id,exercise_id' })
      if (error) throw error
    },
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['exercise-note', user?.id, vars.exerciseId] }),
  })
}
