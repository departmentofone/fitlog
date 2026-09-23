import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  useAddMealPresetItem,
  useCreateMealPreset,
  useDeleteMealPreset,
  useMealPresets,
  useRemoveMealPresetItem,
  useRenameMealPreset,
  useRestoreMealPreset,
  useSetMealPresetShared,
} from '../../hooks/useMealPresets'
import { EmptyState } from '../../components/EmptyState'
import { SkeletonRow } from '../../components/Skeleton'
import { useToast } from '../../components/ToastProvider'
import { UNAVAILABLE_FOOD_NAME } from '../../types'
import { FoodPicker } from '../meals/FoodPicker'

/**
 * Full preset management, independent of logging a real meal first: create an empty preset, add
 * or remove foods from it directly, rename, delete-with-undo, and toggle sharing. MealPresetsView
 * (in Meals) still covers "save today's meal as a preset" and "load a preset into today" - this is
 * the editing side that was missing.
 */
export function PresetsManagerView() {
  const { user } = useAuth()
  const { data: presets = [], isLoading } = useMealPresets()
  const createPreset = useCreateMealPreset()
  const renamePreset = useRenameMealPreset()
  const deletePreset = useDeleteMealPreset()
  const restorePreset = useRestoreMealPreset()
  const setShared = useSetMealPresetShared()
  const addItem = useAddMealPresetItem()
  const removeItem = useRemoveMealPresetItem()
  const { undoable } = useToast()

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [addingFoodTo, setAddingFoodTo] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {creating ? (
        <div className="flex gap-2 rounded-2xl bg-slate-900 border-t border-white/10 p-3 ring-1 ring-white/5">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder='Preset name (e.g. "Usual breakfast")'
            className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <button
            disabled={!newName.trim() || createPreset.isPending}
            onClick={async () => {
              const created = await createPreset.mutateAsync(newName.trim())
              setNewName('')
              setCreating(false)
              setOpenId(created.id)
            }}
            className="shrink-0 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-on-accent disabled:opacity-50"
          >
            Create
          </button>
          <button onClick={() => setCreating(false)} className="shrink-0 rounded-xl bg-slate-800 px-3 text-sm text-slate-300">
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="min-h-11 w-full rounded-xl border border-dashed border-slate-700 text-sm font-medium text-slate-300 active:border-emerald-500 active:text-emerald-400"
        >
          + New preset
        </button>
      )}

      {isLoading && (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}
      {!isLoading && presets.length === 0 && <EmptyState variant="list" message="No presets yet — make one above." />}

      <div className="space-y-2">
        {presets.map((preset) => {
          const isOwn = preset.user_id === user?.id
          const isOpen = openId === preset.id
          return (
            <div key={preset.id} className="rounded-2xl bg-slate-900 border-t border-white/10 p-3 ring-1 ring-white/5">
              <button onClick={() => setOpenId(isOpen ? null : preset.id)} className="flex w-full items-center justify-between gap-2 text-left">
                {renamingId === preset.id ? (
                  <input
                    autoFocus
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={() => {
                      if (renameDraft.trim() && renameDraft !== preset.name) renamePreset.mutate({ presetId: preset.id, name: renameDraft.trim() })
                      setRenamingId(null)
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                ) : (
                  <h4 className="text-sm font-medium text-white">{preset.name}</h4>
                )}
                <span className="shrink-0 text-xs text-slate-500">{preset.meal_preset_items.length} items</span>
              </button>

              {isOpen && (
                <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
                  {preset.meal_preset_items.length === 0 && (
                    <p className="text-xs text-slate-500">Nothing in this preset yet.</p>
                  )}
                  {preset.meal_preset_items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-800/60 px-2.5 py-1.5">
                      <span className="truncate text-xs text-slate-300">{item.food?.name ?? UNAVAILABLE_FOOD_NAME}</span>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-slate-500">{item.grams}g</span>
                        {isOwn && (
                          <button
                            onClick={() =>
                              undoable(
                                `Removed ${item.food?.name ?? UNAVAILABLE_FOOD_NAME}`,
                                () => removeItem.mutate(item.id),
                                () =>
                                  item.food_id &&
                                  addItem.mutate({ presetId: preset.id, foodId: item.food_id, grams: item.grams, servingLabel: item.serving_label }),
                              )
                            }
                            aria-label={`Remove ${item.food?.name ?? UNAVAILABLE_FOOD_NAME}`}
                            className="text-slate-500 hover:text-red-400"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {isOwn && (
                    <>
                      {addingFoodTo === preset.id ? (
                        <FoodPicker
                          onCancel={() => setAddingFoodTo(null)}
                          onAdd={(input) => {
                            addItem.mutate({ presetId: preset.id, ...input })
                            setAddingFoodTo(null)
                          }}
                        />
                      ) : (
                        <button
                          onClick={() => setAddingFoodTo(preset.id)}
                          className="min-h-9 w-full rounded-xl border border-dashed border-slate-700 text-xs font-medium text-slate-300 active:border-emerald-500 active:text-emerald-400"
                        >
                          + Add food
                        </button>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-1.5 text-xs text-slate-400">
                          <input
                            type="checkbox"
                            checked={preset.is_shared}
                            onChange={(e) => setShared.mutate({ presetId: preset.id, isShared: e.target.checked })}
                            className="h-3.5 w-3.5 accent-emerald-500"
                          />
                          Share to Community
                        </label>
                        <div className="flex gap-3 text-xs">
                          <button
                            onClick={() => {
                              setRenameDraft(preset.name)
                              setRenamingId(preset.id)
                            }}
                            className="text-slate-400 hover:text-slate-200"
                          >
                            Rename
                          </button>
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
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  {!isOwn && <p className="text-xs text-emerald-400">From Community</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
