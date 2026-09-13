import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
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

/** Creates today's session (if missing) or updates its preworkout flag. Used from Settings. */
export function useSetPreworkout() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ sessionId, preworkout }: { sessionId?: string | null; preworkout: boolean }) => {
      if (!user) throw new Error('Not signed in')
      if (sessionId) {
        const { error } = await supabase.from('workout_sessions').update({ preworkout }).eq('id', sessionId)
        if (error) throw error
        return
      }
      const { error } = await supabase
        .from('workout_sessions')
        .insert({ user_id: user.id, date: todayISO(), preworkout })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session', user?.id] }),
  })
}

/** Auto-creates today's session (silently, no preworkout prompt) once settings say not to ask. */
export function useAutoStartSession(shouldAutoStart: boolean) {
  const { user } = useAuth()
  const { data: session, isLoading } = useTodaySession()
  const startSession = useStartSession()

  useEffect(() => {
    if (shouldAutoStart && !isLoading && !session && user && !startSession.isPending) {
      startSession.mutate({ preworkout: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoStart, isLoading, session, user])

  return { session, isLoading: isLoading || (shouldAutoStart && !session) }
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
