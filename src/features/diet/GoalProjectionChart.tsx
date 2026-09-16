import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { estimateTDEE, projectGoal } from '../../lib/tdee'
import { useUserSettings } from '../../hooks/useUserSettings'

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <h3 className="mb-2 text-sm font-medium text-slate-300">Goal projection</h3>
      {children}
    </div>
  )
}

export function GoalProjectionChart() {
  const { data: settings } = useUserSettings()
  if (!settings) return null

  const tdee = estimateTDEE(settings)
  const missing: string[] = []
  if (settings.calorie_goal == null) missing.push('a calorie goal (above)')
  if (settings.current_weight == null || settings.weight_goal == null) missing.push('current & goal weight (Goals tab)')
  if (tdee == null) missing.push('height, age, sex & activity level (Goals tab)')

  if (missing.length > 0) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Add {missing.join(', ')} to see how long it'll take to reach your goal.</p>
      </Card>
    )
  }

  const projection = projectGoal(settings.current_weight!, settings.weight_goal!, tdee!, settings.calorie_goal!)

  if (!projection) {
    return (
      <Card>
        <p className="text-sm text-emerald-400">You're already at your goal weight!</p>
      </Card>
    )
  }

  if (!projection.onTrack) {
    return (
      <Card>
        <p className="text-sm text-amber-400">
          Your {settings.calorie_goal} kcal target won't get you there — your estimated maintenance is ~{tdee} kcal, so
          you'll need to {projection.direction === 'lose' ? 'lower' : 'raise'} your calorie target to make progress toward{' '}
          {projection.direction === 'lose' ? 'losing' : 'gaining'} weight.
        </p>
      </Card>
    )
  }

  const totalDays = projection.daysNeeded
  const numPoints = Math.min(20, Math.max(2, Math.round(totalDays / 7)))
  const data = Array.from({ length: numPoints + 1 }, (_, i) => {
    const day = Math.round((i / numPoints) * totalDays)
    const weight = settings.current_weight! + (settings.weight_goal! - settings.current_weight!) * (day / totalDays)
    const date = new Date(Date.now() + day * 86_400_000)
    return { weight: Math.round(weight * 10) / 10, label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }
  })
  const weeks = Math.round(totalDays / 7)

  return (
    <Card>
      <p className="mb-3 text-sm text-slate-400">
        At this rate, about <span className="font-semibold text-white">{totalDays} days</span> (~{weeks} weeks) to reach{' '}
        {settings.weight_goal}kg — around{' '}
        <span className="font-semibold text-white">
          {projection.targetDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
        </span>
        .
      </p>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
              interval={Math.ceil(numPoints / 5)}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
              domain={['dataMin - 1', 'dataMax + 1']}
            />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(value) => [`${value} kg`, 'Projected weight']}
            />
            <Line type="monotone" dataKey="weight" stroke="#34d399" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Estimate based on your Mifflin-St Jeor maintenance (~{tdee} kcal/day) — actual results vary.
      </p>
    </Card>
  )
}
