import { CountUp } from '../../components/CountUp'
import { useWeeklyAdherence } from '../../hooks/useDiet'
import { useUserSettings } from '../../hooks/useUserSettings'
import { useWeeklyDigest } from '../../hooks/useWeeklyDigest'

export function WeeklyDigestCard() {
  const { data } = useWeeklyDigest()
  const { data: settings } = useUserSettings()
  const adherence = useWeeklyAdherence(settings?.calorie_goal ?? null, settings?.diet_goal ?? 'deficit')
  if (!data) return null

  const workoutTrend = data.workoutsThisWeek - data.workoutsLastWeek

  return (
    <div className="rounded-3xl bg-gradient-to-br from-emerald-600/20 via-slate-900 to-slate-900 p-4 shadow-lg shadow-black/20 shadow-[var(--glow-shadow)] ring-1 ring-white/5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium text-white">Your week</h2>
        <span className="text-xs text-slate-500">Last 7 days</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-800/60 p-3">
          <p className="text-2xl font-bold text-white">
            <CountUp value={data.workoutsThisWeek} />
          </p>
          <p className="text-xs text-slate-500">
            Workouts
            {workoutTrend !== 0 && (
              <span className={workoutTrend > 0 ? 'ml-1 text-emerald-400' : 'ml-1 text-red-400'}>
                {workoutTrend > 0 ? '↑' : '↓'}
                {Math.abs(workoutTrend)}
              </span>
            )}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-800/60 p-3">
          <p className="text-2xl font-bold text-white">
            <CountUp value={data.totalVolume} format={(n) => Math.round(n).toLocaleString()} />
          </p>
          <p className="text-xs text-slate-500">kg moved</p>
        </div>
        <div className="rounded-2xl bg-slate-800/60 p-3">
          <p className="text-2xl font-bold text-emerald-400">
            <CountUp value={data.avgCalories} />
          </p>
          <p className="text-xs text-slate-500">avg kcal/day</p>
        </div>
        <div className="rounded-2xl bg-slate-800/60 p-3">
          <p className="text-2xl font-bold text-blue-400">
            <CountUp value={data.avgProtein} suffix="g" />
          </p>
          <p className="text-xs text-slate-500">avg protein/day</p>
        </div>
      </div>

      {adherence.data && adherence.data.daysWithData > 0 && (
        <p className="mt-3 text-center text-sm text-slate-400">
          On target{' '}
          <span className="font-medium text-emerald-400">
            {adherence.data.daysOnTarget}/{adherence.data.daysWithData}
          </span>{' '}
          logged {adherence.data.daysWithData === 1 ? 'day' : 'days'} this week
        </p>
      )}

      {data.weightChange !== null && Math.abs(data.weightChange) > 0.05 && (
        <p className="mt-1 text-center text-sm text-slate-400">
          Weight {data.weightChange < 0 ? 'down' : 'up'}{' '}
          <span className={data.weightChange < 0 ? 'font-medium text-emerald-400' : 'font-medium text-amber-400'}>
            {Math.abs(data.weightChange).toFixed(1)}kg
          </span>{' '}
          this week
        </p>
      )}
    </div>
  )
}
