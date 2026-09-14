import { useState } from 'react'
import {
  useCreateMealPresetFromMeal,
  useDeleteMealPreset,
  useLoadMealPreset,
  useMealPresets,
  useSetMealPresetShared,
} from '../../hooks/useMealPresets'
import { useAuth } from '../../hooks/useAuth'
import type { MealWithItems } from '../../hooks/useMeals'

export function MealPresetsView({
  date,
  currentMeals,
  onBack,
  onLoaded,
}: {
  date: string
  currentMeals: MealWithItems[]
  onBack: () => void
  onLoaded: () => void
}) {
  const { user } = useAuth()
  const { data: presets = [], isLoading } = useMealPresets()
  const createFromMeal = useCreateMealPresetFromMeal()
  const deletePreset = useDeleteMealPreset()
  const loadPreset = useLoadMealPreset()
  const setShared = useSetMealPresetShared()

  const [savingMealId, setSavingMealId] = useState<string | null>(null)
  const [name, setName] = useState('')

  const savableMeals = currentMeals.filter((m) => m.meal_items.length > 0)

  return (
    <div className="space-y-4 p-4">
      <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-200">
        ← Back
      </button>

      {savableMeals.length > 0 && (
        <div className="rounded-xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
          <h3 className="mb-3 font-medium text-white">Save a meal as preset</h3>
          <div className="space-y-2">
            {savableMeals.map((meal) =>
              savingMealId === meal.id ? (
                <div key={meal.id} className="rounded-lg bg-slate-800/60 p-3">
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setSavingMealId(null)} className="flex-1 rounded-lg bg-slate-700 py-1.5 text-xs text-slate-300 hover:bg-slate-600">
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!name.trim()) return
                        createFromMeal.mutate({ name: name.trim(), meal })
                        setSavingMealId(null)
                      }}
                      className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  key={meal.id}
                  onClick={() => {
                    setSavingMealId(meal.id)
                    setName(meal.name)
                  }}
                  className="flex w-full items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  <span>{meal.name}</span>
                  <span className="text-xs text-slate-500">{meal.meal_items.length} items</span>
                </button>
              ),
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h3 className="mb-3 font-medium text-white">Your meal presets</h3>
        {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
        {!isLoading && presets.length === 0 && (
          <p className="text-sm text-slate-500">No presets yet — save a logged meal above ("usual breakfast", etc).</p>
        )}
        <div className="space-y-2">
          {presets.map((preset) => (
            <div key={preset.id} className="rounded-lg bg-slate-800/60 p-3">
              <div className="mb-1 flex items-center justify-between">
                <h4 className="text-sm font-medium text-white">{preset.name}</h4>
                {preset.user_id === user?.id && (
                  <button onClick={() => deletePreset.mutate(preset.id)} className="text-red-400 hover:text-red-300">
                    ×
                  </button>
                )}
              </div>
              <p className="mb-2 text-xs text-slate-400">{preset.meal_preset_items.map((i) => i.food.name).join(', ')}</p>
              {preset.user_id === user?.id ? (
                <label className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={preset.is_shared}
                    onChange={(e) => setShared.mutate({ presetId: preset.id, isShared: e.target.checked })}
                    className="h-3.5 w-3.5 accent-emerald-500"
                  />
                  Shared with friend
                </label>
              ) : (
                <p className="mb-2 text-xs text-emerald-400">Shared by a friend</p>
              )}
              <button
                onClick={() => {
                  loadPreset.mutate({ preset, date })
                  onLoaded()
                }}
                disabled={loadPreset.isPending}
                className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                Load
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
