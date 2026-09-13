import { useMemo, useState } from 'react'
import { MuscleDiagram } from '../../components/MuscleDiagram'
import { useCreateExercise, useExercises } from '../../hooks/useExercises'
import { MUSCLE_GROUPS, type Exercise, type MuscleGroup } from '../../types'

interface ExercisePickerProps {
  onPick: (exercise: Exercise) => void
}

export function ExercisePicker({ onPick }: ExercisePickerProps) {
  const { data: exercises = [] } = useExercises()
  const createExercise = useCreateExercise()
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null)

  const filtered = useMemo(
    () => exercises.filter((e) => e.name.toLowerCase().includes(search.toLowerCase())),
    [exercises, search],
  )

  async function handleCreate() {
    if (!name.trim() || !muscleGroup) return
    const exercise = await createExercise.mutateAsync({ name: name.trim(), muscleGroup })
    setName('')
    setMuscleGroup(null)
    setCreating(false)
    setSearch('')
    onPick(exercise)
  }

  if (creating) {
    return (
      <div className="rounded-xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h3 className="mb-3 font-medium text-white">New exercise</h3>
        <input
          autoFocus
          placeholder="Exercise name (e.g. Incline DB Press)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        <MuscleDiagram selected={muscleGroup} onSelect={setMuscleGroup} />
        <div className="mt-4 grid grid-cols-3 gap-1.5">
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g.value}
              onClick={() => setMuscleGroup(g.value)}
              className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                muscleGroup === g.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setCreating(false)}
            className="flex-1 rounded-lg bg-slate-800 py-2.5 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || !muscleGroup || createExercise.isPending}
            className="flex-1 rounded-lg bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <input
        placeholder="Search exercises…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
      />
      <div className="mb-3 max-h-56 space-y-1.5 overflow-y-auto">
        {filtered.map((ex) => (
          <button
            key={ex.id}
            onClick={() => onPick(ex)}
            className="flex w-full items-center justify-between rounded-lg bg-slate-800 px-3 py-2.5 text-left text-white hover:bg-slate-700"
          >
            <span>{ex.name}</span>
            <span className="text-xs text-slate-400">
              {MUSCLE_GROUPS.find((g) => g.value === ex.muscle_group)?.label}
            </span>
          </button>
        ))}
        {filtered.length === 0 && <p className="px-1 text-sm text-slate-500">No exercises yet.</p>}
      </div>
      <button
        onClick={() => setCreating(true)}
        className="w-full rounded-lg border border-dashed border-slate-700 py-2.5 text-sm font-medium text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
      >
        + New exercise
      </button>
    </div>
  )
}
