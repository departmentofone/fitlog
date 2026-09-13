import { useState } from 'react'
import { dailyTotals, useCreateMeal, useMealsForDate } from '../../hooks/useMeals'
import { todayISO } from '../../hooks/useWorkouts'
import { MealCard } from './MealCard'
import { TrendsChart } from './TrendsChart'

const MEAL_PRESETS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export function MealsTab() {
  const [date, setDate] = useState(todayISO())
  const { data: meals = [], isLoading } = useMealsForDate(date)
  const createMeal = useCreateMeal()
  const [showTrends, setShowTrends] = useState(false)

  const totals = dailyTotals(meals)
  const usedNames = new Set(meals.map((m) => m.name))
  const nextPreset = MEAL_PRESETS.find((p) => !usedNames.has(p)) ?? 'Meal'

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
        />
        <button
          onClick={() => setShowTrends((v) => !v)}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            showTrends ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Trends
        </button>
      </div>

      {showTrends && <TrendsChart />}

      <div className="rounded-xl bg-slate-900 p-4">
        <h3 className="mb-2 text-sm font-medium text-slate-300">Today's totals</h3>
        <p className="text-2xl font-semibold text-white">{Math.round(totals.calories)} kcal</p>
        <p className="mt-1 text-sm text-slate-400">
          P {Math.round(totals.protein)}g · C {Math.round(totals.carbs)}g · F {Math.round(totals.fat)}g
        </p>
      </div>

      {isLoading && <p className="text-slate-400">Loading…</p>}

      {meals.map((meal) => (
        <MealCard key={meal.id} meal={meal} />
      ))}

      <button
        onClick={() => createMeal.mutate({ date, name: nextPreset })}
        disabled={createMeal.isPending}
        className="w-full rounded-xl border border-dashed border-slate-700 py-3 font-medium text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
      >
        + Add {nextPreset.toLowerCase()}
      </button>
    </div>
  )
}
