import { useState } from 'react'
import { useAddWater, useTodayWater } from '../../hooks/useWaterLog'
import { useUpdateSettings, useUserSettings } from '../../hooks/useUserSettings'
import { parseDecimal } from '../../lib/number'

/** One decimal, trailing zero trimmed, so the amount and the goal read consistently: "0.3 / 4 L". */
function formatLitres(ml: number): string {
  return (Math.round(ml / 100) / 10).toString()
}

/**
 * Slim one-row water tracker: amount + progress on the left, quick-add on the right. It's tapped
 * several times a day, so it sits near the top of Meals - but as a strip, not a full card that
 * pushed the day's meals down.
 */
export function WaterWidget() {
  const { data: settings } = useUserSettings()
  const updateSettings = useUpdateSettings()
  const { data: mlToday = 0 } = useTodayWater()
  const addWater = useAddWater()

  const [editingGoal, setEditingGoal] = useState(false)
  const [goalDraft, setGoalDraft] = useState('')

  const goal = settings?.water_goal_ml ?? 2000
  const pct = Math.min(100, (mlToday / goal) * 100)
  const quickClass =
    'flex h-10 items-center justify-center rounded-xl bg-blue-500/15 px-3 text-sm font-semibold text-blue-400 active:bg-blue-500/25'

  if (editingGoal) {
    return (
      <div className="rounded-2xl border-t border-white/10 bg-slate-900 p-3 ring-1 ring-white/5">
        <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="water-goal">
          Daily water goal (litres)
        </label>
        <div className="flex gap-2">
          <input
            id="water-goal"
            type="text"
            inputMode="decimal"
            autoFocus
            value={goalDraft}
            onChange={(e) => setGoalDraft(e.target.value)}
            className="h-11 min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 text-white focus:border-emerald-500 focus:outline-none"
          />
          <button onClick={() => setEditingGoal(false)} className="h-11 rounded-xl px-3 text-sm text-slate-400">
            Cancel
          </button>
          <button
            onClick={() => {
              const litres = parseDecimal(goalDraft)
              if (Number.isFinite(litres) && litres > 0) updateSettings.mutate({ water_goal_ml: litres * 1000 })
              setEditingGoal(false)
            }}
            className="h-11 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-on-accent"
          >
            Save
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border-t border-white/10 bg-slate-900 py-2.5 pl-3 pr-2.5 ring-1 ring-white/5">
      <button
        type="button"
        onClick={() => {
          setGoalDraft(formatLitres(goal))
          setEditingGoal(true)
        }}
        aria-label={`Water: ${formatLitres(mlToday)} of ${formatLitres(goal)} litres. Change daily goal`}
        className="min-w-0 flex-1 text-left"
      >
        <span className="flex items-center gap-1.5 text-sm">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-blue-400" fill="currentColor" aria-hidden="true">
            <path d="M12 2.5c-3.3 4.2-7 8.4-7 12.2a7 7 0 0 0 14 0c0-3.8-3.7-8-7-12.2z" />
          </svg>
          <span className="font-semibold text-white">{formatLitres(mlToday)}</span>
          <span className="text-slate-400">/ {formatLitres(goal)} L</span>
        </span>
        <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <span className="block h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
        </span>
      </button>
      <button
        type="button"
        onClick={() => addWater.mutate(-250)}
        disabled={mlToday <= 0}
        aria-label="Remove 250 ml"
        className="flex h-10 w-8 items-center justify-center rounded-xl text-lg text-slate-500 disabled:opacity-30"
      >
        −
      </button>
      <button type="button" onClick={() => addWater.mutate(250)} className={quickClass}>
        +250
      </button>
      <button type="button" onClick={() => addWater.mutate(500)} className={quickClass}>
        +500
      </button>
    </div>
  )
}
