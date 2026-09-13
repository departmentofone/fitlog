import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Exercise, WorkoutSession, WorkoutSet } from '../types'
import { useAuth } from './useAuth'

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function useTodaySession() {
  const { user } = useAuth()
  const date = todayISO()
  return useQuery({
    queryKey: ['session', user?.id, date],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('date', date)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as WorkoutSession | null
    },
  })
}

export function useStartSession() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ preworkout }: { preworkout: boolean }) => {
      if (!user) throw new Error('Not signed in')
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({ user_id: user.id, date: todayISO(), preworkout })
        .select()
        .single()
      if (error) throw error
      return data as WorkoutSession
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session', user?.id] }),
  })
}

export function useTogglePreworkout() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ sessionId, preworkout }: { sessionId: string; preworkout: boolean }) => {
      const { error } = await supabase.from('workout_sessions').update({ preworkout }).eq('id', sessionId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session', user?.id] }),
  })
}

export interface SetWithExercise extends WorkoutSet {
  exercise: Exercise
}

export function useSessionSets(sessionId: string | null | undefined) {
  return useQuery({
    queryKey: ['sets', sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sets')
        .select('*, exercise:exercises(*)')
        .eq('session_id', sessionId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as unknown as SetWithExercise[]
    },
  })
}

export function useAddSet(sessionId: string | null | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      exerciseId,
      setNumber,
      weight,
      reps,
      difficulty,
    }: {
      exerciseId: string
      setNumber: number
      weight: number
      reps: number
      difficulty: number
    }) => {
      if (!sessionId) throw new Error('No active session')
      const { error } = await supabase.from('workout_sets').insert({
        session_id: sessionId,
        exercise_id: exerciseId,
        set_number: setNumber,
        weight,
        reps,
        difficulty,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sets', sessionId] }),
  })
}

export function useDeleteSet(sessionId: string | null | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (setId: string) => {
      const { error } = await supabase.from('workout_sets').delete().eq('id', setId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sets', sessionId] }),
  })
}

export function useSessionHistory() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['session-history', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*, workout_sets(*, exercise:exercises(*))')
        .order('date', { ascending: false })
        .limit(30)
      if (error) throw error
      return data as unknown as (WorkoutSession & { workout_sets: SetWithExercise[] })[]
    },
  })
}
