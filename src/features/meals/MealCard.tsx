import { useState } from 'react'
import { MacroLine } from '../../components/MacroLine'
import { SwipeToDelete } from '../../components/SwipeToDelete'
import { useToast } from '../../components/ToastProvider'
import { useAddMealItem, useDeleteMealItem, useSetMealCompleted, type MealWithItems } from '../../hooks/useMeals'
import { haptics } from '../../lib/haptics'
import { macrosForGrams, microsForGrams, sumMacros, sumMicros } from '../../types'
import { FoodPicker } from './FoodPicker'

export function MealCard({ meal }: { meal: MealWithItems }) {
  const [adding, setAdding] = useState(false)
  const addItem = useAddMealItem()
  const deleteItem = useDeleteMealItem()
  const setCompleted = useSetMealCompleted()
  const { undoable } = useToast()

  const totals = sumMacros(meal.meal_items.map((i) => macrosForGrams(i.food, i.grams)))
  const micros = sumMicros(meal.meal_items.map((i) => microsForGrams(i.food, i.grams)))

  if (meal.completed) {
    return (
      <button
        onClick={() => setCompleted.mutate({ mealId: meal.id, completed: false })}
        className="w-full rounded-2xl bg-slate-900/70 backdrop-blur-xl border-t border-white/10 p-4 text-left shadow-lg shadow-black/20 ring-1 ring-white/5 transition hover:ring-emerald-500/30"
      >
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-medium text-white">{meal.name}</h3>
          <span className="rounded-full bg-emerald-600/20 px-2 py-0.5 text-xs text-emerald-400">Done</span>
        </div>
        <p className="mb-1 text-sm text-slate-400">
          {meal.meal_items.length} item{meal.meal_items.length === 1 ? '' : 's'} ·{' '}
          <span className="font-semibold text-emerald-400">{Math.round(totals.calories)} kcal</span>
        </p>
        <MacroLine macros={totals} />
        <p className="mt-1 text-xs text-slate-500">
          Fiber {Math.round(micros.fiber)}g · Sodium {Math.round(micros.sodium)}mg · Sugar {Math.round(micros.sugar)}g
        </p>
      </button>
    )
  }

  return (
    <div className="rounded-2xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium text-white">{meal.name}</h3>
        <span className="text-xs text-emerald-400">{Math.round(totals.calories)} kcal</span>
      </div>

      <div className="mb-3 space-y-1">
        {meal.meal_items.map((item) => {
          const m = macrosForGrams(item.food, item.grams)
          const removeItem = () =>
            undoable(
              `Removed ${item.food.name}`,
              () => deleteItem.mutate(item.id),
              () =>
                addItem.mutate({
                  mealId: meal.id,
                  foodId: item.food_id,
                  grams: item.grams,
                  servingLabel: item.serving_label,
                }),
            )
          return (
            <SwipeToDelete key={item.id} onDelete={removeItem} className="rounded-xl">
              <div className="flex items-center justify-between rounded-xl bg-slate-800/60 px-3 py-2 text-sm text-slate-300">
                <span>
                  {item.food.name} · {item.serving_label ?? `${item.grams}g`}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{Math.round(m.calories)} kcal</span>
                  <button onClick={removeItem} className="text-red-400 hover:text-red-300">
                    ×
                  </button>
                </div>
              </div>
            </SwipeToDelete>
          )
        })}
        {meal.meal_items.length === 0 && <p className="text-sm text-slate-500">No items yet.</p>}
      </div>

      <MacroLine macros={totals} className="mb-3" />

      {adding ? (
        <FoodPicker
          onCancel={() => setAdding(false)}
          onAdd={(input) => {
            haptics.tap()
            addItem.mutate({ mealId: meal.id, ...input })
            setAdding(false)
          }}
        />
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => setAdding(true)}
            className="flex-1 rounded-xl border border-dashed border-slate-700 py-2 text-sm font-medium text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
          >
            + Add food
          </button>
          {meal.meal_items.length > 0 && (
            <button
              onClick={() => {
                haptics.success()
                setCompleted.mutate({ mealId: meal.id, completed: true })
              }}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              Done
            </button>
          )}
        </div>
      )}
    </div>
  )
}
