import { useQuery } from '@tanstack/react-query'
import { useToast } from '../../components/ToastProvider'
import { useAuth } from '../../hooks/useAuth'
import { useLoadPreset, usePresets } from '../../hooks/usePresets'
import { haptics } from '../../lib/haptics'
import { supabase } from '../../lib/supabase'

const SHOWN = 3

/** How many official workouts Community has (migration_v35); a head-only count, no rows. */
function useOfficialWorkoutCount(enabled: boolean) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['official-workout-count', user?.id],
    enabled: enabled && !!user,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('workout_presets')
        .select('id', { count: 'exact', head: true })
        .eq('is_shared', true)
        .eq('is_official', true)
      if (error) throw error
      return count ?? 0
    },
  })
}

/**
 * Shown on a day with nothing logged yet: your own presets as one-tap starts (most people repeat a
 * handful of workouts), or, before you have any, the way to Community's ready-made ones.
 */
export function StartWorkoutCard({
  sessionId,
  onShowPresets,
  onBrowseWorkouts,
}: {
  sessionId: string | undefined
  onShowPresets: () => void
  onBrowseWorkouts: () => void
}) {
  const { data: presets = [], isLoading } = usePresets()
  const loadPreset = useLoadPreset(sessionId)
  const { show } = useToast()
  const { data: officialCount = 0 } = useOfficialWorkoutCount(!isLoading && presets.length === 0)

  if (isLoading) return null

  if (presets.length === 0) {
    if (officialCount === 0) return null
    return (
      <section className="card p-4">
        <h2 className="card-title">Need a plan?</h2>
        <p className="mt-1 text-sm text-slate-400">
          Community has ready-made workouts: full body, push/pull/legs, upper/lower and one for dumbbells only. Save
          one and it shows up here, ready to start in one tap.
        </p>
        <button onClick={onBrowseWorkouts} className="btn btn-secondary mt-3 w-full text-sm">
          Browse workouts
        </button>
      </section>
    )
  }

  return (
    <section className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="card-title">Start from a preset</h2>
        {presets.length > SHOWN && (
          <button onClick={onShowPresets} className="-my-2 -mr-2 min-h-11 px-2 text-xs font-medium text-emerald-400">
            All {presets.length}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {presets.slice(0, SHOWN).map((preset) => {
          const exercises = new Set(preset.workout_preset_items.map((i) => i.exercise_id)).size
          const sets = preset.workout_preset_items.filter((i) => !i.is_warmup).length
          return (
            <button
              key={preset.id}
              disabled={!sessionId || loadPreset.isPending}
              onClick={() =>
                loadPreset.mutate(preset, {
                  onSuccess: () => {
                    haptics.success()
                    show(`${preset.name} is planned. Tick each set off as you do it.`)
                  },
                  onError: () => show(`Couldn't load ${preset.name}. Try again.`),
                })
              }
              className="inset flex min-h-14 w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition active:bg-slate-700 disabled:opacity-50"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">{preset.name}</span>
                <span className="block text-xs text-slate-400">
                  {exercises} {exercises === 1 ? 'exercise' : 'exercises'} · {sets} {sets === 1 ? 'set' : 'sets'}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">Start</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
