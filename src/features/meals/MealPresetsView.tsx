import { useState } from 'react'
import { useShareGate } from '../../hooks/useShareGate'
import { UNAVAILABLE_FOOD_NAME } from '../../types'
import {
  useCreateMealPresetFromMeal,
  useDeleteMealPreset,
  useLoadMealPreset,
  useMealPresets,
  useRestoreMealPreset,
  useSetMealPresetShared,
} from '../../hooks/useMealPresets'
import { useAuth } from '../../hooks/useAuth'
import { EmptyState } from '../../components/EmptyState'
import { SkeletonRow } from '../../components/Skeleton'
import { useToast } from '../../components/ToastProvider'
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
  const restorePreset = useRestoreMealPreset()
  const loadPreset = useLoadMealPreset()
  const setShared = useSetMealPresetShared()
  const gate = useShareGate()
  const { undoable } = useToast()

  const [savingMealId, setSavingMealId] = useState<string | null>(null)
  const [name, setName] = useState('')

  const savableMeals = currentMeals.filter((m) => m.meal_items.length > 0)

  return (
    <div className="space-y-4 p-4">
      <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-200">
        ← Back
      </button>

      {savableMeals.length > 0 && (
        <div className="card p-4">
          <h3 className="mb-3 card-title">Save a meal as preset</h3>
          <div className="space-y-2">
            {savableMeals.map((meal) =>
              savingMealId === meal.id ? (
                <div key={meal.id} className="inset p-3">
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mb-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setSavingMealId(null)} className="flex-1 rounded-xl bg-slate-700 py-1.5 text-xs text-slate-300 hover:bg-slate-600">
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!name.trim()) return
                        createFromMeal.mutate({ name: name.trim(), meal })
                        setSavingMealId(null)
                      }}
                      className="btn btn-primary flex-1 py-1.5 text-xs"
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
                  className="flex w-full items-center justify-between rounded-xl bg-slate-800/60 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  <span>{meal.name}</span>
                  <span className="text-xs text-slate-500">{meal.meal_items.length} items</span>
                </button>
              ),
            )}
          </div>
        </div>
      )}

      <div className="card card-glow p-4">
        <h3 className="mb-3 card-title">Your meal presets</h3>
        {isLoading && (
          <div className="space-y-2">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}
        {!isLoading && presets.length === 0 && (
          <EmptyState variant="list" message='No presets yet — save a logged meal above ("usual breakfast", etc).' />
        )}
        <div className="space-y-2">
          {presets.map((preset) => (
            <div key={preset.id} className="inset p-3">
              <div className="mb-1 flex items-center justify-between">
                <h4 className="text-sm font-medium text-white">{preset.name}</h4>
                {preset.user_id === user?.id && (
                  <button
                    onClick={() =>
                      undoable(
`Deleted "${preset.name}"`,
                        () => deletePreset.mutate(preset.id),
                        () => restorePreset.mutate(preset),
                      )
                    }
                    className="text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                )}
              </div>
              <p className="mb-2 text-xs text-slate-400">{preset.meal_preset_items.map((i) => i.food?.name ?? UNAVAILABLE_FOOD_NAME).join(', ')}</p>
              {preset.user_id === user?.id ? (
                <label className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={preset.is_shared}
                    onChange={(e) => gate.request(e.target.checked, (on) => setShared.mutate({ presetId: preset.id, isShared: on }))}
                    className="h-3.5 w-3.5 accent-emerald-500"
                  />
                  Share to Community
                </label>
              ) : (
                <p className="mb-2 text-xs text-emerald-400">From Community</p>
              )}
              <button
                onClick={() => {
                  loadPreset.mutate({ preset, date })
                  onLoaded()
                }}
                disabled={loadPreset.isPending}
                className="btn btn-primary w-full py-2 text-sm"
              >
                Load
              </button>
            </div>
          ))}
        </div>
      </div>
      {gate.sheet}
    </div>
  )
}
