import { useState } from 'react'
import type { Exercise } from '../../types'

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
  nextSetNumber: number
  onAdd: (input: { weight: number; reps: number; difficulty: number }) => void
  onDone: () => void
  adding?: boolean
}

export function SetForm({ exercise, nextSetNumber, onAdd, onDone, adding }: SetFormProps) {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [difficulty, setDifficulty] = useState(6)

  function handleAdd() {
    const w = parseFloat(weight)
    const r = parseInt(reps, 10)
    if (Number.isNaN(w) || Number.isNaN(r)) return
    onAdd({ weight: w, reps: r, difficulty })
    setReps('')
  }

  return (
    <div className="rounded-xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-white">{exercise.name}</h3>
        <button onClick={onDone} className="text-sm text-slate-400 hover:text-slate-200">
          Done
        </button>
      </div>
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
        <span>Difficulty</span>
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
