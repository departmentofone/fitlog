import { useState } from 'react'
import {
  useAddSet,
  useDeleteSet,
  useSessionSets,
  useStartSession,
  useTodaySession,
  useTogglePreworkout,
} from '../../hooks/useWorkouts'
import type { Exercise } from '../../types'
import { ExercisePicker } from './ExercisePicker'
import { SetForm } from './SetForm'
import { SetList } from './SetList'

export function WorkoutsTab() {
  const { data: session, isLoading: sessionLoading } = useTodaySession()
  const startSession = useStartSession()
  const togglePreworkout = useTogglePreworkout()
  const { data: sets = [] } = useSessionSets(session?.id)
  const addSet = useAddSet(session?.id)
  const deleteSet = useDeleteSet(session?.id)

  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)
  const [picking, setPicking] = useState(false)

  if (sessionLoading) {
    return <p className="p-4 text-slate-400">Loading…</p>
  }

  if (!session) {
    return (
      <div className="p-4">
        <div className="rounded-xl bg-slate-900 p-5 text-center">
          <h2 className="mb-2 text-lg font-semibold text-white">Start today's workout</h2>
          <p className="mb-4 text-sm text-slate-400">Did you take preworkout?</p>
          <div className="mb-4 flex justify-center gap-3">
            <button
              onClick={() => startSession.mutate({ preworkout: true })}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-500"
            >
              Yes
            </button>
            <button
              onClick={() => startSession.mutate({ preworkout: false })}
              className="rounded-lg bg-slate-800 px-5 py-2.5 font-medium text-slate-200 hover:bg-slate-700"
            >
              No
            </button>
          </div>
        </div>
      </div>
    )
  }

  const nextSetNumber = activeExercise
    ? sets.filter((s) => s.exercise_id === activeExercise.id).length + 1
    : 1

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3">
        <span className="text-sm text-slate-300">Preworkout taken</span>
        <input
          type="checkbox"
          checked={session.preworkout}
          onChange={(e) => togglePreworkout.mutate({ sessionId: session.id, preworkout: e.target.checked })}
          className="h-5 w-5 accent-emerald-500"
        />
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
        <div className="rounded-xl bg-slate-900 p-4">
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
          className="w-full rounded-xl border border-dashed border-slate-700 py-3 font-medium text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
        >
          + Add exercise
        </button>
      )}

      <SetList sets={sets} onDelete={(id) => deleteSet.mutate(id)} />
    </div>
  )
}
