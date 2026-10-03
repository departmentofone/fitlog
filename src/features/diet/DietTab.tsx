import { parseDecimal, formatWhole } from '../../lib/number'
import { useState } from 'react'
import { CountUp } from '../../components/CountUp'
import { FireStreak } from '../../components/FireStreak'
import { MacroLine } from '../../components/MacroLine'
import { remainingCaloriesInfo, useDietStreak } from '../../hooks/useDiet'
import { dailyMicroTotals, dailyTotals, useMealsForDate } from '../../hooks/useMeals'
import { useUpdateSettings, useUserSettings } from '../../hooks/useUserSettings'
import { todayISO } from '../../hooks/useWorkouts'
import type { DietGoal } from '../../types'
import { MicroDashboard } from '../nutrition/MicroDashboard'
import { NutritionBreakdownModal } from '../nutrition/NutritionBreakdownModal'
import { AlcoholSection } from './AlcoholSection'
import { GoalProjectionChart } from './GoalProjectionChart'
import { WeekBars } from './WeekBars'

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

export function DietTab({ onOpenCalculator }: { onOpenCalculator: () => void }) {
  const { data: settings } = useUserSettings()
  const updateSettings = useUpdateSettings()
  const { data: meals = [] } = useMealsForDate(todayISO())
  const totals = dailyTotals(meals)
  const micros = dailyMicroTotals(meals)

  const dietGoal = settings?.diet_goal ?? 'deficit'
  const calorieGoal = settings?.calorie_goal ?? null
  const streak = useDietStreak(calorieGoal, dietGoal)

  const [editing, setEditing] = useState(false)
  const [goalDraft, setGoalDraft] = useState(dietGoal)
  const [calorieDraft, setCalorieDraft] = useState(calorieGoal != null ? String(calorieGoal) : '')
  const proteinGoal = settings?.protein_goal ?? null
  const [proteinDraft, setProteinDraft] = useState(proteinGoal != null ? String(proteinGoal) : '')
  const [showBreakdown, setShowBreakdown] = useState(false)

  function startEditing() {
    setGoalDraft(dietGoal)
    setCalorieDraft(calorieGoal != null ? String(calorieGoal) : '')
    setProteinDraft(proteinGoal != null ? String(proteinGoal) : '')
    setEditing(true)
  }

  function save() {
    const parsed = parseDecimal(calorieDraft)
    // 0 (or a negative) is not a goal - storing it divided by zero on the progress ring.
    const calorie_goal = Number.isFinite(parsed) && parsed > 0 ? parsed : null
    const protein = parseDecimal(proteinDraft)
    const protein_goal = Number.isFinite(protein) && protein > 0 ? Math.round(protein) : null
    // protein_goal only goes along when there is one: before migration_v36 the column doesn't exist,
    // and sending it would fail the whole save.
    updateSettings.mutate({ diet_goal: goalDraft, calorie_goal, ...(protein_goal != null || proteinGoal != null ? { protein_goal } : {}) })
    setEditing(false)
  }

  const info = calorieGoal != null ? remainingCaloriesInfo(totals.calories, calorieGoal, dietGoal) : null

  return (
    <div className="space-y-4 p-4">
      <div
        onClick={!editing ? startEditing : undefined}
        className={`rounded-3xl bg-gradient-to-br from-emerald-600/20 to-slate-900 p-4 shadow-lg shadow-black/20 shadow-[var(--glow-shadow)] ring-1 ring-white/5 transition ${
          !editing ? 'cursor-pointer hover:ring-emerald-500/30' : ''
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">Diet goal</h2>
          {!editing && (
            <div className="flex items-center gap-1">
              <FireStreak count={streak.data?.current ?? 0} label="day on-target streak" />
              {/* The card opens the editor on a tap; this is the keyboard-reachable way in. */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  startEditing()
                }}
                className="-my-2 -mr-2 min-h-11 px-2 text-xs font-medium text-emerald-400"
              >
                {calorieGoal == null ? 'Set' : 'Edit'}
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div onClick={(e) => e.stopPropagation()} className="space-y-3">
            <div className="grid grid-cols-3 gap-1.5">
              {GOAL_OPTIONS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGoalDraft(g.value)}
                  className={`rounded-xl px-2 py-1.5 text-xs font-medium transition ${
                    goalDraft === g.value ? 'bg-emerald-600 text-on-accent' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Daily calorie target"
              aria-label="Daily calorie target in kcal"
              value={calorieDraft}
              onChange={(e) => setCalorieDraft(e.target.value)}
              className="w-full field px-3 py-2"
            />
            <label className="relative block">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Daily protein target (optional)"
                aria-label="Daily protein target in grams"
                value={proteinDraft}
                onChange={(e) => setProteinDraft(e.target.value)}
                className="w-full field px-3 py-2 pr-8"
              />
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">g</span>
            </label>
            <button onClick={onOpenCalculator} className="-my-1 min-h-11 text-left text-xs font-medium text-emerald-400">
              Not sure? Work out your maintenance calories
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="btn btn-secondary flex-1 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="btn btn-primary flex-1 py-2 text-sm"
              >
                Save
              </button>
            </div>
          </div>
        ) : calorieGoal == null ? (
          <p className="text-sm text-slate-400">No calorie goal set yet. Tap here to set one, or work it out with the calculator below.</p>
        ) : (
          // Meals already shows today against the goal as a ring; here it's the goal itself and how the
          // last week went against it.
          <div>
            <p className="text-3xl font-bold text-white">
              {formatWhole(calorieGoal)} <span className="text-lg font-medium text-slate-400">kcal a day</span>
            </p>
            <p className="mb-3 text-xs text-slate-500">
              {dietGoal.charAt(0).toUpperCase() + dietGoal.slice(1)} target
              {proteinGoal != null && ` · ${proteinGoal} g protein`}
            </p>
            <WeekBars goal={calorieGoal} type={dietGoal} />
          </div>
        )}
        {!editing && (
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/5 pt-2.5">
            <div className="min-w-0 text-sm">
              <span className="text-slate-400">Today </span>
              <span className="font-semibold text-white">
                <CountUp value={totals.calories} /> kcal
              </span>
              {info && <span className={`text-xs font-medium ${TONE_CLASSES[info.tone]}`}> · {info.text.replace(/ today$/, '')}</span>}
              <MacroLine macros={totals} proteinGoal={proteinGoal} className="text-xs" />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowBreakdown(true)
              }}
              className="-mr-2 min-h-11 shrink-0 px-2 text-xs font-medium text-emerald-400"
            >
              Breakdown
            </button>
          </div>
        )}
      </div>

      {calorieGoal == null && (
        <button
          onClick={onOpenCalculator}
          className="flex min-h-12 w-full items-center justify-between gap-3 tile px-4 text-left text-sm"
        >
          <span>
            <span className="font-medium text-white">Not sure what target to set?</span>{' '}
            <span className="text-slate-400">Work out your maintenance calories.</span>
          </span>
          <span aria-hidden="true" className="text-lg text-slate-500">›</span>
        </button>
      )}

      <MicroDashboard micros={micros} />

      <GoalProjectionChart />

      <AlcoholSection />

      {showBreakdown && <NutritionBreakdownModal meals={meals} onClose={() => setShowBreakdown(false)} />}
    </div>
  )
}
