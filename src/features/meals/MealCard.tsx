import { useState } from 'react'
import { useAddMealItem, useDeleteMealItem, type MealWithItems } from '../../hooks/useMeals'
import { macrosForGrams, sumMacros } from '../../types'
import { FoodPicker } from './FoodPicker'

export function MealCard({ meal }: { meal: MealWithItems }) {
  const [adding, setAdding] = useState(false)
  const addItem = useAddMealItem()
  const deleteItem = useDeleteMealItem()

  const totals = sumMacros(meal.meal_items.map((i) => macrosForGrams(i.food, i.grams)))

  return (
    <div className="rounded-xl bg-slate-900 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium text-white">{meal.name}</h3>
        <span className="text-xs text-slate-400">{Math.round(totals.calories)} kcal</span>
      </div>

      <div className="mb-3 space-y-1">
        {meal.meal_items.map((item) => {
          const m = macrosForGrams(item.food, item.grams)
          return (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2 text-sm text-slate-300"
            >
              <span>
                {item.food.name} · {item.serving_label ?? `${item.grams}g`}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">{Math.round(m.calories)} kcal</span>
                <button onClick={() => deleteItem.mutate(item.id)} className="text-red-400 hover:text-red-300">
                  ×
                </button>
              </div>
            </div>
          )
        })}
        {meal.meal_items.length === 0 && <p className="text-sm text-slate-500">No items yet.</p>}
      </div>

      <p className="mb-3 text-xs text-slate-500">
        P {Math.round(totals.protein)}g · C {Math.round(totals.carbs)}g · F {Math.round(totals.fat)}g
      </p>

      {adding ? (
        <FoodPicker
          onCancel={() => setAdding(false)}
          onAdd={(input) => {
            addItem.mutate({ mealId: meal.id, ...input })
            setAdding(false)
          }}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full rounded-lg border border-dashed border-slate-700 py-2 text-sm font-medium text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
        >
          + Add food
        </button>
      )}
    </div>
  )
}
