import { useMemo, useState } from 'react'
import { CopyDayButton } from '../../components/CopyDayButton'
import { DateNav } from '../../components/DateNav'
import { FireStreak } from '../../components/FireStreak'
import { MuscleDiagram } from '../../components/MuscleDiagram'
import { useToast } from '../../components/ToastProvider'
import { SkeletonCard } from '../../components/Skeleton'
import { haptics } from '../../lib/haptics'
import { useUserSettings } from '../../hooks/useUserSettings'
import { useWorkoutStreaks } from '../../hooks/useWorkoutStreaks'
import {
  todayISO,
  useAddSet,
  useAutoStartSession,
  useCopyWorkoutDay,
  useDeleteSession,
  useDeleteSet,
  useExerciseHistory,
  useRestoreSession,
  useSessionSets,
  useSetPreworkout,
  useStartSession,
  useUpdateSet,
} from '../../hooks/useWorkouts'
import { estimate1RM } from '../../lib/oneRepMax'
import type { Exercise } from '../../types'
import { ExerciseDetailModal } from './ExerciseDetailModal'
import { ExercisePicker } from './ExercisePicker'
import { ExerciseSummaryBox } from './ExerciseSummaryBox'
import { PresetsView } from './PresetsView'
import { PreworkoutGate } from './PreworkoutGate'
import { SessionTimer } from './SessionTimer'
import { SetForm } from './SetForm'
import { WeeklyVolumeCard } from './WeeklyVolumeCard'

export function WorkoutsTab({ onOpenHistory }: { onOpenHistory: () => void }) {
  const { data: settings } = useUserSettings()
  const askPreworkout = settings?.ask_preworkout ?? true

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

  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)
  const [picking, setPicking] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [restTrigger, setRestTrigger] = useState(0)
  const { data: activeExerciseHistory = [] } = useExerciseHistory(activeExercise?.id)

  const groupedByExercise = useMemo(() => {
    const map = new Map<string, (typeof sets)[number][]>()
    for (const s of sets) {
      map.set(s.exercise_id, [...(map.get(s.exercise_id) ?? []), s])
    }
    return map
  }, [sets])

  const musclesTrained = useMemo(
    () => Array.from(new Set(sets.map((s) => s.exercise?.muscle_group).filter(Boolean))),
    [sets],
  )

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
          setConfirmingDelete(false)
        }}
      />

      <div className="flex gap-2">
        <button
          onClick={() => setShowPresets(true)}
          className="flex-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700"
        >
          Presets
        </button>
        <button
          onClick={onOpenHistory}
          className="flex-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700"
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

      <FireStreak count={streaks?.currentStreak ?? 0} label="day streak" />

      {sessionLoading ? (
        <SkeletonCard lines={2} />
      ) : !session ? (
        <PreworkoutGate loading={startSession.isPending} onAnswer={(pw) => startSession.mutate({ preworkout: pw, date })} />
      ) : (
        <>
          <div className="flex items-center justify-between rounded-3xl bg-gradient-to-br from-emerald-600/20 to-slate-900 px-4 py-3 shadow-lg shadow-black/20 shadow-[var(--glow-shadow)] ring-1 ring-white/5">
            <div>
              <p className="text-xs text-slate-400">{isToday ? "Today's" : 'Total'} moved</p>
              <p className="text-2xl font-bold text-white">
                {sets.reduce((sum, s) => sum + s.weight * s.reps, 0).toLocaleString()}{' '}
                <span className="text-sm font-medium text-slate-400">kg</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreworkout.mutate({ sessionId: session.id, preworkout: !session.preworkout })}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  session.preworkout
                    ? 'bg-emerald-600/20 text-emerald-400'
                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                Preworkout
              </button>
              {sets.length > 0 && (
                <button
                  onClick={() => {
                    if (!confirmingDelete) {
                      setConfirmingDelete(true)
                      return
                    }
                    const snapshot = { ...session, workout_sets: sets }
                    setConfirmingDelete(false)
                    setActiveExercise(null)
                    undoable(
                      'Workout deleted',
                      () => deleteSession.mutate(session.id),
                      () => restoreSession.mutate(snapshot),
                    )
                  }}
                  onBlur={() => setConfirmingDelete(false)}
                  aria-label="Delete workout"
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    confirmingDelete
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 text-slate-500 hover:text-red-400'
                  }`}
                >
                  {confirmingDelete ? (
                    'Tap to confirm'
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>

          <SessionTimer session={session} />

          {activeExercise ? (
            <SetForm
              exercise={activeExercise}
              sessionId={session.id}
              existingSets={groupedByExercise.get(activeExercise.id) ?? []}
              nextSetNumber={(groupedByExercise.get(activeExercise.id)?.length ?? 0) + 1}
              adding={addSet.isPending}
              restTrigger={restTrigger}
              onAdd={(input) => {
                const priorBest = activeExerciseHistory
                  .filter((h) => !h.is_warmup)
                  .reduce((max, h) => Math.max(max, estimate1RM(h.weight, h.reps)), 0)
                const newOneRm = estimate1RM(input.weight, input.reps)
                const isPr = !input.isWarmup && priorBest > 0 && newOneRm > priorBest

                if (isPr) {
                  haptics.pr()
                  show(`New PR on ${activeExercise.name}!`, { duration: 4000 })
                } else {
                  haptics.tap()
                }

                addSet.mutate(
                  {
                    exerciseId: activeExercise.id,
                    setNumber: (groupedByExercise.get(activeExercise.id)?.length ?? 0) + 1,
                    ...input,
                  },
                  { onSuccess: () => setRestTrigger((t) => t + 1) },
                )
              }}
              onDeleteSet={(id) => {
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
                    }),
                )
              }}
              onUpdateSet={(input) => updateSet.mutate(input)}
              onDone={() => setActiveExercise(null)}
            />
          ) : picking ? (
            <div className="rounded-2xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium text-white">Pick an exercise</h3>
                <button onClick={() => setPicking(false)} className="text-sm text-slate-400 hover:text-slate-200">
                  Cancel
                </button>
              </div>
              <ExercisePicker
                onPick={(ex) => {
                  setActiveExercise(ex)
                  setPicking(false)
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => setPicking(true)}
              className="w-full rounded-2xl border border-dashed border-slate-700 py-3 font-medium text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
            >
              + Add exercise
            </button>
          )}

          {Array.from(groupedByExercise.entries()).filter(([id]) => id !== activeExercise?.id).length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {Array.from(groupedByExercise.entries())
                .filter(([exerciseId]) => exerciseId !== activeExercise?.id)
                .map(([exerciseId, exerciseSets]) => (
                  <ExerciseSummaryBox
                    key={exerciseId}
                    name={exerciseSets[0].exercise?.name ?? 'Exercise'}
                    sets={exerciseSets}
                    onClick={() => setActiveExercise(exerciseSets[0].exercise)}
                    onOpenDetail={() => setDetailExercise(exerciseSets[0].exercise)}
                  />
                ))}
            </div>
          )}

          {musclesTrained.length > 0 && (
            <div className="rounded-3xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
              <h3 className="mb-2 text-center text-sm font-medium text-slate-300">Muscle groups worked</h3>
              <MuscleDiagram selected={musclesTrained} size={90} />
            </div>
          )}

          <WeeklyVolumeCard />
        </>
      )}

      {detailExercise && <ExerciseDetailModal exercise={detailExercise} onClose={() => setDetailExercise(null)} />}
    </div>
  )
}
