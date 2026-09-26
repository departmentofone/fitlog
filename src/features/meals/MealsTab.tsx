import { formatWhole } from '../../lib/number'
import { useEffect, useState } from 'react'
import { CopyDayButton } from '../../components/CopyDayButton'
import { DateNav } from '../../components/DateNav'
import { CircularProgress } from '../../components/CircularProgress'
import { MacroLine } from '../../components/MacroLine'
import { SkeletonCard } from '../../components/Skeleton'
import { useToast } from '../../components/ToastProvider'
import { remainingCaloriesInfo } from '../../hooks/useDiet'
import { useCopyMealsDay, dailyTotals, useCreateMeal, useMealsForDate } from '../../hooks/useMeals'
import { useUserSettings } from '../../hooks/useUserSettings'
import { todayISO } from '../../hooks/useWorkouts'
import { NutritionBreakdownModal } from '../nutrition/NutritionBreakdownModal'
import { MealCard } from './MealCard'
import { MealPresetsView } from './MealPresetsView'
import { RecipeBuilderView } from './RecipeBuilder'
import { TrendsChart } from './TrendsChart'
import { WaterWidget } from './WaterWidget'

const MEAL_PRESETS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const TONE_CLASSES = { good: 'text-emerald-400', warn: 'text-red-400', neutral: 'text-blue-400' } as const

export function MealsTab({ quickAction, onOpenDiet }: { quickAction?: number; onOpenDiet: () => void }) {
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
  const { data: settings } = useUserSettings()
  const calorieGoal = settings?.calorie_goal ?? null
  const goalInfo = calorieGoal != null ? remainingCaloriesInfo(totals.calories, calorieGoal, settings?.diet_goal ?? 'deficit') : null
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

      {/* Totals first: the day's number, measured against the goal set in Diet, is what you open
          this tab to see. Tapping it opens the full nutrient breakdown. */}
      <div className="card-hero p-4">
        <button onClick={() => setShowBreakdown(true)} className="flex w-full items-center gap-4 text-left">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-slate-300">{date === todayISO() ? 'Eaten today' : 'Eaten'}</h3>
            <p className="mt-1 text-3xl font-bold tracking-tight text-white">
              {formatWhole(totals.calories)}
              <span className="ml-1 text-base font-medium text-slate-400">
                {calorieGoal != null ? `/ ${formatWhole(calorieGoal)} kcal` : 'kcal'}
              </span>
            </p>
            {goalInfo && <p className={`mt-0.5 text-sm font-medium ${TONE_CLASSES[goalInfo.tone]}`}>{goalInfo.text}</p>}
            <MacroLine macros={totals} className="mt-2 text-sm" />
          </div>
          {calorieGoal != null ? (
            <CircularProgress percent={(totals.calories / calorieGoal) * 100} tone={goalInfo?.tone ?? 'good'} />
          ) : (
            <span aria-hidden="true" className="text-xl text-slate-500">›</span>
          )}
        </button>
        {calorieGoal == null && (
          <button onClick={onOpenDiet} className="mt-3 min-h-11 w-full border-t border-white/5 pt-2 text-left text-sm font-semibold text-emerald-400">
            Set a daily calorie target ›
          </button>
        )}
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
        className="btn btn-secondary min-h-12 w-full"
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
