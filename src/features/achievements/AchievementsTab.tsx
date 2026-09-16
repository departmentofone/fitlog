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
import { CountUp } from '../../components/CountUp'
import { SkeletonCard } from '../../components/Skeleton'
import { ShareCardButton, type ShareCardData } from './ShareCard'

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

/** Last (highest) tier the current value has unlocked, if any. */
function highestUnlocked<T extends { unlocked: boolean }>(tiers: T[]): T | undefined {
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (tiers[i].unlocked) return tiers[i]
  }
  return undefined
}

function FirstBadge({ title, unlocked, shareData }: { title: string; unlocked: boolean; shareData?: ShareCardData }) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${
        unlocked ? 'bg-emerald-600/15 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-slate-800/60 text-slate-500'
      }`}
    >
      <span>{title}</span>
      {unlocked && shareData && <ShareCardButton data={shareData} />}
    </div>
  )
}

export function AchievementsTab() {
  const data = useAchievementsData()

  if (data.isLoading) {
    return (
      <div className="space-y-4 p-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
        <SkeletonCard />
      </div>
    )
  }

  const prCount = countGenuinePRs(data.sets)
  const liftBests = bestLiftEstimates(data.sets)

  const firsts: { title: string; unlocked: boolean; shareData: ShareCardData }[] = [
    {
      title: 'First PR',
      unlocked: prCount >= 1,
      shareData: { type: 'pr', title: 'First PR', value: 'First PR!', subtitle: 'Beat your own prior best' },
    },
    {
      title: 'First recipe',
      unlocked: data.recipeCount >= 1,
      shareData: { type: 'first', title: 'First Recipe Saved', value: 'First Recipe!' },
    },
    {
      title: 'First completed fast',
      unlocked: data.completedFastCount >= 1,
      shareData: { type: 'first', title: 'First Completed Fast', value: 'First Fast!' },
    },
    {
      title: 'First saved preset',
      unlocked: data.presetCount >= 1,
      shareData: { type: 'first', title: 'First Saved Preset', value: 'First Preset!' },
    },
    {
      title: 'First goal completed',
      unlocked: data.completedGoalCount >= 1,
      shareData: { type: 'first', title: 'First Goal Completed', value: 'First Goal!' },
    },
  ]

  const workoutStreakTiers = tierProgress(data.bestWorkoutStreak, STREAK_TIERS, 'd')
  const dietStreakTiers = tierProgress(data.bestDietStreak, STREAK_TIERS, 'd')
  const workoutStreakBest = highestUnlocked(workoutStreakTiers)
  const dietStreakBest = highestUnlocked(dietStreakTiers)

  const prTiers = tierProgress(prCount, PR_COUNT_TIERS, ' PRs')
  const prTierBest = highestUnlocked(prTiers)

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-3xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-lg shadow-black/20 shadow-[var(--glow-shadow)] ring-1 ring-white/5">
        <h3 className="mb-3 font-medium text-white">Firsts</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {firsts.map((f) => (
            <FirstBadge key={f.title} title={f.title} unlocked={f.unlocked} shareData={f.shareData} />
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h3 className="mb-3 font-medium text-white">Streaks</h3>
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500">Workout streak · best {data.bestWorkoutStreak}d</p>
            {workoutStreakBest && (
              <ShareCardButton
                data={{
                  type: 'streak',
                  title: 'Workout Streak',
                  value: `${data.bestWorkoutStreak}-Day Streak`,
                  subtitle: `${workoutStreakBest.label} tier unlocked`,
                }}
              />
            )}
          </div>
          <TierPills tiers={workoutStreakTiers} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500">On-target diet streak · best {data.bestDietStreak}d</p>
            {dietStreakBest && (
              <ShareCardButton
                data={{
                  type: 'streak',
                  title: 'On-Target Diet Streak',
                  value: `${data.bestDietStreak}-Day Streak`,
                  subtitle: `${dietStreakBest.label} tier unlocked`,
                }}
              />
            )}
          </div>
          <TierPills tiers={dietStreakTiers} />
        </div>
      </div>

      <div className="rounded-3xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="font-medium text-white">PR milestones</h3>
          {prTierBest && (
            <ShareCardButton
              data={{
                type: 'pr',
                title: 'PR Milestone',
                value: `${prCount} PRs`,
                subtitle: `${prTierBest.label} tier unlocked`,
              }}
            />
          )}
        </div>
        <p className="mb-3 text-xs text-slate-500">
          <CountUp value={prCount} /> genuine PR{prCount === 1 ? '' : 's'} set (beating your own prior best - the first
          time you log a lift never counts)
        </p>
        <TierPills tiers={prTiers} />
      </div>

      <div className="rounded-3xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
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
            const liftTiers = spec.tiers.map((t) => ({ label: `${t.label} ${t.ratio}x`, tierLabel: t.label, unlocked: ratio >= t.ratio }))
            const liftBest = highestUnlocked(liftTiers)
            return (
              <div key={lift} className="mb-3 last:mb-0">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">
                    {spec.label} · est. {Math.round(best)}kg{best > 0 ? ` (${ratio.toFixed(2)}x bodyweight)` : ''}
                  </p>
                  {liftBest && (
                    <ShareCardButton
                      data={{
                        type: 'tier',
                        title: `${spec.label} · ${liftBest.tierLabel}`,
                        value: liftBest.tierLabel,
                        subtitle: `${ratio.toFixed(2)}x bodyweight`,
                      }}
                    />
                  )}
                </div>
                <TierPills tiers={liftTiers} />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
