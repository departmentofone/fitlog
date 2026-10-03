import { useEffect, useState } from 'react'
import { useToast } from '../../components/ToastProvider'
import { useAddMealItem, useCreateMeal, useMealsForDate } from '../../hooks/useMeals'
import { todayISO } from '../../hooks/useWorkouts'
import { haptics } from '../../lib/haptics'
import { parseDecimal } from '../../lib/number'
import { clearLanding, peekLanding } from '../../lib/landing'
import type { Food } from '../../types'

const DEFAULT_MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

/** The meal you're most likely eating now, going by the clock. */
function mealForNow(): string {
  const h = new Date().getHours()
  if (h < 11) return 'Breakfast'
  if (h < 16) return 'Lunch'
  if (h < 21) return 'Dinner'
  return 'Snack'
}

/**
 * After a scanned food is saved: log some of it into one of today's meals right away, instead of
 * going back to Meals and searching for what was just scanned.
 */
export function LogScannedFood({ food, onDone }: { food: Food; onDone: () => void }) {
  const today = todayISO()
  const { data: meals = [] } = useMealsForDate(today)
  const createMeal = useCreateMeal()
  const addItem = useAddMealItem()
  const { show } = useToast()
  const [grams, setGrams] = useState('100')
  const names = [...new Set([...meals.map((m) => m.name), ...DEFAULT_MEALS])]
  // The meal Scan was tapped from, if it came from a meal's Add food; otherwise by the clock.
  const [meal, setMeal] = useState(() => peekLanding('scanMeal') ?? mealForNow())
  useEffect(() => clearLanding('scanMeal'), [])
  const busy = createMeal.isPending || addItem.isPending

  async function log() {
    const g = parseDecimal(grams)
    if (!Number.isFinite(g) || g <= 0) return
    try {
      const mealId = meals.find((m) => m.name === meal)?.id ?? (await createMeal.mutateAsync({ date: today, name: meal })).id
      await addItem.mutateAsync({ mealId, foodId: food.id, grams: g })
      haptics.success()
      show(`Logged ${Math.round(g)} g of ${food.name} to ${meal}.`)
      onDone()
    } catch {
      show("Couldn't log it. Try again from Meals.", { tone: 'error' })
    }
  }

  const kcal = Math.round((food.calories_per_100g * (parseDecimal(grams) || 0)) / 100)

  return (
    <div className="card p-4">
      <h2 className="card-title">Log it now?</h2>
      <p className="mt-1 text-sm text-slate-400">
        {food.name} is in your food library. Add some to today's log too:
      </p>

      <div className="mt-3 flex items-center gap-2">
        <label className="relative w-32 shrink-0">
          <span className="sr-only">Amount in grams</span>
          <input
            type="text"
            inputMode="decimal"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            className="h-11 w-full field px-3 pr-8 text-center font-semibold tabular-nums"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">g</span>
        </label>
        <p className="text-sm text-slate-400">
          <span className="font-semibold text-white">{kcal.toLocaleString()}</span> kcal
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Meal">
        {names.map((name) => (
          <button
            key={name}
            onClick={() => setMeal(name)}
            aria-pressed={meal === name}
            className={`min-h-9 rounded-full px-3.5 text-sm font-medium transition ${
              meal === name ? 'bg-emerald-600 text-on-accent' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={onDone} className="btn btn-secondary flex-1 text-sm">
          Not now
        </button>
        <button onClick={() => void log()} disabled={busy} className="btn btn-primary flex-1 text-sm">
          {busy ? 'Logging…' : `Log to ${meal}`}
        </button>
      </div>
    </div>
  )
}
