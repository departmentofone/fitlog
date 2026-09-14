import { useWeeklyDigest } from '../../hooks/useWeeklyDigest'

export function WeeklyDigestCard() {
  const { data } = useWeeklyDigest()
  if (!data) return null

  const workoutTrend = data.workoutsThisWeek - data.workoutsLastWeek

  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-600/20 via-slate-900 to-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium text-white">📊 Your week</h2>
        <span className="text-xs text-slate-500">Last 7 days</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-800/60 p-3">
          <p className="text-2xl font-bold text-white">{data.workoutsThisWeek}</p>
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
        <div className="rounded-xl bg-slate-800/60 p-3">
          <p className="text-2xl font-bold text-white">{Math.round(data.totalVolume).toLocaleString()}</p>
          <p className="text-xs text-slate-500">kg moved</p>
        </div>
        <div className="rounded-xl bg-slate-800/60 p-3">
          <p className="text-2xl font-bold text-emerald-400">{Math.round(data.avgCalories)}</p>
          <p className="text-xs text-slate-500">avg kcal/day</p>
        </div>
        <div className="rounded-xl bg-slate-800/60 p-3">
          <p className="text-2xl font-bold text-blue-400">{Math.round(data.avgProtein)}g</p>
          <p className="text-xs text-slate-500">avg protein/day</p>
        </div>
      </div>

      {data.weightChange !== null && Math.abs(data.weightChange) > 0.05 && (
        <p className="mt-3 text-center text-sm text-slate-400">
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
