import type { SetWithExercise } from '../../hooks/useWorkouts'

export function ExerciseSummaryBox({
  name,
  sets,
  onClick,
  onOpenDetail,
  supersetLabel,
}: {
  name: string
  sets: SetWithExercise[]
  onClick: () => void
  onOpenDetail?: () => void
  /** e.g. "A" - when set, this exercise's sets belong to a superset and get a distinct tint/badge. */
  supersetLabel?: string
}) {
  const topSet = sets.reduce((max, s) => (s.weight > max.weight ? s : max), sets[0])

  return (
    <div
      className={`relative rounded-2xl bg-slate-900 border-t shadow-lg shadow-black/20 ring-1 transition hover:ring-emerald-500/30 ${
        supersetLabel ? 'border-emerald-500/40 ring-emerald-500/20' : 'border-white/10 ring-white/5'
      }`}
    >
      <button onClick={onClick} className="w-full p-3 text-left">
        {supersetLabel && (
          <p className="mb-1 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
            Superset {supersetLabel}
          </p>
        )}
        {/* Two lines, not one: in the two-column grid a single line cut most names to "Dumbbell Lat…". */}
        <p className="mb-1 line-clamp-2 break-words pr-7 text-sm font-medium leading-snug text-white">{name}</p>
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
          className="absolute top-0 right-0 flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-white/5 hover:text-emerald-400"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 17 9 11 13 15 21 7" />
            <polyline points="14 7 21 7 21 14" />
          </svg>
        </button>
      )}
    </div>
  )
}
