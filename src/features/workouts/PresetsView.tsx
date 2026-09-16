import { useState } from 'react'
import {
  useCreatePresetFromSets,
  useDeletePreset,
  useLoadPreset,
  usePresets,
  useSetPresetShared,
  type PresetWithItems,
} from '../../hooks/usePresets'
import { useAuth } from '../../hooks/useAuth'
import type { SetWithExercise } from '../../hooks/useWorkouts'

function summarize(preset: PresetWithItems) {
  const names = new Map<string, number>()
  for (const item of preset.workout_preset_items) {
    names.set(item.exercise.name, (names.get(item.exercise.name) ?? 0) + 1)
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
  const loadPreset = useLoadPreset(sessionId)
  const setShared = useSetPresetShared()

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
          <div className="rounded-2xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
            <h3 className="mb-3 font-medium text-white">Save as preset</h3>
            <input
              autoFocus
              placeholder="Preset name (e.g. Leg Day)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveForm(false)}
                className="flex-1 rounded-xl bg-slate-800 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || createFromSets.isPending}
                className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
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

      <div className="rounded-3xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-lg shadow-black/20 shadow-[var(--glow-shadow)] ring-1 ring-white/5">
        <h3 className="mb-3 font-medium text-white">Your presets</h3>
        {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
        {!isLoading && presets.length === 0 && (
          <p className="text-sm text-slate-500">
            No presets yet — log a workout, then save it as a preset to quickly reuse it later.
          </p>
        )}
        <div className="space-y-2">
          {presets.map((preset) => (
            <div key={preset.id} className="rounded-xl bg-slate-800/60 p-3">
              <div className="mb-1 flex items-center justify-between">
                <h4 className="text-sm font-medium text-white">{preset.name}</h4>
                {preset.user_id === user?.id && (
                  <button onClick={() => deletePreset.mutate(preset.id)} className="text-red-400 hover:text-red-300">
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
                    onChange={(e) => setShared.mutate({ presetId: preset.id, isShared: e.target.checked })}
                    className="h-3.5 w-3.5 accent-emerald-500"
                  />
                  Shared with friend
                </label>
              )}
              {preset.user_id !== user?.id && (
                <p className="mb-2 text-xs text-emerald-400">Shared by a friend</p>
              )}
              <button
                onClick={() => {
                  loadPreset.mutate(preset)
                  onLoaded()
                }}
                disabled={!sessionId || loadPreset.isPending}
                className="w-full rounded-xl bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
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
