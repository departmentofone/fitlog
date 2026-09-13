import type { SetWithExercise } from '../../hooks/useWorkouts'

interface SetListProps {
  sets: SetWithExercise[]
  onDelete: (id: string) => void
}

export function SetList({ sets, onDelete }: SetListProps) {
  if (sets.length === 0) {
    return <p className="text-sm text-slate-500">No sets logged yet today.</p>
  }

  const grouped = new Map<string, SetWithExercise[]>()
  for (const s of sets) {
    const key = s.exercise?.name ?? 'Unknown'
    grouped.set(key, [...(grouped.get(key) ?? []), s])
  }

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([name, exerciseSets]) => (
        <div key={name} className="rounded-xl bg-slate-900 p-3">
          <h4 className="mb-2 text-sm font-medium text-white">{name}</h4>
          <div className="space-y-1">
            {exerciseSets.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2 text-sm text-slate-300"
              >
                <span>
                  Set {s.set_number} · {s.weight} × {s.reps} reps
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">RPE {s.difficulty}</span>
                  <button onClick={() => onDelete(s.id)} className="text-red-400 hover:text-red-300">
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
