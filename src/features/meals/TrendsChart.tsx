import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { SkeletonLine } from '../../components/Skeleton'
import { useMacroTrend } from '../../hooks/useMeals'
import { CHART_FONT, useThemeChartColors } from '../../lib/useChartColors'

type Metric = 'calories' | 'protein' | 'carbs' | 'fat'

// Calories tracks the user's accent color (it's the headline metric); protein/carbs/fat stay
// fixed, distinguishable series colors regardless of accent, same as any multi-series chart.
const FIXED_COLORS: Partial<Record<Metric, string>> = { protein: '#60a5fa', carbs: '#fbbf24', fat: '#f87171' }
const METRIC_LABELS: { key: Metric; label: string; unit: string }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
]

export function TrendsChart() {
  const [range, setRange] = useState<7 | 30>(7)
  const [metric, setMetric] = useState<Metric>('calories')
  const { data: points = [], isLoading } = useMacroTrend(range)
  const colors = useThemeChartColors()
  const METRICS = METRIC_LABELS.map((m) => ({ ...m, color: FIXED_COLORS[m.key] ?? colors.accent }))
  const active = METRICS.find((m) => m.key === metric)!

  const average = useMemo(() => {
    if (points.length === 0) return 0
    return points.reduce((sum, p) => sum + p[metric], 0) / points.length
  }, [points, metric])

  const chartData = points.map((p) => ({
    ...p,
    label: new Date(p.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }))

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-white">Trends</h3>
        <div className="flex gap-1.5">
          {[7, 30].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r as 7 | 30)}
              className={`rounded-xl px-2.5 py-1 text-xs font-medium ${
                range === r ? 'bg-emerald-600 text-on-accent' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`rounded-xl px-2.5 py-1 text-xs font-medium ${
              metric === m.key ? 'bg-emerald-600 text-on-accent' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="mb-2 text-sm text-slate-400">
        {range}-day average: <span className="font-medium text-white">{Math.round(average)}</span> {active.unit}
      </p>

      {isLoading ? (
        <SkeletonLine className="h-56 w-full rounded-2xl" />
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis
                dataKey="label"
                tick={{ fill: colors.tick, fontSize: 11, fontFamily: CHART_FONT }}
                interval={range === 30 ? 3 : 0}
                axisLine={{ stroke: colors.axis }}
                tickLine={false}
              />
              <YAxis tick={{ fill: colors.tick, fontSize: 11, fontFamily: CHART_FONT }} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                contentStyle={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: 8, fontFamily: CHART_FONT }}
                labelStyle={{ color: colors.tooltipText }}
                formatter={(value) => [`${Math.round(Number(value))} ${active.unit}`, active.label]}
              />
              <ReferenceLine y={average} stroke={colors.tick} strokeDasharray="4 4" />
              <Bar dataKey={metric} fill={active.color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
