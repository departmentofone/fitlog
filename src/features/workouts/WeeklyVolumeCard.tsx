import { MUSCLE_GROUPS } from '../../types'
import { useWeeklyVolumeByMuscleGroup } from '../../hooks/useWorkouts'

const LABELS = Object.fromEntries(MUSCLE_GROUPS.map((g) => [g.value, g.label]))

export function WeeklyVolumeCard() {
  const { data: volumes = [] } = useWeeklyVolumeByMuscleGroup(7)
  const sorted = [...volumes].filter((v) => v.volume > 0).sort((a, b) => b.volume - a.volume)
  if (sorted.length === 0) return null

  const max = sorted[0].volume

  return (
    <div className="rounded-3xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <h3 className="mb-3 text-sm font-medium text-slate-300">Last 7 days · volume by muscle group</h3>
      <div className="space-y-2">
        {sorted.map((v) => (
          <div key={v.muscleGroup}>
            <div className="mb-0.5 flex items-center justify-between text-xs">
              <span className="text-slate-300">{LABELS[v.muscleGroup] ?? v.muscleGroup}</span>
              <span className="text-slate-500">{Math.round(v.volume).toLocaleString()} kg</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(v.volume / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
