import { useState } from 'react'
import { MuscleDiagram, type MuscleIntensity } from '../../components/MuscleDiagram'
import { MUSCLE_GROUPS } from '../../types'
import { useSessionDates, useWeeklyVolumeByMuscleGroup } from '../../hooks/useWorkouts'

const LABELS = Object.fromEntries(MUSCLE_GROUPS.map((g) => [g.value, g.label]))

// The deload callout compares this week's total volume to the average of the preceding 3 weeks
// (i.e. days 8-28 back). Below this many distinct weeks of logged history, that "average" isn't
// meaningful yet, so the callout is suppressed entirely rather than firing on too little data.
const MIN_WEEKS_OF_HISTORY = 4
const MIN_DAYS_OF_HISTORY = 28
// How far above the recent average this week needs to be before we say anything.
const HIGH_VOLUME_THRESHOLD = 1.35

/** Monday of the week containing `dateISO`, as a 'YYYY-MM-DD' key for de-duping weeks. */
function weekStartKey(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00`)
  const dayIndex = (d.getDay() + 6) % 7 // Monday = 0 ... Sunday = 6
  d.setDate(d.getDate() - dayIndex)
  return d.toISOString().slice(0, 10)
}

/**
 * Whether there's enough logged history for a "this week vs. recent average" comparison to be
 * meaningful: at least a handful of distinct weeks with data, spanning at least a full month.
 * Both checks matter - a month-old account with one workout logged shouldn't trigger this any
 * more than a week-old account should.
 */
function hasEnoughHistoryForComparison(sessionDates: string[]): boolean {
  if (sessionDates.length === 0) return false
  const distinctWeeks = new Set(sessionDates.map(weekStartKey)).size
  if (distinctWeeks < MIN_WEEKS_OF_HISTORY) return false

  const earliest = sessionDates.reduce((min, d) => (d < min ? d : min), sessionDates[0])
  const daysSinceEarliest = (Date.now() - new Date(`${earliest}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24)
  return daysSinceEarliest >= MIN_DAYS_OF_HISTORY
}

/**
 * One muscles card with a Today / Last 7 days switch (two full body maps stacked back to back was
 * ~1000px of near-duplicate figures). Today is working sets per muscle; the week is volume, with the
 * exact per-muscle bars underneath.
 */
export function WeeklyVolumeCard({ todaySetsPerMuscle }: { todaySetsPerMuscle: MuscleIntensity }) {
  const hasToday = Object.keys(todaySetsPerMuscle).length > 0
  const [range, setRange] = useState<'today' | 'week'>(hasToday ? 'today' : 'week')
  const { data: volumes = [] } = useWeeklyVolumeByMuscleGroup(7)
  const { data: last28DaysVolumes = [] } = useWeeklyVolumeByMuscleGroup(28)
  const { data: sessionDates = [] } = useSessionDates()

  const sorted = [...volumes].filter((v) => v.volume > 0).sort((a, b) => b.volume - a.volume)
  if (sorted.length === 0 && !hasToday) return null
  const showing = range === 'today' && hasToday ? 'today' : 'week'

  const max = sorted[0]?.volume ?? 0
  const weeklyIntensity: MuscleIntensity = Object.fromEntries(sorted.map((v) => [v.muscleGroup, v.volume]))

  const thisWeekTotal = volumes.reduce((sum, v) => sum + v.volume, 0)
  const last28DaysTotal = last28DaysVolumes.reduce((sum, v) => sum + v.volume, 0)
  // last28DaysTotal includes this week, so subtracting it out leaves the preceding 3 weeks.
  const precedingWeeksAvg = (last28DaysTotal - thisWeekTotal) / 3

  const showDeloadHint =
    hasEnoughHistoryForComparison(sessionDates) &&
    precedingWeeksAvg > 0 &&
    thisWeekTotal >= precedingWeeksAvg * HIGH_VOLUME_THRESHOLD

  const percentAbove = precedingWeeksAvg > 0 ? Math.round(((thisWeekTotal - precedingWeeksAvg) / precedingWeeksAvg) * 100) : 0

  return (
    <div className="rounded-3xl bg-slate-900 border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-slate-300">
          {showing === 'today' ? 'Muscles worked today' : 'Last 7 days · volume'}
        </h3>
        <div className="flex rounded-xl bg-slate-800/60 p-0.5" role="tablist" aria-label="Range">
          {(['today', 'week'] as const).map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={showing === r}
              disabled={r === 'today' && !hasToday}
              onClick={() => setRange(r)}
              className={`min-h-8 rounded-lg px-2.5 text-xs font-medium transition disabled:opacity-40 ${
                showing === r ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
            >
              {r === 'today' ? 'Today' : '7 days'}
            </button>
          ))}
        </div>
      </div>
      {/* At-a-glance balance first (what you've hit and what you've skipped), exact numbers below. */}
      <div className={showing === 'week' ? 'mb-4' : ''}>
        <MuscleDiagram intensity={showing === 'today' ? todaySetsPerMuscle : weeklyIntensity} size={110} showLegend />
      </div>
      {showing === 'week' && (
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
      )}
      {showing === 'week' && showDeloadHint && (
        <p className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
          This week's volume is ~{percentAbove}% above your recent average — a lighter day might be worth considering.
        </p>
      )}
    </div>
  )
}
