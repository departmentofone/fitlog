import { useMemo, useState } from 'react'
import { useHideQuickAdd } from '../../components/QuickAddVisibility'
import { MuscleDiagram } from '../../components/MuscleDiagram'
import { useCreateExercise, useExercises } from '../../hooks/useExercises'
import { useSessionHistory } from '../../hooks/useWorkouts'
import { inMuscleFilter, matchesExercise, MUSCLE_FILTERS, type MuscleFilter } from '../../lib/exerciseSearch'
import { muscleLabel, MUSCLE_GROUPS, type Exercise, type MuscleGroup } from '../../types'

const RECENT_SHOWN = 8

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
  const [muscle, setMuscle] = useState<MuscleFilter>('all')
  const { data: sessions = [] } = useSessionHistory()

  const filtered = useMemo(
    () =>
      exercises.filter(
        (e) => matchesExercise(e.name, search) && inMuscleFilter(e.muscle_group, muscle) && !excludeIds?.includes(e.id),
      ),
    [exercises, search, muscle, excludeIds],
  )

  // The exercises you've done lately, most recent first: most workouts repeat a handful of them.
  const recent = useMemo(() => {
    if (search.trim() || muscle !== 'all') return []
    const ids: string[] = []
    for (const session of sessions) {
      for (const set of [...session.workout_sets].reverse()) {
        if (!ids.includes(set.exercise_id)) ids.push(set.exercise_id)
      }
    }
    return ids
      .map((id) => exercises.find((e) => e.id === id))
      .filter((e): e is Exercise => !!e && !excludeIds?.includes(e.id))
      .slice(0, RECENT_SHOWN)
  }, [sessions, exercises, search, muscle, excludeIds])

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

  function startCreating() {
    // Whatever was typed into the search is most likely the new exercise's name.
    setName(search.trim())
    setCreating(true)
  }

  if (creating) {
    return (
      <div className="inset p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">New exercise</h3>
        <input
          autoFocus
          placeholder="Exercise name (e.g. Incline DB Press)"
          aria-label="Exercise name"
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

  const row = (ex: Exercise) => {
    const isSelected = multiSelect && selected.some((e) => e.id === ex.id)
    return (
      <button
        key={ex.id}
        onClick={() => handleRowClick(ex)}
        aria-pressed={multiSelect ? isSelected : undefined}
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-white transition ${
          isSelected ? 'bg-emerald-600/30 ring-1 ring-emerald-500' : 'bg-slate-800 active:bg-slate-700'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {multiSelect && (
            <span
              aria-hidden="true"
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                isSelected ? 'bg-emerald-600 text-on-accent' : 'bg-slate-700 text-transparent'
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
          )}
          <span className="text-sm font-medium leading-snug">{ex.name}</span>
        </span>
        <span className="shrink-0 text-xs text-slate-400">{muscleLabel(ex.muscle_group)}</span>
      </button>
    )
  }

  const searching = search.trim() !== ''

  // No box of its own to scroll inside (fiddly on a phone): the list scrolls with the page, and the
  // search and muscle chips stay pinned above it.
  return (
    <div>
      <div className="sticky top-0 z-10 -mx-4 mb-3 bg-slate-950/90 px-4 pb-2 pt-1 backdrop-blur-xl">
        <input
          type="search"
          aria-label="Search exercises"
          placeholder="Search, e.g. db bench or rdl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full field px-3 py-2.5"
        />
        <div className="-mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Muscle group">
          {MUSCLE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setMuscle(f.value)}
              aria-pressed={muscle === f.value}
              className={`min-h-8 shrink-0 rounded-full px-3 text-xs font-semibold transition ${
                muscle === f.value ? 'bg-emerald-600 text-on-accent' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {multiSelect && (
          <p className="mt-2 text-xs text-slate-400">
            Tap 2-{maxSelectable} exercises to group as a superset
            {selected.length > 0 && <span className="text-emerald-400"> · {selected.length} selected</span>}
          </p>
        )}
      </div>

      {multiSelect && selected.length >= 2 && (
        <button onClick={() => onConfirmSelection?.(selected)} className="btn btn-primary mb-3 w-full py-2.5">
          Group {selected.length} exercises as a superset
        </button>
      )}

      {recent.length > 0 && (
        <div className="mb-4">
          <p className="mb-1.5 text-xs font-semibold text-slate-400">Recent</p>
          <div className="space-y-1.5">{recent.map(row)}</div>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mb-3">
          {recent.length > 0 && <p className="mb-1.5 text-xs font-semibold text-slate-400">All exercises</p>}
          <div className="space-y-1.5">{filtered.map(row)}</div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="mb-3 rounded-xl bg-slate-800/60 px-3 py-3 text-sm text-slate-400">
          {searching ? (
            <>
              No exercise matches “{search.trim()}”
              {muscle !== 'all' && ` in ${MUSCLE_FILTERS.find((f) => f.value === muscle)?.label}`}.
            </>
          ) : (
            'No exercises in this group yet.'
          )}
        </div>
      )}

      <button
        onClick={startCreating}
        className="min-h-11 w-full rounded-xl border border-dashed border-slate-700 text-sm font-medium text-slate-300 active:border-emerald-500 active:text-emerald-400"
      >
        {searching && filtered.length === 0 ? `+ Create “${search.trim()}”` : '+ New exercise'}
      </button>
    </div>
  )
}
