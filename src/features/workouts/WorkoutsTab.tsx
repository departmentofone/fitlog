import { useMemo, useState } from 'react'
import { FireStreak } from '../../components/FireStreak'
import { MuscleDiagram } from '../../components/MuscleDiagram'
import { useUserSettings } from '../../hooks/useUserSettings'
import { useWorkoutStreaks } from '../../hooks/useWorkoutStreaks'
import {
  todayISO,
  useAddSet,
  useAutoStartSession,
  useDeleteSet,
  useSessionSets,
  useSetPreworkout,
  useStartSession,
  useUpdateSet,
} from '../../hooks/useWorkouts'
import type { Exercise } from '../../types'
import { ExercisePicker } from './ExercisePicker'
import { ExerciseSummaryBox } from './ExerciseSummaryBox'
import { PresetsView } from './PresetsView'
import { PreworkoutGate } from './PreworkoutGate'
import { SetForm } from './SetForm'

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
  const { data: streaks } = useWorkoutStreaks()

  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)
  const [picking, setPicking] = useState(false)
  const [showPresets, setShowPresets] = useState(false)

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
      <div className="flex items-center justify-between gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setActiveExercise(null)
          }}
          max={todayISO()}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setShowPresets(true)}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700"
          >
            📋 Presets
          </button>
          <button
            onClick={onOpenHistory}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700"
          >
            📖 History
          </button>
        </div>
      </div>

      <FireStreak count={streaks?.currentStreak ?? 0} label="day streak" />

      {sessionLoading ? (
        <p className="p-4 text-slate-400">Loading…</p>
      ) : !session ? (
        <PreworkoutGate loading={startSession.isPending} onAnswer={(pw) => startSession.mutate({ preworkout: pw, date })} />
      ) : (
        <>
          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-emerald-600/20 to-slate-900 px-4 py-3 shadow-lg shadow-black/20 ring-1 ring-white/5">
            <div>
              <p className="text-xs text-slate-400">{isToday ? "Today's" : 'Total'} moved</p>
              <p className="text-2xl font-bold text-white">
                {sets.reduce((sum, s) => sum + s.weight * s.reps, 0).toLocaleString()}{' '}
                <span className="text-sm font-medium text-slate-400">kg</span>
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
              existingSets={groupedByExercise.get(activeExercise.id) ?? []}
              nextSetNumber={(groupedByExercise.get(activeExercise.id)?.length ?? 0) + 1}
              adding={addSet.isPending}
              onAdd={(input) =>
                addSet.mutate({
                  exerciseId: activeExercise.id,
                  setNumber: (groupedByExercise.get(activeExercise.id)?.length ?? 0) + 1,
                  ...input,
                })
              }
              onDeleteSet={(id) => deleteSet.mutate(id)}
              onUpdateSet={(input) => updateSet.mutate(input)}
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
                  />
                ))}
            </div>
          )}

          {musclesTrained.length > 0 && (
            <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
              <h3 className="mb-2 text-center text-sm font-medium text-slate-300">Muscle groups worked</h3>
              <MuscleDiagram selected={musclesTrained} size={90} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
