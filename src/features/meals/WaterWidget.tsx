import { useState } from 'react'
import { useAddWater, useTodayWater } from '../../hooks/useWaterLog'
import { useUpdateSettings, useUserSettings } from '../../hooks/useUserSettings'

export function WaterWidget() {
  const { data: settings } = useUserSettings()
  const updateSettings = useUpdateSettings()
  const { data: mlToday = 0 } = useTodayWater()
  const addWater = useAddWater()

  const [editingGoal, setEditingGoal] = useState(false)
  const [goalDraft, setGoalDraft] = useState('')

  const goal = settings?.water_goal_ml ?? 2000
  const pct = Math.min(100, (mlToday / goal) * 100)

  return (
    <div className="rounded-3xl bg-slate-900 border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      {editingGoal ? (
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-300">Water</h3>
        </div>
      ) : (
        <div
          onClick={() => {
            setGoalDraft((goal / 1000).toString())
            setEditingGoal(true)
          }}
          className="mb-3 -m-1 cursor-pointer rounded-2xl p-1 transition hover:bg-white/5"
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300">Water</h3>
            <span className="text-xs text-slate-500">Tap to edit goal</span>
          </div>
          <p className="mb-2 text-2xl font-bold text-blue-400">
            {(mlToday / 1000).toFixed(2)} <span className="text-sm font-medium text-slate-400">/ {(goal / 1000).toFixed(1)} L</span>
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {editingGoal ? (
        <div className="flex gap-2">
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder="Liters/day"
            value={goalDraft}
            onChange={(e) => setGoalDraft(e.target.value)}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={() => {
              const liters = parseFloat(goalDraft)
              if (!Number.isNaN(liters) && liters > 0) updateSettings.mutate({ water_goal_ml: liters * 1000 })
              setEditingGoal(false)
            }}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-on-accent hover:brightness-90"
          >
            Save
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => addWater.mutate(250)}
            className="flex-1 rounded-xl bg-slate-800 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
          >
            + 250ml
          </button>
          <button
            onClick={() => addWater.mutate(500)}
            className="flex-1 rounded-xl bg-slate-800 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
          >
            + 500ml
          </button>
          <button
            onClick={() => addWater.mutate(-250)}
            disabled={mlToday <= 0}
            className="rounded-xl bg-slate-800 px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-700 disabled:opacity-30"
          >
            −
          </button>
        </div>
      )}
    </div>
  )
}
