import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Exercise, MuscleGroup } from '../types'
import { useAuth } from './useAuth'

export function useExercises() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['exercises', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data as Exercise[]
    },
  })
}

export function useCreateExercise() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, muscleGroup }: { name: string; muscleGroup: MuscleGroup }) => {
      if (!user) throw new Error('Not signed in')
      const { data, error } = await supabase
        .from('exercises')
        .insert({ name, muscle_group: muscleGroup, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data as Exercise
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercises', user?.id] })
    },
  })
}
