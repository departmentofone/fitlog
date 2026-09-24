import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useAddFoodLabel, useRemoveFoodLabel } from '../../hooks/useFoodLabels'
import { useCreateFood, useDeleteFood } from '../../hooks/useFoods'
import { useToast } from '../../components/ToastProvider'
import type { Food } from '../../types'
import { AddToPresetSheet } from './AddToPresetSheet'
import { NewFoodForm } from '../meals/NewFoodForm'

/** One food in the Foods tab: macros, its labels, and the actions available for it. */
export function FoodRow({ food, labels }: { food: Food; labels: string[] }) {
  const { user } = useAuth()
  const isOwn = food.user_id === user?.id
  const deleteFood = useDeleteFood()
  const createFood = useCreateFood()
  const addLabel = useAddFoodLabel()
  const removeLabel = useRemoveFoodLabel()
  const { show, undoable } = useToast()

  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [addingToPreset, setAddingToPreset] = useState(false)
  const [labelDraft, setLabelDraft] = useState('')

  if (editing) {
    return <NewFoodForm food={food} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} />
  }

  return (
    <div className="rounded-xl bg-slate-800/60 p-3">
      <button onClick={() => setExpanded((e) => !e)} className="flex w-full items-center justify-between gap-2 text-left">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{food.name}</p>
          <p className="text-xs text-slate-500">
            {Math.round(food.calories_per_100g)} kcal · {food.protein_per_100g}p / {food.carbs_per_100g}c / {food.fat_per_100g}f per 100g
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {food.pack && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">{food.pack}</span>}
          {isOwn && <span className="text-[10px] text-emerald-500">yours</span>}
        </div>
      </button>

      {labels.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {labels.map((l) => (
            <span key={l} className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-300">
              {l}
            </span>
          ))}
        </div>
      )}

      {expanded && (
        <div className="mt-3 space-y-2.5 border-t border-white/5 pt-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-400">Your labels</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {labels.map((l) => (
                <button
                  key={l}
                  onClick={() => removeLabel.mutate({ foodId: food.id, label: l })}
                  className="flex items-center gap-1 rounded-full bg-slate-700 px-2 py-1 text-xs text-slate-300 active:bg-slate-600"
                >
                  {l} <span aria-hidden="true">×</span>
                </button>
              ))}
              <input
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' || !labelDraft.trim()) return
                  addLabel.mutate({ foodId: food.id, label: labelDraft.trim() })
                  setLabelDraft('')
                }}
                placeholder="+ label, Enter"
                className="w-28 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => setAddingToPreset(true)}
              className="min-h-9 rounded-xl bg-slate-700 px-3 text-xs font-medium text-slate-200 active:bg-slate-600"
            >
              + Add to preset
            </button>
            {isOwn && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="min-h-9 rounded-xl bg-slate-700 px-3 text-xs font-medium text-slate-200 active:bg-slate-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    const snapshot = food
                    deleteFood.mutate(food.id, {
                      onError: () =>
                        show("Can't delete - it's used in a logged meal, recipe, or preset.", { tone: 'error' }),
                      onSuccess: () =>
                        undoable(
                          `Deleted "${snapshot.name}"`,
                          () => {},
                          () =>
                            createFood.mutate({
                              name: snapshot.name,
                              caloriesPer100g: snapshot.calories_per_100g,
                              proteinPer100g: snapshot.protein_per_100g,
                              carbsPer100g: snapshot.carbs_per_100g,
                              fatPer100g: snapshot.fat_per_100g,
                              commonServings: snapshot.common_servings,
                              fiberG: snapshot.fiber_g,
                              sugarG: snapshot.sugar_g,
                              sodiumMg: snapshot.sodium_mg,
                              cholesterolMg: snapshot.cholesterol_mg,
                              potassiumMg: snapshot.potassium_mg,
                              calciumMg: snapshot.calcium_mg,
                              ironMg: snapshot.iron_mg,
                              vitaminCMg: snapshot.vitamin_c_mg,
                              vitaminAMcg: snapshot.vitamin_a_mcg,
                            }),
                        ),
                    })
                  }}
                  className="min-h-9 rounded-xl bg-red-950/60 px-3 text-xs font-medium text-red-400 active:bg-red-950"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {addingToPreset && <AddToPresetSheet food={food} onClose={() => setAddingToPreset(false)} />}
    </div>
  )
}
