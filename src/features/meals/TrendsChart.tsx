import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useMacroTrend } from '../../hooks/useMeals'

type Metric = 'calories' | 'protein' | 'carbs' | 'fat'

const METRICS: { key: Metric; label: string; unit: string; color: string }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal', color: '#34d399' },
  { key: 'protein', label: 'Protein', unit: 'g', color: '#60a5fa' },
  { key: 'carbs', label: 'Carbs', unit: 'g', color: '#fbbf24' },
  { key: 'fat', label: 'Fat', unit: 'g', color: '#f87171' },
]

export function TrendsChart() {
  const [range, setRange] = useState<7 | 30>(7)
  const [metric, setMetric] = useState<Metric>('calories')
  const { data: points = [], isLoading } = useMacroTrend(range)
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
    <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-white">Trends</h3>
        <div className="flex gap-1.5">
          {[7, 30].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r as 7 | 30)}
              className={`rounded-xl px-2.5 py-1 text-xs font-medium ${
                range === r ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
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
              metric === m.key ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
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
        <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                interval={range === 30 ? 3 : 0}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(value) => [`${Math.round(Number(value))} ${active.unit}`, active.label]}
              />
              <ReferenceLine y={average} stroke="#94a3b8" strokeDasharray="4 4" />
              <Bar dataKey={metric} fill={active.color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
