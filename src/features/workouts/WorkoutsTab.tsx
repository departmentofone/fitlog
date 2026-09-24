import { useEffect, useMemo, useState } from 'react'
import { CopyDayButton } from '../../components/CopyDayButton'
import { DateNav } from '../../components/DateNav'
import { FireStreak } from '../../components/FireStreak'
import { useToast } from '../../components/ToastProvider'
import { SkeletonCard } from '../../components/Skeleton'
import { haptics } from '../../lib/haptics'
import { useDeleteRestDay, useLogRestDay, useRestDays } from '../../hooks/useRestDays'
import { useUserSettings } from '../../hooks/useUserSettings'
import { useWorkoutStreaks } from '../../hooks/useWorkoutStreaks'
import {
  buildSupersetLabels,
  todayISO,
  useAddSet,
  useAutoStartSession,
  useCopyWorkoutDay,
  useDeleteSession,
  useDeleteSet,
  useExerciseHistory,
  useRestoreSession,
  type SetWithExercise,
  useSessionSets,
  useSetPreworkout,
  useStartSession,
  useUpdateSet,
} from '../../hooks/useWorkouts'
import { estimate1RM } from '../../lib/oneRepMax'
import { toDisplayTotal, weightUnitLabel } from '../../lib/units'
import type { Exercise, MuscleGroup } from '../../types'
import { ExerciseDetailModal } from './ExerciseDetailModal'
import { ExercisePicker } from './ExercisePicker'
import { ExerciseSummaryBox } from './ExerciseSummaryBox'
import { PresetsView } from './PresetsView'
import { PreworkoutGate } from './PreworkoutGate'
import { RestDayCard } from './RestDayCard'
import { SessionTimer } from './SessionTimer'
import { SessionNote } from './SessionNote'
import { SetForm } from './SetForm'
import { WeeklyVolumeCard } from './WeeklyVolumeCard'

/** An active superset in progress: the group id its sets are (or will be) tagged with, and the
 * ordered set of exercises in it (2-4). */
interface ActiveSuperset {
  groupId: number
  exercises: Exercise[]
}

/**
 * True once logging this set would bring every exercise in the group up to the same number of
 * logged sets - i.e. a full round of the superset/circuit just completed. This is the trigger for
 * (re)starting the real rest timer; individual sets within a round intentionally don't trigger it,
 * since the point of a superset is minimal rest moving between its exercises.
 */
function isFinalMemberOfRound(
  sets: SetWithExercise[],
  exerciseId: string,
  groupId: number,
  groupExercises: Exercise[],
): boolean {
  const counts = groupExercises.map((ex) => {
    const count = sets.filter((s) => s.exercise_id === ex.id && s.superset_group === groupId).length
    return ex.id === exerciseId ? count + 1 : count
  })
  return counts.every((c) => c === counts[0])
}

export function WorkoutsTab({
  onOpenHistory,
  quickAction,
}: {
  onOpenHistory: () => void
  /** Changes when the quick-add "Log a set" action fires - opens today's exercise picker. */
  quickAction?: number
}) {
  const { data: settings } = useUserSettings()
  const askPreworkout = settings?.ask_preworkout ?? false

  const [date, setDate] = useState(todayISO())
  const isToday = date === todayISO()

  const { session, isLoading: sessionLoading } = useAutoStartSession(date, !askPreworkout || !isToday)
  const startSession = useStartSession()
  const setPreworkout = useSetPreworkout()
  const { data: sets = [] } = useSessionSets(session?.id)
  const addSet = useAddSet(session?.id)
  const updateSet = useUpdateSet(session?.id)
  const deleteSet = useDeleteSet(session?.id)
  const deleteSession = useDeleteSession()
  const restoreSession = useRestoreSession()
  const { data: streaks } = useWorkoutStreaks()
  const { undoable, show } = useToast()
  const copyDay = useCopyWorkoutDay()
  const { data: restDays = [] } = useRestDays()
  const logRestDay = useLogRestDay()
  const deleteRestDay = useDeleteRestDay()
  const restDayLogged = restDays.includes(date)

  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)
  const [activeSuperset, setActiveSuperset] = useState<ActiveSuperset | null>(null)
  const [picking, setPicking] = useState(false)
  const [pickerMode, setPickerMode] = useState<'solo' | 'superset'>('solo')
  const [appendPicking, setAppendPicking] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [restTrigger, setRestTrigger] = useState(0)
  const { data: activeExerciseHistory = [] } = useExerciseHistory(activeExercise?.id)
  const [pendingPick, setPendingPick] = useState(false)

  useEffect(() => {
    if (quickAction == null) return
    setDate(todayISO())
    setShowPresets(false)
    setActiveExercise(null)
    setActiveSuperset(null)
    setAppendPicking(false)
    setPendingPick(true)
  }, [quickAction])

  // Opens the picker as soon as today's session exists - immediately if it already does, or right
  // after the preworkout question is answered if it doesn't yet.
  useEffect(() => {
    if (!pendingPick || !session || !isToday) return
    setPickerMode('solo')
    setPicking(true)
    setPendingPick(false)
  }, [pendingPick, session, isToday])

  const groupedByExercise = useMemo(() => {
    const map = new Map<string, (typeof sets)[number][]>()
    for (const s of sets) {
      map.set(s.exercise_id, [...(map.get(s.exercise_id) ?? []), s])
    }
    return map
  }, [sets])

  // Working sets per muscle today - drives the body-map heatmap (warm-ups don't count as training).
  const setsPerMuscle = useMemo(() => {
    const counts: Partial<Record<MuscleGroup, number>> = {}
    for (const s of sets) {
      if (!s.exercise || s.is_warmup) continue
      counts[s.exercise.muscle_group] = (counts[s.exercise.muscle_group] ?? 0) + 1
    }
    return counts
  }, [sets])

  // Distinct superset groups logged today, labeled "A", "B", ... in the order they first appear.
  const supersetLabels = useMemo(() => buildSupersetLabels(sets), [sets])
  function labelForGroup(groupId: number): string {
    return supersetLabels.get(groupId) ?? String.fromCharCode(65 + supersetLabels.size)
  }

  // Fresh group id for a brand-new superset - one higher than any group already logged today.
  const nextSupersetGroupId = useMemo(() => {
    let max = 0
    for (const s of sets) {
      if (s.superset_group != null) max = Math.max(max, s.superset_group)
    }
    return max + 1
  }, [sets])

  /**
   * Makes `exercise` the active one to log sets for. If it already has logged sets that belong to
   * a superset, restores the whole group (so reopening a grouped exercise - e.g. after tapping
   * Done, or on a fresh page load - brings back its siblings too, not just a bare solo view).
   */
  function resumeExercise(exercise: Exercise) {
    const exerciseSets = groupedByExercise.get(exercise.id) ?? []
    const groupId = exerciseSets.find((s) => s.superset_group != null)?.superset_group
    if (groupId == null) {
      setActiveSuperset(null)
      setActiveExercise(exercise)
      return
    }
    const memberIds = new Set(sets.filter((s) => s.superset_group === groupId).map((s) => s.exercise_id))
    const members: Exercise[] = []
    for (const id of memberIds) {
      const ex = sets.find((s) => s.exercise_id === id)?.exercise
      if (ex) members.push(ex)
    }
    // Keep the clicked exercise first so the pill row/order feels stable and predictable.
    members.sort((a, b) => (a.id === exercise.id ? -1 : b.id === exercise.id ? 1 : 0))
    setActiveSuperset({ groupId, exercises: members })
    setActiveExercise(exercise)
  }

  function handleAddSet(input: { weight: number; reps: number; difficulty: number; isWarmup: boolean }) {
    if (!activeExercise) return
    const exercise = activeExercise
    const group = activeSuperset

    const priorBest = activeExerciseHistory
      .filter((h) => !h.is_warmup)
      .reduce((max, h) => Math.max(max, estimate1RM(h.weight, h.reps)), 0)
    const newOneRm = estimate1RM(input.weight, input.reps)
    const isPr = !input.isWarmup && priorBest > 0 && newOneRm > priorBest

    if (isPr) {
      haptics.pr()
      show(`New PR on ${exercise.name}!`, { duration: 4000 })
    } else {
      haptics.tap()
    }

    addSet.mutate(
      {
        exerciseId: exercise.id,
        setNumber: (groupedByExercise.get(exercise.id)?.length ?? 0) + 1,
        supersetGroup: group?.groupId,
        ...input,
      },
      {
        onSuccess: () => {
          // Outside a superset, every set restarts the rest timer as before. Inside one, only
          // finishing a full round does - individual sets between grouped exercises shouldn't
          // trigger the normal between-set rest.
          const shouldRest = !group || isFinalMemberOfRound(sets, exercise.id, group.groupId, group.exercises)
          if (shouldRest) setRestTrigger((t) => t + 1)
        },
      },
    )
  }

  function handleDeleteSet(id: string) {
    const target = sets.find((s) => s.id === id)
    if (!target) {
      deleteSet.mutate(id)
      return
    }
    undoable(
      `Removed set ${target.set_number}`,
      () => deleteSet.mutate(id),
      () =>
        addSet.mutate({
          exerciseId: target.exercise_id,
          setNumber: target.set_number,
          weight: target.weight,
          reps: target.reps,
          difficulty: target.difficulty,
          isWarmup: target.is_warmup,
          supersetGroup: target.superset_group,
          restore: true,
          createdAt: target.created_at,
        }),
    )
  }

  if (showPresets) {
    return (
      <PresetsView
        sessionId={session?.id}
        currentSets={sets}
        onBack={() => setShowPresets(false)}
        onLoaded={() => setShowPresets(false)}
      />
    )
  }

  return (
    <div className="space-y-4 p-4">
      <DateNav
        date={date}
        max={todayISO()}
        onChange={(next) => {
          setDate(next)
          setActiveExercise(null)
          setActiveSuperset(null)
          setAppendPicking(false)
          setConfirmingDelete(false)
        }}
      />

      {sessionLoading ? (
        <SkeletonCard lines={2} />
      ) : !session || (restDayLogged && sets.length === 0) ? (
        <>
        <FireStreak count={streaks?.currentStreak ?? 0} label="day streak" />
        {restDayLogged ? (
          <RestDayCard undoing={deleteRestDay.isPending} onUndo={() => deleteRestDay.mutate(date)} />
        ) : (
          <PreworkoutGate
            loading={startSession.isPending}
            onAnswer={(pw) => startSession.mutate({ preworkout: pw, date })}
            logRestDayPending={logRestDay.isPending}
            onLogRestDay={() => logRestDay.mutate(date, { onSuccess: () => haptics.success() })}
          />
        )}
        </>
      ) : (
        <>
          {/* One session card: what you've moved, the session clock and the streak together, instead of
              three separate rows pushing the workout itself down the screen. */}
          <div className="rounded-3xl bg-gradient-to-br from-emerald-600/20 to-slate-900 px-4 pb-2 pt-3 shadow-lg shadow-black/20 shadow-[var(--glow-shadow)] ring-1 ring-white/5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400">{isToday ? "Today's" : 'Total'} moved</p>
                <p className="text-2xl font-bold text-white">
                  {toDisplayTotal(
                    sets.reduce((sum, s) => (s.is_warmup ? sum : sum + s.weight * s.reps), 0),
                    settings?.unit_system,
                  ).toLocaleString()}{' '}
                  <span className="text-sm font-medium text-slate-400">{weightUnitLabel(settings?.unit_system)}</span>
                </p>
              </div>
              <button
                onClick={() => setPreworkout.mutate({ sessionId: session.id, preworkout: !session.preworkout })}
                aria-pressed={session.preworkout}
                className={`min-h-8 rounded-full px-3 text-xs font-medium transition ${
                  session.preworkout ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}
              >
                Preworkout
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-1.5">
              <SessionTimer session={session} />
              <FireStreak count={streaks?.currentStreak ?? 0} label="day streak" />
            </div>
          </div>

          {/* With the preworkout question off (the default), the workout starts on its own, so the
              rest-day option that lives in that prompt needs a home here too. */}
          {sets.length === 0 && !activeExercise && !activeSuperset && (
            <div className="-my-2 text-center">
              <button
                onClick={() => logRestDay.mutate(date, { onSuccess: () => haptics.success() })}
                disabled={logRestDay.isPending}
                className="min-h-10 text-xs font-medium text-slate-500 underline decoration-dotted transition hover:text-emerald-400 disabled:opacity-50"
              >
                {logRestDay.isPending ? 'Logging rest day…' : 'Not training today? Log a rest day instead'}
              </button>
            </div>
          )}

          {(() => {
            const setForm = activeExercise && (
              <SetForm
                exercise={activeExercise}
                sessionId={session.id}
                existingSets={groupedByExercise.get(activeExercise.id) ?? []}
                nextSetNumber={(groupedByExercise.get(activeExercise.id)?.length ?? 0) + 1}
                adding={addSet.isPending}
                restTrigger={restTrigger}
                supersetLabel={activeSuperset ? labelForGroup(activeSuperset.groupId) : undefined}
                onAdd={handleAddSet}
                onDeleteSet={handleDeleteSet}
                onUpdateSet={(input) => updateSet.mutate(input)}
                onDone={() => setActiveExercise(null)}
              />
            )

            if (activeSuperset) {
              return (
                <div className="rounded-3xl border-2 border-emerald-500/30 bg-emerald-950/10 p-3 shadow-lg shadow-black/20 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                      Superset {labelForGroup(activeSuperset.groupId)} · {activeSuperset.exercises.length} exercises
                    </p>
                    <button
                      onClick={() => {
                        setActiveSuperset(null)
                        setActiveExercise(null)
                        setAppendPicking(false)
                      }}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      End superset
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 px-1">
                    {activeSuperset.exercises.map((ex) => {
                      const count = groupedByExercise.get(ex.id)?.length ?? 0
                      const isActive = ex.id === activeExercise?.id
                      return (
                        <button
                          key={ex.id}
                          onClick={() => setActiveExercise(ex)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                            isActive ? 'bg-emerald-600 text-on-accent' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {ex.name}
                          {count > 0 && ` · ${count}`}
                        </button>
                      )
                    })}
                    {activeSuperset.exercises.length < 4 && !appendPicking && (
                      <button
                        onClick={() => setAppendPicking(true)}
                        className="rounded-full border border-dashed border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:border-emerald-500 hover:text-emerald-400"
                      >
                        + Add
                      </button>
                    )}
                  </div>

                  {appendPicking ? (
                    <div className="rounded-2xl bg-slate-900/60 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-300">Add another exercise to this superset</p>
                        <button
                          onClick={() => setAppendPicking(false)}
                          className="text-xs text-slate-400 hover:text-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                      <ExercisePicker
                        excludeIds={activeSuperset.exercises.map((ex) => ex.id)}
                        onPick={(ex) => {
                          setActiveSuperset((cur) => (cur ? { ...cur, exercises: [...cur.exercises, ex] } : cur))
                          setActiveExercise(ex)
                          setAppendPicking(false)
                        }}
                      />
                    </div>
                  ) : (
                    setForm ?? <p className="px-1 text-sm text-slate-400">Tap an exercise above to log a set.</p>
                  )}
                </div>
              )
            }

            if (activeExercise) return setForm

            if (picking) {
              return (
                <div className="rounded-2xl bg-slate-900 border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium text-white">
                      {pickerMode === 'superset' ? 'Build a superset' : 'Pick an exercise'}
                    </h3>
                    <button onClick={() => setPicking(false)} className="text-sm text-slate-400 hover:text-slate-200">
                      Cancel
                    </button>
                  </div>
                  <ExercisePicker
                    multiSelect={pickerMode === 'superset'}
                    onPick={(ex) => {
                      resumeExercise(ex)
                      setPicking(false)
                    }}
                    onConfirmSelection={(exercises) => {
                      setActiveSuperset({ groupId: nextSupersetGroupId, exercises })
                      setActiveExercise(exercises[0])
                      setPicking(false)
                    }}
                  />
                </div>
              )
            }

            return (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setPickerMode('solo')
                    setPicking(true)
                  }}
                  className="rounded-2xl border border-dashed border-slate-700 py-3 text-sm font-medium text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
                >
                  + Add exercise
                </button>
                <button
                  onClick={() => {
                    setPickerMode('superset')
                    setPicking(true)
                  }}
                  className="rounded-2xl border border-dashed border-emerald-700/50 py-3 text-sm font-medium text-emerald-400/90 transition hover:border-emerald-500 hover:text-emerald-300"
                >
                  + Add superset
                </button>
              </div>
            )
          })()}

          {/* Secondary tools, next to where you add exercises rather than at the top of the screen. */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowPresets(true)}
              className="min-h-9 flex-1 rounded-xl bg-slate-800/60 px-3 text-xs font-medium text-slate-400 active:bg-slate-700"
            >
              Presets
            </button>
            <button
              onClick={onOpenHistory}
              className="min-h-9 flex-1 rounded-xl bg-slate-800/60 px-3 text-xs font-medium text-slate-400 active:bg-slate-700"
            >
              History
            </button>
            <CopyDayButton
              disabled={sets.length === 0}
              onCopy={(targetDate) => {
                copyDay.mutate({ fromDate: date, toDate: targetDate })
                show(`Copying to ${targetDate}…`)
              }}
            />
          </div>

          {(() => {
            const hiddenIds = new Set<string>()
            if (activeExercise) hiddenIds.add(activeExercise.id)
            if (activeSuperset) for (const ex of activeSuperset.exercises) hiddenIds.add(ex.id)

            const entries = Array.from(groupedByExercise.entries()).filter(([id]) => !hiddenIds.has(id))
            if (entries.length === 0) return null

            return (
              <div className="grid grid-cols-2 gap-3">
                {entries.map(([exerciseId, exerciseSets]) => {
                  const groupId = exerciseSets.find((s) => s.superset_group != null)?.superset_group
                  return (
                    <ExerciseSummaryBox
                      key={exerciseId}
                      name={exerciseSets[0].exercise?.name ?? 'Exercise'}
                      sets={exerciseSets}
                      supersetLabel={groupId != null ? labelForGroup(groupId) : undefined}
                      onClick={() => {
                        const exercise = exerciseSets[0].exercise
                        if (exercise) resumeExercise(exercise)
                      }}
                      onOpenDetail={() => setDetailExercise(exerciseSets[0].exercise)}
                    />
                  )
                })}
              </div>
            )
          })()}

          {session && <SessionNote session={session} />}

          <WeeklyVolumeCard todaySetsPerMuscle={setsPerMuscle} />

          {/* Destructive and rare, so it lives at the very bottom - still tap-to-confirm with undo. */}
          {sets.length > 0 && (
            <div className="flex justify-center pb-2">
              <button
                onClick={() => {
                  if (!confirmingDelete) {
                    setConfirmingDelete(true)
                    return
                  }
                  const snapshot = { ...session, workout_sets: sets }
                  setConfirmingDelete(false)
                  setActiveExercise(null)
                  setActiveSuperset(null)
                  setAppendPicking(false)
                  undoable(
                    'Workout deleted',
                    () => deleteSession.mutate(session.id),
                    () => restoreSession.mutate(snapshot),
                  )
                }}
                onBlur={() => setConfirmingDelete(false)}
                className={`min-h-11 rounded-xl px-4 text-sm font-medium transition ${
                  confirmingDelete ? 'bg-red-600 text-on-accent' : 'text-slate-500 active:text-red-400'
                }`}
              >
                {confirmingDelete ? 'Tap again to delete this workout' : 'Delete this workout'}
              </button>
            </div>
          )}
        </>
      )}

      {detailExercise && <ExerciseDetailModal exercise={detailExercise} onClose={() => setDetailExercise(null)} />}
    </div>
  )
}
