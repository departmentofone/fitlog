import { useState } from 'react'
import { useLastSetForExercise } from '../../hooks/useWorkouts'
import type { Exercise, WorkoutSet } from '../../types'

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Very easy',
  2: 'Easy',
  3: 'Easy',
  4: 'Moderate',
  5: 'Moderate',
  6: 'Moderate',
  7: 'Hard',
  8: 'Hard',
  9: 'Very hard',
  10: 'Failure',
}

interface SetFormProps {
  exercise: Exercise
  sessionId: string
  existingSets: WorkoutSet[]
  nextSetNumber: number
  onAdd: (input: { weight: number; reps: number; difficulty: number }) => void
  onDeleteSet: (id: string) => void
  onUpdateSet: (input: { setId: string; weight: number; reps: number; difficulty: number }) => void
  onDone: () => void
  adding?: boolean
}

function EditableSetRow({
  set,
  onSave,
  onCancel,
  onDelete,
}: {
  set: WorkoutSet
  onSave: (input: { weight: number; reps: number; difficulty: number }) => void
  onCancel: () => void
  onDelete: () => void
}) {
  const [weight, setWeight] = useState(String(set.weight))
  const [reps, setReps] = useState(String(set.reps))
  const [difficulty, setDifficulty] = useState(set.difficulty)

  return (
    <div className="rounded-lg bg-slate-800 px-3 py-2.5">
      <div className="mb-2 grid grid-cols-2 gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
        />
        <input
          type="number"
          inputMode="numeric"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={difficulty}
        onChange={(e) => setDifficulty(parseInt(e.target.value, 10))}
        className="mb-2 w-full accent-emerald-500"
      />
      <div className="flex gap-2">
        <button onClick={onDelete} className="rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-600/30">
          Delete
        </button>
        <button onClick={onCancel} className="flex-1 rounded-lg bg-slate-700 py-1.5 text-xs text-slate-300 hover:bg-slate-600">
          Cancel
        </button>
        <button
          onClick={() => {
            const w = parseFloat(weight)
            const r = parseInt(reps, 10)
            if (Number.isNaN(w) || Number.isNaN(r)) return
            onSave({ weight: w, reps: r, difficulty })
          }}
          className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
        >
          Save
        </button>
      </div>
    </div>
  )
}

export function SetForm({
  exercise,
  sessionId,
  existingSets,
  nextSetNumber,
  onAdd,
  onDeleteSet,
  onUpdateSet,
  onDone,
  adding,
}: SetFormProps) {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [difficulty, setDifficulty] = useState(6)
  const [editingSetId, setEditingSetId] = useState<string | null>(null)
  const { data: lastSet } = useLastSetForExercise(exercise.id, sessionId)

  function handleAdd() {
    const w = parseFloat(weight)
    const r = parseInt(reps, 10)
    if (Number.isNaN(w) || Number.isNaN(r)) return
    onAdd({ weight: w, reps: r, difficulty })
    setReps('')
  }

  return (
    <div className="rounded-xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-medium text-white">{exercise.name}</h3>
        <button onClick={onDone} className="text-sm text-slate-400 hover:text-slate-200">
          Done
        </button>
      </div>

      {lastSet && (
        <p className="mb-3 text-xs text-slate-500">
          Last time: <span className="text-slate-300">{lastSet.weight}kg × {lastSet.reps} reps</span>
        </p>
      )}

      {existingSets.length > 0 && (
        <div className="mb-3 space-y-1">
          {existingSets.map((s) =>
            editingSetId === s.id ? (
              <EditableSetRow
                key={s.id}
                set={s}
                onCancel={() => setEditingSetId(null)}
                onDelete={() => {
                  onDeleteSet(s.id)
                  setEditingSetId(null)
                }}
                onSave={(input) => {
                  onUpdateSet({ setId: s.id, ...input })
                  setEditingSetId(null)
                }}
              />
            ) : (
              <button
                key={s.id}
                onClick={() => setEditingSetId(s.id)}
                className="flex w-full items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-slate-800"
              >
                <span>
                  Set {s.set_number} · {s.weight} × {s.reps} reps
                </span>
                <span className="text-xs text-slate-500">DIFF {s.difficulty}</span>
              </button>
            ),
          )}
        </div>
      )}

      <p className="mb-2 text-xs text-slate-500">Set {nextSetNumber}</p>
      <div className="mb-3 grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Weight
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Reps
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
          />
        </label>
      </div>
      <label className="mb-1 flex justify-between text-xs text-slate-400">
        <span>Difficulty (DIFF)</span>
        <span className="text-slate-300">
          {difficulty} · {DIFFICULTY_LABELS[difficulty]}
        </span>
      </label>
      <input
        type="range"
        min={1}
        max={10}
        value={difficulty}
        onChange={(e) => setDifficulty(parseInt(e.target.value, 10))}
        className="mb-4 w-full accent-emerald-500"
      />
      <button
        onClick={handleAdd}
        disabled={!weight || !reps || adding}
        className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        Add set
      </button>
    </div>
  )
}
