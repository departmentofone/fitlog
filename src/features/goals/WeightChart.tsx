import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { EmptyState } from '../../components/EmptyState'
import { useProgressEntries } from '../../hooks/useProgressEntries'
import { useUserSettings } from '../../hooks/useUserSettings'
import { displayWeightValue, weightUnitLabel } from '../../lib/units'
import { CHART_FONT, useThemeChartColors } from '../../lib/useChartColors'

type Range = 30 | 90 | 'all'
const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
  { value: 'all', label: 'All' },
]

export function WeightChart() {
  const [range, setRange] = useState<Range>(90)
  const { data: entries = [] } = useProgressEntries()
  const { data: settings } = useUserSettings()
  const colors = useThemeChartColors()

  const unit = weightUnitLabel(settings?.unit_system)
  // Range buttons only mean something once there's a trend to range over.
  const totalWeighIns = entries.filter((e) => e.weight != null).length

  const points = useMemo(() => {
    const withWeight = entries.filter((e) => e.weight != null)
    const sorted = [...withWeight].sort((a, b) => a.date.localeCompare(b.date))
    const filtered =
      range === 'all'
        ? sorted
        : sorted.filter((e) => {
            const cutoff = new Date()
            cutoff.setDate(cutoff.getDate() - range)
            return new Date(e.date + 'T00:00:00') >= cutoff
          })
    return filtered.map((e) => ({
      date: e.date,
      label: new Date(e.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      weight: displayWeightValue(e.weight!, settings?.unit_system),
    }))
  }, [entries, range, settings?.unit_system])

  return (
    <div className="rounded-3xl bg-slate-900 border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-white">Weight over time</h3>
        {totalWeighIns >= 2 && (
        <div className="flex gap-1.5">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`rounded-xl px-2.5 py-1 text-xs font-medium ${
                range === r.value ? 'bg-emerald-600 text-on-accent' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        )}
      </div>

      {points.length < 2 ? (
        <EmptyState
          variant="list"
          message={
            points.length === 0
              ? 'Log your weight in the progress calendar to see a trend here.'
              : 'Log at least one more weigh-in to see a trend line.'
          }
        />
      ) : (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis
                dataKey="label"
                tick={{ fill: colors.tick, fontSize: 11, fontFamily: CHART_FONT }}
                axisLine={{ stroke: colors.axis }}
                tickLine={false}
                interval={Math.ceil(points.length / 6)}
              />
              <YAxis
                tick={{ fill: colors.tick, fontSize: 11, fontFamily: CHART_FONT }}
                axisLine={false}
                tickLine={false}
                width={44}
                domain={['dataMin - 1', 'dataMax + 1']}
              />
              <Tooltip
                contentStyle={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: 8, fontFamily: CHART_FONT }}
                labelStyle={{ color: colors.tooltipText }}
                formatter={(value) => [`${value} ${unit}`, 'Weight']}
              />
              <Line type="monotone" dataKey="weight" stroke={colors.accent} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
