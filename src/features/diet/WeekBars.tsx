import { remainingCaloriesInfo } from '../../hooks/useDiet'
import { useMacroTrend } from '../../hooks/useMeals'
import { formatWhole } from '../../lib/number'
import type { DietGoal } from '../../types'

const BAR_TONE: Record<string, string> = {
  good: 'bg-emerald-400',
  warn: 'bg-amber-400',
  neutral: 'bg-slate-500',
}

/**
 * The last 7 days' calories as bars against the goal (the dashed line): green on target, amber
 * over a deficit or short of a surplus by the same rule as "kcal left today", grey for under. Days
 * with nothing logged stay empty rather than reading as a zero-calorie day.
 */
export function WeekBars({ goal, type }: { goal: number; type: DietGoal }) {
  const { data: points = [] } = useMacroTrend(7)
  if (points.length === 0) return null
  const top = Math.max(goal * 1.25, ...points.map((p) => p.calories))
  const logged = points.filter((p) => p.calories > 0)
  const onTarget = logged.filter((p) => remainingCaloriesInfo(p.calories, goal, type).tone === 'good').length
  const average = logged.length > 0 ? logged.reduce((sum, p) => sum + p.calories, 0) / logged.length : 0

  return (
    <div>
      <div
        className="relative flex h-24 items-end gap-1.5"
        role="img"
        aria-label={`Last 7 days: on target on ${onTarget} of ${logged.length} logged days, ${formatWhole(average)} kcal a day on average`}
      >
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-slate-400/60"
          style={{ bottom: `${(goal / top) * 100}%` }}
        />
        {points.map((p) => {
          const tone = p.calories > 0 ? remainingCaloriesInfo(p.calories, goal, type).tone : null
          return (
            <div key={p.date} className="flex h-full flex-1 flex-col justify-end">
              <div
                className={`w-full rounded-t-md ${tone ? BAR_TONE[tone] : 'bg-slate-700/60'}`}
                style={{ height: tone ? `${Math.max(4, (p.calories / top) * 100)}%` : '3px' }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex gap-1.5">
        {points.map((p) => (
          <span key={p.date} className="flex-1 text-center text-[11px] text-slate-500">
            {new Date(p.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'narrow' })}
          </span>
        ))}
      </div>
      {logged.length > 0 && (
        <p className="mt-2 text-xs text-slate-400">
          On target on <span className="font-semibold text-white">{onTarget} of {logged.length}</span> logged{' '}
          {logged.length === 1 ? 'day' : 'days'} · {formatWhole(average)} kcal a day on average
        </p>
      )}
    </div>
  )
}
