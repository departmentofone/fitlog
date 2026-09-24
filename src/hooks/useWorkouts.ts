import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatWeight } from '../lib/units'
import type { Exercise, UnitSystem, WorkoutSession, WorkoutSet } from '../types'
import { useAuth } from './useAuth'

/**
 * Today's date in the user's own timezone, as YYYY-MM-DD. Deliberately not toISOString(), which
 * converts to UTC first: east of UTC that reports yesterday shortly after local midnight (so the
 * date picker's max blocked "today"), and west of UTC it reports tomorrow all evening (so evening
 * logs landed on the wrong day).
 */
export function todayISO() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
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

/**
 * Saves the workout's note (one per session, like Strong's workout note - how it went, what changed).
 * An empty note is stored as null, which removes it.
 */
export function useSetSessionNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ sessionId, notes }: { sessionId: string; notes: string }) => {
      const trimmed = notes.trim()
      const { error } = await supabase
        .from('workout_sessions')
        .update({ notes: trimmed ? trimmed : null })
        .eq('id', sessionId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session'] })
      qc.invalidateQueries({ queryKey: ['session-detail'] })
    },
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
  /** Null when the exercise belongs to another user and RLS hides it (loaded from a shared preset). */
  exercise: Exercise | null
  /**
   * Groups this set with others sharing the same value within a session, for supersets/circuits
   * (migration_v18). Optional/nullable so it's a no-op until that migration runs and for every
   * set logged outside a superset.
   */
  superset_group?: number | null
}

/** Minimal shape needed to (re)insert a previously-logged set - used by restore/copy below. */
type StoredSet = {
  exercise_id: string
  set_number: number
  weight: number
  reps: number
  difficulty: number
  is_warmup: boolean
  superset_group?: number | null
}

/**
 * Builds an insert row for `workout_sets`, omitting `superset_group` entirely when the set isn't
 * part of one - so inserts keep working even before migration_v18 has added that column.
 */
function buildSetRow(s: StoredSet, sessionId: string) {
  const row: Record<string, unknown> = {
    session_id: sessionId,
    exercise_id: s.exercise_id,
    set_number: s.set_number,
    weight: s.weight,
    reps: s.reps,
    difficulty: s.difficulty,
    is_warmup: s.is_warmup,
  }
  if (s.superset_group != null) row.superset_group = s.superset_group
  return row
}

/**
 * Keeps an exercise's set numbers consecutive within a session (1, 2, 3...), so deleting set 1 turns
 * the old set 2 into set 1 everywhere. With `openSlot`, that number is left free and later sets move
 * up one - used by undo to put a deleted set back where it was.
 */
async function renumberExerciseSets(sessionId: string, exerciseId: string, openSlot?: number) {
  const { data, error } = await supabase
    .from('workout_sets')
    .select('id, set_number')
    .eq('session_id', sessionId)
    .eq('exercise_id', exerciseId)
    .order('set_number', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  let next = 1
  for (const row of (data ?? []) as { id: string; set_number: number }[]) {
    if (next === openSlot) next++
    if (row.set_number !== next) {
      const { error: updateError } = await supabase.from('workout_sets').update({ set_number: next }).eq('id', row.id)
      if (updateError) throw updateError
    }
    next++
  }
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
      supersetGroup,
      restore,
    }: {
      exerciseId: string
      setNumber: number
      weight: number
      reps: number
      difficulty: number
      isWarmup?: boolean
      /** Non-null to log this set as part of a superset/circuit group (see migration_v18). */
      supersetGroup?: number | null
      /** Undoing a delete: make room at `setNumber` so the set goes back into its old place. */
      restore?: boolean
    }) => {
      if (!sessionId) throw new Error('No active session')
      if (restore) await renumberExerciseSets(sessionId, exerciseId, setNumber)
      const row = buildSetRow(
        { exercise_id: exerciseId, set_number: setNumber, weight, reps, difficulty, is_warmup: isWarmup ?? false, superset_group: supersetGroup },
        sessionId,
      )
      const { error } = await supabase.from('workout_sets').insert(row)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sets', sessionId] })
      // PR detection and the 1RM chart read this; without it they compare against stale data.
      qc.invalidateQueries({ queryKey: ['exercise-history'] })
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sets', sessionId] })
      // PR detection and the 1RM chart read this; without it they compare against stale data.
      qc.invalidateQueries({ queryKey: ['exercise-history'] })
    },
  })
}

function invalidateAfterSessionChange(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['exercise-history'] })
  qc.invalidateQueries({ queryKey: ['weekly-volume'] })
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
      const { data: target, error: readError } = await supabase
        .from('workout_sets')
        .select('session_id, exercise_id')
        .eq('id', setId)
        .maybeSingle()
      if (readError) throw readError
      const { error } = await supabase.from('workout_sets').delete().eq('id', setId)
      if (error) throw error
      if (target) await renumberExerciseSets(target.session_id, target.exercise_id)
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
    mutationFn: async (snapshot: WorkoutSession & { workout_sets: StoredSet[] }) => {
      if (!user) throw new Error('Not signed in')
      const { data: created, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({ user_id: user.id, date: snapshot.date, preworkout: snapshot.preworkout, notes: snapshot.notes ?? null })
        .select()
        .single()
      if (sessionError) throw sessionError

      if (snapshot.workout_sets.length > 0) {
        const rows = snapshot.workout_sets.map((s) => buildSetRow(s, created.id))
        const { error: setsError } = await supabase.from('workout_sets').insert(rows)
        if (setsError) throw setsError
      }
    },
    onSuccess: () => invalidateAfterSessionChange(qc),
  })
}

export interface LastSessionSetSummary {
  weight: number
  reps: number
}

/**
 * Compacts a prior session's working sets into a short "Last time" string, e.g. "3×8 @ 60kg"
 * when all sets match, or "10 @ 40kg, 8 @ 50kg, 6 @ 60kg" for a pyramid/ramping scheme. Adjacent
 * sets with the same weight+reps are collapsed into one "N×reps" group. Returns '' for no sets.
 * Weights are stored in kg and shown in `unit` ("3×8 @ 135lb" for imperial).
 */
export function summarizeLastSets(sets: LastSessionSetSummary[], unit?: UnitSystem): string {
  if (sets.length === 0) return ''
  const groups: { weight: number; reps: number; count: number }[] = []
  for (const s of sets) {
    const last = groups[groups.length - 1]
    if (last && last.weight === s.weight && last.reps === s.reps) {
      last.count += 1
    } else {
      groups.push({ weight: s.weight, reps: s.reps, count: 1 })
    }
  }
  return groups
    .map((g) => {
      const weight = formatWeight(g.weight, unit, '')
      return g.count > 1 ? `${g.count}×${g.reps} @ ${weight}` : `${g.reps} @ ${weight}`
    })
    .join(', ')
}

/**
 * Assigns short display labels ("A", "B", "C"...) to distinct `superset_group` ids, in order of
 * first appearance among the given sets. `sets` is expected ordered by `created_at` ascending
 * (as `useSessionSets` already returns), so the first superset logged today reads as "A", etc.
 */
export function buildSupersetLabels(sets: { superset_group?: number | null }[]): Map<number, string> {
  const map = new Map<number, string>()
  for (const s of sets) {
    const group = s.superset_group
    if (group != null && !map.has(group)) {
      map.set(group, String.fromCharCode(65 + map.size))
    }
  }
  return map
}

/**
 * Most recent PRIOR session's working (non-warmup) sets for this exercise, for a "last time"
 * hint - excludes the session currently being logged into (not necessarily "today", since a
 * past date can be edited too) and reflects the whole session's sets, not just the last row.
 */
export function useLastSessionSetsForExercise(exerciseId: string | undefined, excludeSessionId: string | undefined) {
  return useQuery({
    queryKey: ['last-session-sets', exerciseId, excludeSessionId],
    enabled: !!exerciseId,
    queryFn: async (): Promise<LastSessionSetSummary[]> => {
      let latestQuery = supabase
        .from('workout_sets')
        .select('session_id')
        .eq('exercise_id', exerciseId!)
        .order('created_at', { ascending: false })
        .limit(1)
      if (excludeSessionId) latestQuery = latestQuery.neq('session_id', excludeSessionId)
      const { data: latest, error: latestError } = await latestQuery.maybeSingle()
      if (latestError) throw latestError
      if (!latest) return []

      const { data: rows, error } = await supabase
        .from('workout_sets')
        .select('set_number, weight, reps, is_warmup')
        .eq('session_id', latest.session_id)
        .eq('exercise_id', exerciseId!)
        .order('set_number', { ascending: true })
      if (error) throw error

      type Row = { set_number: number; weight: number; reps: number; is_warmup: boolean | null }
      return ((rows as Row[]) ?? [])
        .filter((r) => !r.is_warmup)
        .map((r) => ({ weight: r.weight, reps: r.reps }))
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
        .eq('is_warmup', false)
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
        .order('created_at', { ascending: true })
        .limit(1)
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

      // Superset group ids are only unique within a session, so when copying into a day that
      // already has sets of its own, renumber the copied groups above whatever's already there
      // instead of reusing the raw source ids (which could collide with unrelated groups).
      // superset_group may not exist yet (pre migration_v18) - degrade to "no groups" rather than
      // failing the whole copy.
      let targetMaxGroup = 0
      const { data: targetSets, error: targetSetsError } = await supabase
        .from('workout_sets')
        .select('superset_group')
        .eq('session_id', toSessionId)
      if (!targetSetsError) {
        for (const row of (targetSets ?? []) as { superset_group?: number | null }[]) {
          if (row.superset_group != null) targetMaxGroup = Math.max(targetMaxGroup, row.superset_group)
        }
      }

      const groupRemap = new Map<number, number>()
      let nextGroup = targetMaxGroup
      const rows = (fromSession.workout_sets as StoredSet[]).map((s) => {
        let supersetGroup: number | undefined
        if (s.superset_group != null) {
          let remapped = groupRemap.get(s.superset_group)
          if (remapped === undefined) {
            nextGroup += 1
            remapped = nextGroup
            groupRemap.set(s.superset_group, remapped)
          }
          supersetGroup = remapped
        }
        return buildSetRow({ ...s, superset_group: supersetGroup }, toSessionId as string)
      })
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
