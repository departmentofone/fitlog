import type { SetWithExercise } from '../../hooks/useWorkouts'

export function ExerciseSummaryBox({
  name,
  sets,
  onClick,
}: {
  name: string
  sets: SetWithExercise[]
  onClick: () => void
}) {
  const topSet = sets.reduce((max, s) => (s.weight > max.weight ? s : max), sets[0])

  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-slate-900 p-3 text-left shadow-lg shadow-black/20 ring-1 ring-white/5 transition hover:ring-emerald-500/30"
    >
      <p className="mb-1 truncate text-sm font-medium text-white">{name}</p>
      <p className="text-xs text-slate-400">
        S{sets.length} · R{topSet.reps} · {topSet.weight}kg
      </p>
    </button>
  )
}
