import {
  bestLiftEstimates,
  countGenuinePRs,
  PR_COUNT_TIERS,
  STREAK_TIERS,
  STRENGTH_STANDARDS,
  tierProgress,
  type LiftKey,
} from '../../lib/achievements'
import { useAchievementsData } from '../../hooks/useAchievements'

function TierPills({ tiers }: { tiers: { label: string; unlocked: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tiers.map((t) => (
        <span
          key={t.label}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            t.unlocked ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'
          }`}
        >
          {t.label}
        </span>
      ))}
    </div>
  )
}

function FirstBadge({ title, unlocked }: { title: string; unlocked: boolean }) {
  return (
    <div
      className={`rounded-xl px-3 py-2.5 text-sm font-medium ${
        unlocked ? 'bg-emerald-600/15 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-slate-800/60 text-slate-500'
      }`}
    >
      {title}
    </div>
  )
}

export function AchievementsTab() {
  const data = useAchievementsData()

  if (data.isLoading) {
    return <p className="p-4 text-slate-400">Loading…</p>
  }

  const prCount = countGenuinePRs(data.sets)
  const liftBests = bestLiftEstimates(data.sets)

  const firsts = [
    { title: 'First PR', unlocked: prCount >= 1 },
    { title: 'First recipe', unlocked: data.recipeCount >= 1 },
    { title: 'First completed fast', unlocked: data.completedFastCount >= 1 },
    { title: 'First saved preset', unlocked: data.presetCount >= 1 },
    { title: 'First goal completed', unlocked: data.completedGoalCount >= 1 },
  ]

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-3xl bg-slate-900 p-4 shadow-lg shadow-black/20 shadow-[var(--glow-shadow)] ring-1 ring-white/5">
        <h3 className="mb-3 font-medium text-white">Firsts</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {firsts.map((f) => (
            <FirstBadge key={f.title} title={f.title} unlocked={f.unlocked} />
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h3 className="mb-3 font-medium text-white">Streaks</h3>
        <div className="mb-4">
          <p className="mb-1.5 text-xs text-slate-500">Workout streak · best {data.bestWorkoutStreak}d</p>
          <TierPills tiers={tierProgress(data.bestWorkoutStreak, STREAK_TIERS, 'd')} />
        </div>
        <div>
          <p className="mb-1.5 text-xs text-slate-500">On-target diet streak · best {data.bestDietStreak}d</p>
          <TierPills tiers={tierProgress(data.bestDietStreak, STREAK_TIERS, 'd')} />
        </div>
      </div>

      <div className="rounded-3xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h3 className="mb-1 font-medium text-white">PR milestones</h3>
        <p className="mb-3 text-xs text-slate-500">{prCount} genuine PR{prCount === 1 ? '' : 's'} set (beating your own prior best - the first time you log a lift never counts)</p>
        <TierPills tiers={tierProgress(prCount, PR_COUNT_TIERS, ' PRs')} />
      </div>

      <div className="rounded-3xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h3 className="mb-1 font-medium text-white">Strength milestones</h3>
        <p className="mb-3 text-xs text-slate-500">
          Rough bodyweight-ratio milestones for the big 3, not an official standards chart.
        </p>
        {data.currentWeightKg == null ? (
          <p className="text-sm text-slate-500">Add your current weight in Goals to unlock this section.</p>
        ) : (
          (Object.keys(STRENGTH_STANDARDS) as LiftKey[]).map((lift) => {
            const spec = STRENGTH_STANDARDS[lift]
            const best = liftBests[lift]
            const ratio = data.currentWeightKg ? best / data.currentWeightKg : 0
            return (
              <div key={lift} className="mb-3 last:mb-0">
                <p className="mb-1.5 text-xs text-slate-500">
                  {spec.label} · est. {Math.round(best)}kg{best > 0 ? ` (${ratio.toFixed(2)}x bodyweight)` : ''}
                </p>
                <TierPills tiers={spec.tiers.map((t) => ({ label: `${t.label} ${t.ratio}x`, unlocked: ratio >= t.ratio }))} />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
