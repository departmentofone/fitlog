import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useBackToClose } from '../../hooks/useHashRoute'
import { useAddMealPresetItem, useCreateMealPreset, useMealPresets } from '../../hooks/useMealPresets'
import { useToast } from '../../components/ToastProvider'
import { EmptyState } from '../../components/EmptyState'
import { FoodAmountForm } from '../meals/FoodAmountForm'
import type { Food } from '../../types'

/**
 * Bottom sheet for "add this food to a preset" (started from a food row in the Foods tab): pick an
 * existing preset, or make a new one on the spot, then reuse the same amount step meal-logging
 * uses. The reverse direction - adding a food while already looking at a preset - goes through
 * FoodPicker instead, from PresetsManagerView.
 */
export function AddToPresetSheet({ food, onClose }: { food: Food; onClose: () => void }) {
  useBackToClose(true, onClose)
  const { user } = useAuth()
  const { data: presets = [], isLoading } = useMealPresets()
  const createPreset = useCreateMealPreset()
  const addItem = useAddMealPresetItem()
  const { show } = useToast()

  const [presetId, setPresetId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [creatingNew, setCreatingNew] = useState(false)

  // A shared preset (someone else's, visible to you) can't be edited - only your own take items.
  const ownPresets = presets.filter((p) => p.user_id === user?.id)

  if (presetId) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
        <div className="fade-in absolute inset-0 bg-black/60" />
        <div
          onClick={(e) => e.stopPropagation()}
          className="sheet-up relative max-h-[85%] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-slate-950 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-700" />
          <FoodAmountForm
            food={food}
            submitLabel="Add to preset"
            backLabel="Back to presets"
            onBack={() => setPresetId(null)}
            onAdd={(input) => {
              addItem.mutate({ presetId, foodId: input.foodId, grams: input.grams, servingLabel: input.servingLabel })
              show(`Added ${food.name} to the preset`)
              onClose()
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="fade-in absolute inset-0 bg-black/60" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add to preset"
        onClick={(e) => e.stopPropagation()}
        className="sheet-up relative max-h-[85%] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-slate-950 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-700" />
        <h3 className="mb-3 font-medium text-white">Add "{food.name}" to…</h3>

        {creatingNew ? (
          <div className="mb-2 flex gap-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Preset name"
              className="min-w-0 flex-1 field px-3 py-2.5"
            />
            <button
              disabled={!newName.trim() || createPreset.isPending}
              onClick={async () => {
                const created = await createPreset.mutateAsync(newName.trim())
                setNewName('')
                setCreatingNew(false)
                setPresetId(created.id)
              }}
              className="btn btn-primary shrink-0 px-4 text-sm"
            >
              Create
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreatingNew(true)}
            className="mb-2 min-h-11 w-full rounded-xl border border-dashed border-slate-700 text-sm font-medium text-slate-300 active:border-emerald-500 active:text-emerald-400"
          >
            + New preset
          </button>
        )}

        {isLoading && <p className="py-4 text-center text-sm text-slate-500">Loading…</p>}
        {!isLoading && ownPresets.length === 0 && !creatingNew && (
          <EmptyState variant="list" message="No presets yet — make one above." />
        )}
        <div className="space-y-1.5">
          {ownPresets.map((p) => (
            <button
              key={p.id}
              onClick={() => setPresetId(p.id)}
              className="flex w-full items-center justify-between rounded-xl bg-slate-800/60 px-3 py-2.5 text-left text-sm text-slate-200 active:bg-slate-800"
            >
              <span>{p.name}</span>
              <span className="text-xs text-slate-500">{p.meal_preset_items.length} items</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
