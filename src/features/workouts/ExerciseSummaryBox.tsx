import type { SetWithExercise } from '../../hooks/useWorkouts'

export function ExerciseSummaryBox({
  name,
  sets,
  onClick,
  onOpenDetail,
}: {
  name: string
  sets: SetWithExercise[]
  onClick: () => void
  onOpenDetail?: () => void
}) {
  const topSet = sets.reduce((max, s) => (s.weight > max.weight ? s : max), sets[0])

  return (
    <div className="relative rounded-xl bg-slate-900 shadow-lg shadow-black/20 ring-1 ring-white/5 transition hover:ring-emerald-500/30">
      <button onClick={onClick} className="w-full p-3 text-left">
        <p className="mb-1 truncate pr-6 text-sm font-medium text-white">{name}</p>
        <p className="text-xs text-slate-400">
          S{sets.length} · R{topSet.reps} · {topSet.weight}kg
        </p>
      </button>
      {onOpenDetail && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onOpenDetail()
          }}
          aria-label="View progress"
          className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full text-slate-500 hover:bg-white/5 hover:text-emerald-400"
        >
          📈
        </button>
      )}
    </div>
  )
}
