import { useMemo, useState } from 'react'
import { FireStreak } from '../../components/FireStreak'
import { MuscleDiagram } from '../../components/MuscleDiagram'
import { useUserSettings } from '../../hooks/useUserSettings'
import { useWorkoutStreaks } from '../../hooks/useWorkoutStreaks'
import {
  useAddSet,
  useAutoStartSession,
  useDeleteSet,
  useSessionSets,
  useSetPreworkout,
  useStartSession,
} from '../../hooks/useWorkouts'
import type { Exercise } from '../../types'
import { ExercisePicker } from './ExercisePicker'
import { ExerciseSummaryBox } from './ExerciseSummaryBox'
import { PreworkoutGate } from './PreworkoutGate'
import { SetForm } from './SetForm'

export function WorkoutsTab({ onOpenHistory }: { onOpenHistory: () => void }) {
  const { data: settings } = useUserSettings()
  const askPreworkout = settings?.ask_preworkout ?? true

  const { session, isLoading: sessionLoading } = useAutoStartSession(!askPreworkout)
  const startSession = useStartSession()
  const setPreworkout = useSetPreworkout()
  const { data: sets = [] } = useSessionSets(session?.id)
  const addSet = useAddSet(session?.id)
  const deleteSet = useDeleteSet(session?.id)
  const { data: streaks } = useWorkoutStreaks()

  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)
  const [picking, setPicking] = useState(false)

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

  if (sessionLoading) {
    return <p className="p-4 text-slate-400">Loading…</p>
  }

  if (!session) {
    return <PreworkoutGate loading={startSession.isPending} onAnswer={(pw) => startSession.mutate({ preworkout: pw })} />
  }

  const activeSets = activeExercise ? (groupedByExercise.get(activeExercise.id) ?? []) : []
  const nextSetNumber = activeSets.length + 1
  const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0)

  const collapsedExercises = Array.from(groupedByExercise.entries()).filter(
    ([exerciseId]) => exerciseId !== activeExercise?.id,
  )

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <FireStreak count={streaks?.currentStreak ?? 0} label="day streak" />
        <button
          onClick={onOpenHistory}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700"
        >
          📖 History
        </button>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-emerald-600/20 to-slate-900 px-4 py-3 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <div>
          <p className="text-xs text-slate-400">Today's total moved</p>
          <p className="text-2xl font-bold text-white">
            {totalVolume.toLocaleString()} <span className="text-sm font-medium text-slate-400">kg</span>
          </p>
        </div>
        <button
          onClick={() => setPreworkout.mutate({ sessionId: session.id, preworkout: !session.preworkout })}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            session.preworkout
              ? 'bg-emerald-600/20 text-emerald-400'
              : 'bg-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          ⚡ Preworkout
        </button>
      </div>

      {activeExercise ? (
        <SetForm
          exercise={activeExercise}
          sessionId={session.id}
          existingSets={activeSets}
          nextSetNumber={nextSetNumber}
          adding={addSet.isPending}
          onAdd={(input) =>
            addSet.mutate({
              exerciseId: activeExercise.id,
              setNumber: nextSetNumber,
              ...input,
            })
          }
          onDeleteSet={(id) => deleteSet.mutate(id)}
          onDone={() => setActiveExercise(null)}
        />
      ) : picking ? (
        <div className="rounded-xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
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
          className="w-full rounded-xl border border-dashed border-slate-700 py-3 font-medium text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
        >
          + Add exercise
        </button>
      )}

      {collapsedExercises.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {collapsedExercises.map(([exerciseId, exerciseSets]) => (
            <ExerciseSummaryBox
              key={exerciseId}
              name={exerciseSets[0].exercise?.name ?? 'Exercise'}
              sets={exerciseSets}
              onClick={() => setActiveExercise(exerciseSets[0].exercise)}
            />
          ))}
        </div>
      )}

      {musclesTrained.length > 0 && (
        <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
          <h3 className="mb-2 text-center text-sm font-medium text-slate-300">Muscle groups worked today</h3>
          <MuscleDiagram selected={musclesTrained} size={90} />
        </div>
      )}
    </div>
  )
}
