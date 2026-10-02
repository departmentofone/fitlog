import { useQuery } from '@tanstack/react-query'
import { FireStreak } from '../../components/FireStreak'
import { useBackToClose } from '../../hooks/useHashRoute'
import type { SetWithExercise } from '../../hooks/useWorkouts'
import { formatDurationLabel } from '../../lib/duration'
import { estimate1RM } from '../../lib/oneRepMax'
import { supabase } from '../../lib/supabase'
import { formatWeight, toDisplayTotal, weightUnitLabel } from '../../lib/units'
import { muscleLabel, type MuscleGroup, type UnitSystem } from '../../types'

interface TodayPr {
  name: string
  weight: number
  reps: number
}

/**
 * Each exercise's best estimated 1RM from sessions before this one, so the summary can say which
 * of today's lifts beat it. Warm-ups and bodyweight sets don't count, same as Awards.
 */
function usePriorBests(sessionId: string, sessionDate: string, exerciseIds: string[]) {
  return useQuery({
    queryKey: ['prior-bests', sessionId, exerciseIds.join(',')],
    enabled: exerciseIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sets')
        .select('exercise_id, weight, reps, is_warmup, session:workout_sessions!inner(date)')
        .in('exercise_id', exerciseIds)
        .lt('session.date', sessionDate)
      if (error) throw error
      type Row = { exercise_id: string; weight: number; reps: number; is_warmup: boolean | null }
      const best = new Map<string, number>()
      for (const r of (data as unknown as Row[]) ?? []) {
        if (r.is_warmup || r.weight <= 0 || r.reps < 1) continue
        best.set(r.exercise_id, Math.max(best.get(r.exercise_id) ?? 0, estimate1RM(r.weight, r.reps)))
      }
      return best
    },
  })
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-slate-800/60 px-3 py-2.5">
      <p className="text-lg font-bold tabular-nums text-white">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

/**
 * What the end of a workout shows: how long, how much, today's PRs and the muscles worked. Opened
 * by Finish on the session timer, so finishing is a moment rather than a clock turning grey.
 */
export function WorkoutSummarySheet({
  sessionId,
  sessionDate,
  durationSeconds,
  sets,
  streak,
  unit,
  onResume,
  onClose,
}: {
  sessionId: string
  sessionDate: string
  durationSeconds: number
  sets: SetWithExercise[]
  streak: number
  unit: UnitSystem | undefined
  onResume: () => void
  onClose: () => void
}) {
  useBackToClose(true, onClose)
  const working = sets.filter((s) => !s.is_warmup)
  const exerciseIds = [...new Set(working.map((s) => s.exercise_id))]
  const { data: priorBests } = usePriorBests(sessionId, sessionDate, exerciseIds)

  const volume = working.reduce((sum, s) => sum + s.weight * s.reps, 0)

  // A PR needs history to beat: a first-ever session of an exercise sets the baseline instead.
  const prs: TodayPr[] = []
  if (priorBests) {
    for (const id of exerciseIds) {
      const prior = priorBests.get(id) ?? 0
      if (prior <= 0) continue
      const top = working
        .filter((s) => s.exercise_id === id && s.weight > 0)
        .reduce<SetWithExercise | null>((best, s) => (!best || estimate1RM(s.weight, s.reps) > estimate1RM(best.weight, best.reps) ? s : best), null)
      if (top && estimate1RM(top.weight, top.reps) > prior) prs.push({ name: top.exercise?.name ?? 'Exercise', weight: top.weight, reps: top.reps })
    }
  }

  const muscles = new Map<MuscleGroup, number>()
  for (const s of working) if (s.exercise) muscles.set(s.exercise.muscle_group, (muscles.get(s.exercise.muscle_group) ?? 0) + 1)
  const topMuscles = [...muscles.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="fade-in absolute inset-0 bg-black/60" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="workout-summary-title"
        onClick={(e) => e.stopPropagation()}
        className="sheet-up relative max-h-[88%] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-slate-950 px-5 pt-2 pb-[max(1.25rem,var(--safe-area-inset-bottom,env(safe-area-inset-bottom)))] shadow-2xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-700" />
        <div className="flex items-start justify-between gap-3">
          <h2 id="workout-summary-title" className="text-xl font-bold tracking-tight text-white">
            Workout done
          </h2>
          <FireStreak count={streak} label="day streak" />
        </div>
        <p className="mt-1 text-sm text-slate-400">
          {new Date(sessionDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat value={formatDurationLabel(durationSeconds)} label="time" />
          <Stat value={`${Math.round(toDisplayTotal(volume, unit)).toLocaleString()} ${weightUnitLabel(unit)}`} label="moved" />
          <Stat value={String(working.length)} label={working.length === 1 ? 'working set' : 'working sets'} />
          <Stat value={String(exerciseIds.length)} label={exerciseIds.length === 1 ? 'exercise' : 'exercises'} />
        </div>

        {prs.length > 0 && (
          <div className="mt-4 rounded-2xl bg-emerald-500/10 p-3.5 ring-1 ring-emerald-500/25">
            <p className="text-sm font-semibold text-emerald-400">
              {prs.length === 1 ? 'New personal record' : `${prs.length} new personal records`}
            </p>
            <ul className="mt-1.5 space-y-1">
              {prs.map((pr) => (
                <li key={pr.name} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 text-slate-200">{pr.name}</span>
                  <span className="shrink-0 tabular-nums text-slate-400">
                    {formatWeight(pr.weight, unit)} × {pr.reps}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {topMuscles.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-slate-400">Worked today</p>
            <div className="flex flex-wrap gap-1.5">
              {topMuscles.map(([group, count]) => (
                <span key={group} className="chip chip-neutral py-1">
                  {muscleLabel(group)} <span className="text-slate-500">{count} {count === 1 ? 'set' : 'sets'}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <button onClick={onClose} className="btn btn-primary mt-5 min-h-12 w-full">
          Done
        </button>
        <button onClick={onResume} className="mt-1 min-h-11 w-full text-sm font-medium text-slate-400">
          Not finished? Resume the timer
        </button>
      </div>
    </div>
  )
}
