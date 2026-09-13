import { useState } from 'react'
import { useAddSet, useDeleteSet, useEnsureTodaySession, useSessionSets } from '../../hooks/useWorkouts'
import type { Exercise } from '../../types'
import { ExercisePicker } from './ExercisePicker'
import { SetForm } from './SetForm'
import { SetList } from './SetList'

export function WorkoutsTab() {
  const { session, isLoading: sessionLoading } = useEnsureTodaySession()
  const { data: sets = [] } = useSessionSets(session?.id)
  const addSet = useAddSet(session?.id)
  const deleteSet = useDeleteSet(session?.id)

  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)
  const [picking, setPicking] = useState(false)

  if (sessionLoading || !session) {
    return <p className="p-4 text-slate-400">Loading…</p>
  }

  const nextSetNumber = activeExercise
    ? sets.filter((s) => s.exercise_id === activeExercise.id).length + 1
    : 1

  const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0)

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-emerald-600/20 to-slate-900 px-4 py-3 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <div>
          <p className="text-xs text-slate-400">Today's total moved</p>
          <p className="text-2xl font-bold text-white">
            {totalVolume.toLocaleString()} <span className="text-sm font-medium text-slate-400">kg</span>
          </p>
        </div>
        {session.preworkout && (
          <span className="rounded-full bg-emerald-600/20 px-3 py-1 text-xs font-medium text-emerald-400">
            ⚡ Preworkout
          </span>
        )}
      </div>

      {activeExercise ? (
        <SetForm
          exercise={activeExercise}
          nextSetNumber={nextSetNumber}
          adding={addSet.isPending}
          onAdd={(input) =>
            addSet.mutate({
              exerciseId: activeExercise.id,
              setNumber: nextSetNumber,
              ...input,
            })
          }
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

      <SetList sets={sets} onDelete={(id) => deleteSet.mutate(id)} />
    </div>
  )
}
