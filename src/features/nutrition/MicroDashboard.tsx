import { useState } from 'react'
import { DAILY_VALUES, formatAmount, percentDV } from '../../lib/nutrition'
import type { MicroTotals } from '../../types'

// Nutrients you want to *limit* read as a warning once you're over 100% DV; nutrients you want
// to *get enough of* read as a warning only while you're clearly short of it.
const LIMIT_KEYS = new Set<keyof MicroTotals>(['sodium', 'cholesterol', 'sugar'])

function toneFor(key: keyof MicroTotals, value: number, pct: number): 'none' | 'good' | 'neutral' | 'warn' {
  // Nothing logged yet isn't a warning - a red "0g" fiber before breakfast just read as an alarm.
  if (value <= 0) return 'none'
  if (LIMIT_KEYS.has(key)) {
    if (pct >= 100) return 'warn'
    if (pct >= 70) return 'neutral'
    return 'good'
  }
  if (pct >= 60) return 'good'
  if (pct >= 25) return 'neutral'
  return 'warn'
}

const TONE_BAR: Record<string, string> = {
  none: 'bg-slate-600',
  good: 'bg-emerald-500',
  neutral: 'bg-amber-400',
  warn: 'bg-red-500',
}
const TONE_TEXT: Record<string, string> = {
  none: 'text-slate-400',
  good: 'text-emerald-400',
  neutral: 'text-amber-400',
  warn: 'text-red-400',
}

/** Always-visible micro-nutrient summary for "today" - the fuller breakdown modal is still the
 * place for the pie chart and food-level flags; this is the at-a-glance version so fiber/sodium/
 * potassium etc. don't require a tap to ever see. */
export function MicroDashboard({ micros }: { micros: MicroTotals }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? DAILY_VALUES : DAILY_VALUES.slice(0, 4)

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">Micronutrients today</h3>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
        >
          {expanded ? 'Show less' : 'Show all'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {visible.map((d) => {
          const value = micros[d.key]
          const pct = percentDV(value, d.dv)
          const clamped = Math.max(0, Math.min(100, pct))
          const tone = toneFor(d.key, value, pct)
          return (
            <div key={d.key} className="rounded-xl bg-slate-800/60 p-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{d.label}</p>
              <p className={`text-sm font-semibold ${TONE_TEXT[tone]}`}>{formatAmount(value, d.unit)}</p>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-700/60">
                <div className={`h-full rounded-full ${TONE_BAR[tone]}`} style={{ width: `${clamped}%` }} />
              </div>
              <p className="mt-0.5 text-[11px] text-slate-600">{pct}% DV</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
