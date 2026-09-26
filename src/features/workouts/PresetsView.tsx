import { UNAVAILABLE_EXERCISE_NAME } from '../../types'
import { useShareGate } from '../../hooks/useShareGate'
import { useState } from 'react'
import {
  useCreatePresetFromSets,
  useDeletePreset,
  useLoadPreset,
  usePresets,
  useRestorePreset,
  useSetPresetShared,
  type PresetWithItems,
} from '../../hooks/usePresets'
import { useAuth } from '../../hooks/useAuth'
import { EmptyState } from '../../components/EmptyState'
import { SkeletonRow } from '../../components/Skeleton'
import { useToast } from '../../components/ToastProvider'
import type { SetWithExercise } from '../../hooks/useWorkouts'

function summarize(preset: PresetWithItems) {
  const names = new Map<string, number>()
  for (const item of preset.workout_preset_items) {
    // A shared preset can reference the owner's custom exercise, which RLS hides from us.
    const name = item.exercise?.name ?? UNAVAILABLE_EXERCISE_NAME
    names.set(name, (names.get(name) ?? 0) + 1)
  }
  return Array.from(names.entries())
    .map(([name, count]) => `${name} (${count})`)
    .join(', ')
}

export function PresetsView({
  sessionId,
  currentSets,
  onBack,
  onLoaded,
}: {
  sessionId: string | undefined
  currentSets: SetWithExercise[]
  onBack: () => void
  onLoaded: () => void
}) {
  const { user } = useAuth()
  const { data: presets = [], isLoading } = usePresets()
  const createFromSets = useCreatePresetFromSets()
  const deletePreset = useDeletePreset()
  const restorePreset = useRestorePreset()
  const loadPreset = useLoadPreset(sessionId)
  const setShared = useSetPresetShared()
  const gate = useShareGate()
  const { undoable } = useToast()

  const [showSaveForm, setShowSaveForm] = useState(false)
  const [name, setName] = useState('')

  function handleSave() {
    if (!name.trim()) return
    createFromSets.mutate({ name: name.trim(), sets: currentSets })
    setName('')
    setShowSaveForm(false)
  }

  return (
    <div className="space-y-4 p-4">
      <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-200">
        ← Back
      </button>

      {currentSets.length > 0 &&
        (showSaveForm ? (
          <div className="card p-4">
            <h3 className="mb-3 card-title">Save as preset</h3>
            <input
              autoFocus
              placeholder="Preset name (e.g. Leg Day)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mb-3 w-full field px-3 py-2"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveForm(false)}
                className="btn btn-secondary flex-1 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || createFromSets.isPending}
                className="btn btn-primary flex-1 py-2 text-sm"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSaveForm(true)}
            className="w-full rounded-2xl border border-dashed border-slate-700 py-3 font-medium text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
          >
            + Save this workout as a preset
          </button>
        ))}

      <div className="card card-glow p-4">
        <h3 className="mb-3 card-title">Your presets</h3>
        {isLoading && (
          <div className="space-y-2">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}
        {!isLoading && presets.length === 0 && (
          <EmptyState
            variant="dumbbell"
            message="No presets yet — log a workout, then save it as a preset to quickly reuse it later."
          />
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
              <p className="mb-2 text-xs text-slate-400">{summarize(preset)}</p>
              {preset.user_id === user?.id && (
                <label className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={preset.is_shared}
                    onChange={(e) => gate.request(e.target.checked, (on) => setShared.mutate({ presetId: preset.id, isShared: on }))}
                    className="h-3.5 w-3.5 accent-emerald-500"
                  />
                  Share to Community
                </label>
              )}
              {preset.user_id !== user?.id && (
                <p className="mb-2 text-xs text-emerald-400">From Community</p>
              )}
              <button
                onClick={() => {
                  loadPreset.mutate(preset)
                  onLoaded()
                }}
                disabled={!sessionId || loadPreset.isPending}
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
