import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Exercise, WorkoutSession, WorkoutSet } from '../types'
import { useAuth } from './useAuth'

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function useSessionForDate(date: string) {
  const { user } = useAuth()
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

export function useTodaySession() {
  return useSessionForDate(todayISO())
}

export function useStartSession() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ preworkout, date }: { preworkout: boolean; date?: string }) => {
      if (!user) throw new Error('Not signed in')
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({ user_id: user.id, date: date ?? todayISO(), preworkout })
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

/**
 * Auto-creates a session for `date` (silently, no preworkout prompt) once `shouldAutoStart`
 * is true — either because settings say not to ask, or because the date isn't today (the
 * preworkout gate only makes sense for "today").
 */
export function useAutoStartSession(date: string, shouldAutoStart: boolean) {
  const { user } = useAuth()
  const { data: session, isLoading } = useSessionForDate(date)
  const startSession = useStartSession()

  useEffect(() => {
    if (shouldAutoStart && !isLoading && !session && user && !startSession.isPending) {
      startSession.mutate({ preworkout: false, date })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoStart, isLoading, session, user, date])

  return { session, isLoading: isLoading || (shouldAutoStart && !session) }
}

export function useStartWorkoutTimer(sessionId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error('No active session')
      const { error } = await supabase
        .from('workout_sessions')
        .update({ started_at: new Date().toISOString(), duration_seconds: null })
        .eq('id', sessionId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session'] }),
  })
}

export function useStopWorkoutTimer(sessionId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (startedAt: string) => {
      if (!sessionId) throw new Error('No active session')
      const durationSeconds = Math.round((Date.now() - new Date(startedAt).getTime()) / 1000)
      const { error } = await supabase
        .from('workout_sessions')
        .update({ started_at: null, duration_seconds: durationSeconds })
        .eq('id', sessionId)
      if (error) throw error
      return durationSeconds
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session'] }),
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
      isWarmup,
    }: {
      exerciseId: string
      setNumber: number
      weight: number
      reps: number
      difficulty: number
      isWarmup?: boolean
    }) => {
      if (!sessionId) throw new Error('No active session')
      const { error } = await supabase.from('workout_sets').insert({
        session_id: sessionId,
        exercise_id: exerciseId,
        set_number: setNumber,
        weight,
        reps,
        is_warmup: isWarmup ?? false,
        difficulty,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sets', sessionId] }),
  })
}

export function useUpdateSet(sessionId: string | null | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      setId,
      weight,
      reps,
      difficulty,
    }: {
      setId: string
      weight: number
      reps: number
      difficulty: number
    }) => {
      const { error } = await supabase.from('workout_sets').update({ weight, reps, difficulty }).eq('id', setId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sets', sessionId] }),
  })
}

function invalidateAfterSessionChange(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['session'] })
  qc.invalidateQueries({ queryKey: ['sets'] })
  qc.invalidateQueries({ queryKey: ['session-dates'] })
  qc.invalidateQueries({ queryKey: ['session-detail'] })
  qc.invalidateQueries({ queryKey: ['session-history'] })
}

export function useDeleteSet(_sessionId: string | null | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (setId: string) => {
      const { error } = await supabase.from('workout_sets').delete().eq('id', setId)
      if (error) throw error
    },
    // A set can be deleted from views keyed by session id (`['sets', id]`) or by date
    // (History's `session-detail`/`session-dates`) - invalidate both broadly rather than
    // threading the right key through every call site.
    onSuccess: () => invalidateAfterSessionChange(qc),
  })
}

/** Deletes an entire session; workout_sets cascade-delete with it (FK ON DELETE CASCADE). */
export function useDeleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from('workout_sessions').delete().eq('id', sessionId)
      if (error) throw error
    },
    onSuccess: () => invalidateAfterSessionChange(qc),
  })
}

/** Recreates a session + its sets from a snapshot — used to undo a whole-workout delete. */
export function useRestoreSession() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (snapshot: WorkoutSession & { workout_sets: WorkoutSet[] }) => {
      if (!user) throw new Error('Not signed in')
      const { data: created, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({ user_id: user.id, date: snapshot.date, preworkout: snapshot.preworkout })
        .select()
        .single()
      if (sessionError) throw sessionError

      if (snapshot.workout_sets.length > 0) {
        const rows = snapshot.workout_sets.map((s) => ({
          session_id: created.id,
          exercise_id: s.exercise_id,
          set_number: s.set_number,
          weight: s.weight,
          reps: s.reps,
          difficulty: s.difficulty,
          is_warmup: s.is_warmup,
        }))
        const { error: setsError } = await supabase.from('workout_sets').insert(rows)
        if (setsError) throw setsError
      }
    },
    onSuccess: () => invalidateAfterSessionChange(qc),
  })
}

/** Most recent previously-logged set for this exercise (from an earlier session), for a "last time" hint. */
export function useLastSetForExercise(exerciseId: string | undefined, excludeSessionId: string | undefined) {
  return useQuery({
    queryKey: ['last-set', exerciseId, excludeSessionId],
    enabled: !!exerciseId,
    queryFn: async () => {
      let query = supabase
        .from('workout_sets')
        .select('weight, reps, difficulty, created_at')
        .eq('exercise_id', exerciseId!)
        .order('created_at', { ascending: false })
        .limit(1)
      if (excludeSessionId) query = query.neq('session_id', excludeSessionId)
      const { data, error } = await query.maybeSingle()
      if (error) throw error
      return data as { weight: number; reps: number; difficulty: number; created_at: string } | null
    },
  })
}

/** All session dates (cheap query) for marking a calendar with ticks. */
export function useSessionDates() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['session-dates', user?.id],
    enabled: !!user,
    queryFn: async () => {
      // !inner excludes sessions with no logged sets (e.g. auto-created just by viewing a date).
      const { data, error } = await supabase.from('workout_sessions').select('date, workout_sets!inner(id)')
      if (error) throw error
      return (data ?? []).map((s) => s.date)
    },
  })
}

export function useSessionDetailForDate(date: string | null) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['session-detail', user?.id, date],
    enabled: !!user && !!date,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*, workout_sets(*, exercise:exercises(*))')
        .eq('date', date!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as unknown as (WorkoutSession & { workout_sets: SetWithExercise[] }) | null
    },
  })
}

export interface ExerciseHistoryPoint {
  date: string
  weight: number
  reps: number
  is_warmup: boolean
}

/** All non-warmup sets ever logged for an exercise, with the session date — for PRs, 1RM, and progress charts. */
export function useExerciseHistory(exerciseId: string | undefined) {
  return useQuery({
    queryKey: ['exercise-history', exerciseId],
    enabled: !!exerciseId,
    queryFn: async (): Promise<ExerciseHistoryPoint[]> => {
      const { data, error } = await supabase
        .from('workout_sets')
        .select('weight, reps, is_warmup, session:workout_sessions!inner(date)')
        .eq('exercise_id', exerciseId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      type Row = { weight: number; reps: number; is_warmup: boolean | null; session: { date: string } }
      return ((data as unknown as Row[]) ?? []).map((r) => ({
        date: r.session.date,
        weight: r.weight,
        reps: r.reps,
        is_warmup: r.is_warmup ?? false,
      }))
    },
  })
}

export interface MuscleVolume {
  muscleGroup: string
  volume: number
}

/** Total volume (weight x reps) per muscle group over the last N days. */
export function useWeeklyVolumeByMuscleGroup(days = 7) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['weekly-volume', user?.id, days],
    enabled: !!user,
    queryFn: async (): Promise<MuscleVolume[]> => {
      const start = new Date()
      start.setDate(start.getDate() - (days - 1))
      const startISO = start.toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('workout_sets')
        .select('weight, reps, exercise:exercises(muscle_group), session:workout_sessions!inner(date)')
        .gte('session.date', startISO)
      if (error) throw error

      type Row = { weight: number; reps: number; exercise: { muscle_group: string } | null }
      const totals = new Map<string, number>()
      for (const row of (data as unknown as Row[]) ?? []) {
        const group = row.exercise?.muscle_group ?? 'other'
        totals.set(group, (totals.get(group) ?? 0) + row.weight * row.reps)
      }
      return Array.from(totals.entries()).map(([muscleGroup, volume]) => ({ muscleGroup, volume }))
    },
  })
}

export function useCopyWorkoutDay() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ fromDate, toDate }: { fromDate: string; toDate: string }) => {
      if (!user) throw new Error('Not signed in')
      const { data: fromSession, error: fromError } = await supabase
        .from('workout_sessions')
        .select('*, workout_sets(*)')
        .eq('date', fromDate)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (fromError) throw fromError
      if (!fromSession || fromSession.workout_sets.length === 0) return

      const { data: existingTo, error: toError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('date', toDate)
        .maybeSingle()
      if (toError) throw toError

      let toSessionId = existingTo?.id
      if (!toSessionId) {
        const { data: created, error: createError } = await supabase
          .from('workout_sessions')
          .insert({ user_id: user.id, date: toDate, preworkout: false })
          .select()
          .single()
        if (createError) throw createError
        toSessionId = created.id
      }

      const rows = (fromSession.workout_sets as WorkoutSet[]).map((s) => ({
        session_id: toSessionId,
        exercise_id: s.exercise_id,
        set_number: s.set_number,
        weight: s.weight,
        reps: s.reps,
        difficulty: s.difficulty,
        is_warmup: s.is_warmup,
      }))
      const { error: insertError } = await supabase.from('workout_sets').insert(rows)
      if (insertError) throw insertError
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sets'] })
      qc.invalidateQueries({ queryKey: ['session'] })
      qc.invalidateQueries({ queryKey: ['session-dates'] })
    },
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
