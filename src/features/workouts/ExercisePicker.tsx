import { useMemo, useState } from 'react'
import { useHideQuickAdd } from '../../components/QuickAddVisibility'
import { MuscleDiagram } from '../../components/MuscleDiagram'
import { useCreateExercise, useExercises } from '../../hooks/useExercises'
import { MUSCLE_GROUPS, type Exercise, type MuscleGroup } from '../../types'

interface ExercisePickerProps {
  onPick: (exercise: Exercise) => void
  /** Exercise ids to hide from the list entirely (e.g. exercises already in the active superset). */
  excludeIds?: string[]
  /**
   * When set, tapping a row toggles it in/out of a selection instead of picking immediately; a
   * confirm bar appears once 2+ are selected. Used to build a superset of 2-4 exercises at once.
   */
  multiSelect?: boolean
  onConfirmSelection?: (exercises: Exercise[]) => void
  maxSelectable?: number
}

const DEFAULT_MAX_SELECTABLE = 4

export function ExercisePicker({
  onPick,
  excludeIds,
  multiSelect,
  onConfirmSelection,
  maxSelectable = DEFAULT_MAX_SELECTABLE,
}: ExercisePickerProps) {
  useHideQuickAdd()
  const { data: exercises = [] } = useExercises()
  const createExercise = useCreateExercise()
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null)
  const [selected, setSelected] = useState<Exercise[]>([])

  const filtered = useMemo(() => {
    const bySearch = exercises.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
    return excludeIds ? bySearch.filter((e) => !excludeIds.includes(e.id)) : bySearch
  }, [exercises, search, excludeIds])

  function toggleSelected(exercise: Exercise) {
    setSelected((cur) => {
      if (cur.some((e) => e.id === exercise.id)) return cur.filter((e) => e.id !== exercise.id)
      if (cur.length >= maxSelectable) return cur
      return [...cur, exercise]
    })
  }

  function handleRowClick(exercise: Exercise) {
    if (multiSelect) {
      toggleSelected(exercise)
    } else {
      onPick(exercise)
    }
  }

  async function handleCreate() {
    if (!name.trim() || !muscleGroup) return
    const exercise = await createExercise.mutateAsync({ name: name.trim(), muscleGroup })
    setName('')
    setMuscleGroup(null)
    setCreating(false)
    setSearch('')
    if (multiSelect) {
      setSelected((cur) => (cur.length >= maxSelectable ? cur : [...cur, exercise]))
    } else {
      onPick(exercise)
    }
  }

  if (creating) {
    return (
      <div className="card p-4">
        <h3 className="mb-3 card-title">New exercise</h3>
        <input
          autoFocus
          placeholder="Exercise name (e.g. Incline DB Press)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-4 w-full field px-3 py-2.5"
        />
        <MuscleDiagram selected={muscleGroup} onSelect={setMuscleGroup} />
        <div className="mt-4 grid grid-cols-3 gap-1.5">
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g.value}
              onClick={() => setMuscleGroup(g.value)}
              className={`rounded-xl px-2 py-1.5 text-xs font-medium transition ${
                muscleGroup === g.value
                  ? 'bg-emerald-600 text-on-accent'
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
            className="flex-1 rounded-xl bg-slate-800 py-2.5 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || !muscleGroup || createExercise.isPending}
            className="btn btn-primary flex-1 py-2.5"
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
        className="mb-3 w-full field px-3 py-2.5"
      />
      {multiSelect && (
        <p className="mb-2 text-xs text-slate-400">
          Tap 2-{maxSelectable} exercises to group as a superset
          {selected.length > 0 && <span className="text-emerald-400"> · {selected.length} selected</span>}
        </p>
      )}
      <div className="mb-3 max-h-56 space-y-1.5 overflow-y-auto">
        {filtered.map((ex) => {
          const isSelected = multiSelect && selected.some((e) => e.id === ex.id)
          return (
            <button
              key={ex.id}
              onClick={() => handleRowClick(ex)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-white transition ${
                isSelected ? 'bg-emerald-600/30 ring-1 ring-emerald-500' : 'bg-slate-800 hover:bg-slate-700'
              }`}
            >
              <span className="flex items-center gap-2">
                {multiSelect && (
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[11px] ${
                      isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                )}
                {ex.name}
              </span>
              <span className="text-xs text-slate-400">
                {MUSCLE_GROUPS.find((g) => g.value === ex.muscle_group)?.label}
              </span>
            </button>
          )
        })}
        {filtered.length === 0 && <p className="px-1 text-sm text-slate-500">No exercises yet.</p>}
      </div>
      {multiSelect && selected.length >= 2 && (
        <button
          onClick={() => onConfirmSelection?.(selected)}
          className="btn btn-primary mb-3 w-full py-2.5"
        >
          Group {selected.length} exercises as a superset
        </button>
      )}
      <button
        onClick={() => setCreating(true)}
        className="w-full rounded-xl border border-dashed border-slate-700 py-2.5 text-sm font-medium text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
      >
        + New exercise
      </button>
    </div>
  )
}
