import { useState } from 'react'
import { CopyDayButton } from '../../components/CopyDayButton'
import { DateNav } from '../../components/DateNav'
import { MacroLine } from '../../components/MacroLine'
import { useToast } from '../../components/ToastProvider'
import { useCopyMealsDay, dailyTotals, useCreateMeal, useMealsForDate } from '../../hooks/useMeals'
import { todayISO } from '../../hooks/useWorkouts'
import { NutritionBreakdownModal } from '../nutrition/NutritionBreakdownModal'
import { MealCard } from './MealCard'
import { MealPresetsView } from './MealPresetsView'
import { RecipeBuilderView } from './RecipeBuilder'
import { TrendsChart } from './TrendsChart'
import { WaterWidget } from './WaterWidget'

const MEAL_PRESETS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export function MealsTab() {
  const [date, setDate] = useState(todayISO())
  const { data: meals = [], isLoading } = useMealsForDate(date)
  const createMeal = useCreateMeal()
  const copyDay = useCopyMealsDay()
  const { show } = useToast()
  const [showTrends, setShowTrends] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [showRecipes, setShowRecipes] = useState(false)

  const totals = dailyTotals(meals)
  const usedNames = new Set(meals.map((m) => m.name))
  const nextPreset = MEAL_PRESETS.find((p) => !usedNames.has(p)) ?? 'Meal'

  if (showPresets) {
    return <MealPresetsView date={date} currentMeals={meals} onBack={() => setShowPresets(false)} onLoaded={() => setShowPresets(false)} />
  }
  if (showRecipes) return <RecipeBuilderView date={date} currentMeals={meals} onBack={() => setShowRecipes(false)} />

  return (
    <div className="space-y-4 p-4">
      <DateNav date={date} max={todayISO()} onChange={setDate} />

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowTrends((v) => !v)}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            showTrends ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Trends
        </button>
        <button
          onClick={() => setShowPresets(true)}
          className="flex-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700"
        >
          📋 Presets
        </button>
        <button
          onClick={() => setShowRecipes(true)}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700"
        >
          🍳 Recipes
        </button>
        <CopyDayButton
          disabled={meals.length === 0}
          onCopy={(targetDate) => {
            copyDay.mutate({ fromDate: date, toDate: targetDate })
            show(`Copying to ${targetDate}…`)
          }}
        />
      </div>

      {showTrends && <TrendsChart />}

      <WaterWidget />

      <div
        onClick={() => setShowBreakdown(true)}
        className="cursor-pointer rounded-2xl bg-gradient-to-br from-emerald-600/20 to-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5 transition hover:ring-emerald-500/30"
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-300">Today's totals</h3>
          <span className="text-xs text-slate-500">Tap for breakdown</span>
        </div>
        <p className="text-2xl font-bold text-emerald-400">{Math.round(totals.calories)} kcal</p>
        <MacroLine macros={totals} className="mt-1 text-sm" />
      </div>

      {isLoading && <p className="text-slate-400">Loading…</p>}

      {meals.map((meal) => (
        <MealCard key={meal.id} meal={meal} />
      ))}

      <button
        onClick={() => createMeal.mutate({ date, name: nextPreset })}
        disabled={createMeal.isPending}
        className="w-full rounded-xl border border-dashed border-slate-700 py-3 font-medium text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
      >
        + Add {nextPreset.toLowerCase()}
      </button>

      {showBreakdown && <NutritionBreakdownModal meals={meals} onClose={() => setShowBreakdown(false)} />}
    </div>
  )
}
