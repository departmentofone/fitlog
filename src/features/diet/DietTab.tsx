import { useState } from 'react'
import { FireStreak } from '../../components/FireStreak'
import { MacroLine } from '../../components/MacroLine'
import { remainingCaloriesInfo, useDietStreak } from '../../hooks/useDiet'
import { dailyTotals, useMealsForDate } from '../../hooks/useMeals'
import { useUpdateSettings, useUserSettings } from '../../hooks/useUserSettings'
import { todayISO } from '../../hooks/useWorkouts'
import type { DietGoal } from '../../types'

const GOAL_OPTIONS: { value: DietGoal; label: string }[] = [
  { value: 'deficit', label: 'Deficit' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'surplus', label: 'Surplus' },
]

const TONE_CLASSES: Record<string, string> = {
  good: 'text-emerald-400',
  warn: 'text-red-400',
  neutral: 'text-blue-400',
}

export function DietTab() {
  const { data: settings } = useUserSettings()
  const updateSettings = useUpdateSettings()
  const { data: meals = [] } = useMealsForDate(todayISO())
  const totals = dailyTotals(meals)

  const dietGoal = settings?.diet_goal ?? 'deficit'
  const calorieGoal = settings?.calorie_goal ?? null
  const streak = useDietStreak(calorieGoal, dietGoal)

  const [editing, setEditing] = useState(false)
  const [goalDraft, setGoalDraft] = useState(dietGoal)
  const [calorieDraft, setCalorieDraft] = useState(calorieGoal != null ? String(calorieGoal) : '')

  function startEditing() {
    setGoalDraft(dietGoal)
    setCalorieDraft(calorieGoal != null ? String(calorieGoal) : '')
    setEditing(true)
  }

  function save() {
    const parsed = parseFloat(calorieDraft)
    updateSettings.mutate({ diet_goal: goalDraft, calorie_goal: Number.isNaN(parsed) ? null : parsed })
    setEditing(false)
  }

  const info = calorieGoal != null ? remainingCaloriesInfo(totals.calories, calorieGoal, dietGoal) : null

  return (
    <div className="space-y-4 p-4">
      <FireStreak count={streak.data?.current ?? 0} label="on-target streak" />

      <div className="rounded-2xl bg-gradient-to-br from-emerald-600/20 to-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">Diet goal</h2>
          {!editing && (
            <button onClick={startEditing} className="text-xs text-slate-400 hover:text-slate-200">
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-1.5">
              {GOAL_OPTIONS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGoalDraft(g.value)}
                  className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                    goalDraft === g.value ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Daily calorie target"
              value={calorieDraft}
              onChange={(e) => setCalorieDraft(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 rounded-lg bg-slate-800 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Save
              </button>
            </div>
          </div>
        ) : calorieGoal == null ? (
          <p className="text-sm text-slate-400">No calorie goal set yet — tap Edit to set one.</p>
        ) : (
          <>
            <p className="text-3xl font-bold text-white">
              {calorieGoal} <span className="text-lg font-medium text-slate-400">kcal</span>
            </p>
            <p className="mb-3 text-xs capitalize text-slate-500">{dietGoal} target</p>
            {info && <p className={`text-sm font-medium ${TONE_CLASSES[info.tone]}`}>{info.text}</p>}
          </>
        )}
      </div>

      <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h3 className="mb-2 text-sm font-medium text-slate-300">Consumed today</h3>
        <p className="text-2xl font-bold text-emerald-400">{Math.round(totals.calories)} kcal</p>
        <MacroLine macros={totals} className="mt-1 text-sm" />
      </div>
    </div>
  )
}
