import { formatWhole } from '../../lib/number'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { estimateTDEE, projectGoal } from '../../lib/tdee'
import { useUserSettings } from '../../hooks/useUserSettings'
import { CHART_FONT, useThemeChartColors } from '../../lib/useChartColors'
import { displayWeightValue, weightUnitLabel } from '../../lib/units'

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h3 className="mb-2 text-sm font-medium text-slate-300">Goal projection</h3>
      {children}
    </div>
  )
}

export function GoalProjectionChart() {
  const { data: settings } = useUserSettings()
  const colors = useThemeChartColors()
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

  // Weights are stored in kg; show them in the user's chosen units like every other screen.
  const unitLabel = weightUnitLabel(settings.unit_system)
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
          Your {formatWhole(settings.calorie_goal)} kcal target won't get you there — your estimated maintenance is ~{formatWhole(tdee)} kcal, so
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
    const weightKg = settings.current_weight! + (settings.weight_goal! - settings.current_weight!) * (day / totalDays)
    const date = new Date(Date.now() + day * 86_400_000)
    return { weight: displayWeightValue(weightKg, settings.unit_system), label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }
  })
  const weeks = Math.round(totalDays / 7)

  return (
    <Card>
      <p className="mb-3 text-sm text-slate-400">
        At this rate, about <span className="font-semibold text-white">{totalDays} days</span> (~{weeks} weeks) to reach{' '}
        {displayWeightValue(settings.weight_goal!, settings.unit_system)} {unitLabel} — around{' '}
        <span className="font-semibold text-white">
          {projection.targetDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
        </span>
        .
      </p>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis
              dataKey="label"
              tick={{ fill: colors.tick, fontSize: 11, fontFamily: CHART_FONT }}
              axisLine={{ stroke: colors.axis }}
              tickLine={false}
              interval={Math.ceil(numPoints / 5)}
            />
            <YAxis
              tick={{ fill: colors.tick, fontSize: 11, fontFamily: CHART_FONT }}
              axisLine={false}
              tickLine={false}
              width={40}
              domain={[(min: number) => Math.floor(min - 1), (max: number) => Math.ceil(max + 1)]}
              allowDecimals={false}
              tickCount={6}
            />
            <Tooltip
              contentStyle={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: 8, fontFamily: CHART_FONT }}
              labelStyle={{ color: colors.tooltipText }}
              formatter={(value) => [`${value} ${unitLabel}`, 'Projected weight']}
            />
            <Line type="monotone" dataKey="weight" stroke={colors.accent} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Estimate based on your Mifflin-St Jeor maintenance (~{formatWhole(tdee)} kcal/day) — actual results vary.
      </p>
    </Card>
  )
}
