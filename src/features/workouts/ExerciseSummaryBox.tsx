import { useUserSettings } from '../../hooks/useUserSettings'
import type { SetWithExercise } from '../../hooks/useWorkouts'
import { formatWeight } from '../../lib/units'

export function ExerciseSummaryBox({
  name,
  sets,
  onClick,
  onOpenDetail,
  supersetLabel,
  planned,
}: {
  name: string
  sets: SetWithExercise[]
  onClick: () => void
  onOpenDetail?: () => void
  /** e.g. "A" - when set, this exercise's sets belong to a superset and get a distinct tint/badge. */
  supersetLabel?: string
  /** Sets still planned for it (from a started preset). */
  planned?: number
}) {
  const { data: settings } = useUserSettings()
  const topSet = sets.reduce<SetWithExercise | undefined>((max, s) => (!max || s.weight > max.weight ? s : max), undefined)

  const working = sets.filter((s) => !s.is_warmup).length
  // Bodyweight work (and a template not filled in yet) has no weight: the best set is the most reps.
  const best = !topSet
    ? null
    : topSet.weight > 0
      ? `${formatWeight(topSet.weight, settings?.unit_system)} × ${topSet.reps}`
      : `${Math.max(...sets.map((s) => s.reps))} reps`

  // A row in the day's exercise list (the list is one card; rows are divided, not separate cards).
  return (
    <div className={`relative flex items-center ${supersetLabel ? 'border-l-2 border-emerald-500/60' : ''}`}>
      <button onClick={onClick} className="min-w-0 flex-1 py-3 pl-4 pr-2 text-left transition active:bg-white/5">
        {supersetLabel && <p className="eyebrow mb-0.5 text-emerald-400">Superset {supersetLabel}</p>}
        <p className="break-words text-[15px] font-semibold leading-snug text-white">{name}</p>
        <p className="mt-0.5 text-sm text-slate-400">
          {best ? (
            <>
              {working || sets.length} {(working || sets.length) === 1 ? 'set' : 'sets'} · best {best}
              {planned ? <span className="text-emerald-400"> · {planned} to go</span> : null}
            </>
          ) : (
            <span className="text-emerald-400">
              {planned} {planned === 1 ? 'set' : 'sets'} planned
            </span>
          )}
        </p>
      </button>
      {onOpenDetail && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onOpenDetail()
          }}
          aria-label="View progress"
          className="mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-white/5 hover:text-emerald-400"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 17 9 11 13 15 21 7" />
            <polyline points="14 7 21 7 21 14" />
          </svg>
        </button>
      )}
    </div>
  )
}
