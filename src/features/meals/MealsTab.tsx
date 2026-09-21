import { useEffect, useState } from 'react'
import { CopyDayButton } from '../../components/CopyDayButton'
import { DateNav } from '../../components/DateNav'
import { MacroLine } from '../../components/MacroLine'
import { SkeletonCard } from '../../components/Skeleton'
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

export function MealsTab({ quickAction }: { quickAction?: number }) {
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
  const [pendingAdd, setPendingAdd] = useState(false)

  // Quick-add "Log a meal": switch to today, then add the next meal once today's list has loaded
  // (so the Breakfast/Lunch/... name is picked from the right day) and scroll the new card in.
  useEffect(() => {
    if (quickAction == null) return
    setDate(todayISO())
    setShowPresets(false)
    setShowRecipes(false)
    setPendingAdd(true)
  }, [quickAction])

  useEffect(() => {
    if (!pendingAdd || date !== todayISO() || isLoading) return
    setPendingAdd(false)
    createMeal.mutate(
      { date, name: nextPreset },
      {
        onSuccess: () =>
          requestAnimationFrame(() =>
            document.getElementById('meals-add')?.scrollIntoView({ behavior: 'smooth', block: 'end' }),
          ),
      },
    )
  }, [pendingAdd, date, isLoading, nextPreset, createMeal])

  if (showPresets) {
    return <MealPresetsView date={date} currentMeals={meals} onBack={() => setShowPresets(false)} onLoaded={() => setShowPresets(false)} />
  }
  if (showRecipes) return <RecipeBuilderView date={date} currentMeals={meals} onBack={() => setShowRecipes(false)} />

  return (
    <div className="space-y-4 p-4">
      <DateNav date={date} max={todayISO()} onChange={setDate} />

      {/* Totals first: the day's number is what you open this tab to see. */}
      <div
        onClick={() => setShowBreakdown(true)}
        className="cursor-pointer rounded-3xl bg-gradient-to-br from-emerald-600/20 to-slate-900 p-4 shadow-[var(--glow-shadow)] ring-1 ring-white/5 transition hover:ring-emerald-500/30"
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-300">{date === todayISO() ? "Today's totals" : 'Totals'}</h3>
          <span className="text-xs text-slate-500">Tap for breakdown</span>
        </div>
        <p className="text-2xl font-bold text-emerald-400">{Math.round(totals.calories)} kcal</p>
        <MacroLine macros={totals} className="mt-1 text-sm" />
      </div>

      {/* Water is logged for today only, so it's hidden when looking back at another day. */}
      {date === todayISO() && <WaterWidget />}

      {isLoading && <SkeletonCard lines={2} />}

      {meals.map((meal) => (
        <MealCard key={meal.id} meal={meal} />
      ))}

      <button
        id="meals-add"
        onClick={() => createMeal.mutate({ date, name: nextPreset })}
        disabled={createMeal.isPending}
        className="w-full rounded-2xl border border-dashed border-slate-700 py-3 font-medium text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
      >
        + Add {nextPreset.toLowerCase()}
      </button>

      {/* Other ways to fill the day, and the look-back view - one quiet row instead of a 2x2 grid above
          everything. */}
      <div className="flex gap-2">
        <button onClick={() => setShowPresets(true)} className="min-h-9 flex-1 rounded-xl px-2 text-xs font-medium transition bg-slate-800/60 text-slate-400 active:bg-slate-700">
          Presets
        </button>
        <button onClick={() => setShowRecipes(true)} className="min-h-9 flex-1 rounded-xl px-2 text-xs font-medium transition bg-slate-800/60 text-slate-400 active:bg-slate-700">
          Recipes
        </button>
        <CopyDayButton
          disabled={meals.length === 0}
          onCopy={(targetDate) => {
            copyDay.mutate({ fromDate: date, toDate: targetDate })
            show(`Copying to ${targetDate}…`)
          }}
        />
        <button
          onClick={() => setShowTrends((v) => !v)}
          aria-pressed={showTrends}
          className={`min-h-9 flex-1 rounded-xl px-2 text-xs font-medium transition ${showTrends ? 'bg-emerald-600 text-on-accent' : 'bg-slate-800/60 text-slate-400 active:bg-slate-700'}`}
        >
          Trends
        </button>
      </div>

      {showTrends && <TrendsChart />}

      {showBreakdown && <NutritionBreakdownModal meals={meals} onClose={() => setShowBreakdown(false)} />}
    </div>
  )
}
