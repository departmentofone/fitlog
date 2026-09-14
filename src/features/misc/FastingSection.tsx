import { useEffect, useState } from 'react'
import { CircularProgress } from '../../components/CircularProgress'
import { useActiveFast, useEndFast, useFastHistory, useStartFast } from '../../hooks/useFasting'

const PRESETS = [
  { label: '16:8', hours: 16 },
  { label: '18:6', hours: 18 },
  { label: '20:4', hours: 20 },
  { label: 'OMAD (23h)', hours: 23 },
]

function formatElapsed(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h}h ${m}m`
}

export function FastingSection() {
  const { data: active } = useActiveFast()
  const { data: history = [] } = useFastHistory()
  const startFast = useStartFast()
  const endFast = useEndFast()
  const [customHours, setCustomHours] = useState('16')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!active) return
    const interval = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(interval)
  }, [active])

  if (active) {
    const elapsedMs = now - new Date(active.start_time).getTime()
    const targetMs = active.target_hours * 3_600_000
    const pct = Math.min(100, (elapsedMs / targetMs) * 100)
    const remaining = targetMs - elapsedMs

    return (
      <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h3 className="mb-3 font-medium text-white">⏱️ Fasting</h3>
        <div className="flex items-center gap-4">
          <CircularProgress percent={pct} tone={pct >= 100 ? 'good' : 'neutral'} size={84} />
          <div className="flex-1">
            <p className="text-lg font-semibold text-white">{formatElapsed(elapsedMs)}</p>
            <p className="text-xs text-slate-500">
              Target {active.target_hours}h · {remaining > 0 ? `${formatElapsed(remaining)} to go` : 'Goal reached!'}
            </p>
          </div>
        </div>
        <button
          onClick={() => endFast.mutate(active.id)}
          className="mt-3 w-full rounded-lg bg-red-600/20 py-2 text-sm font-medium text-red-400 hover:bg-red-600/30"
        >
          End fast
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <h3 className="mb-3 font-medium text-white">⏱️ Fasting</h3>
      <p className="mb-2 text-sm text-slate-400">Pick a fasting window and start the timer.</p>
      <div className="mb-2 grid grid-cols-2 gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => startFast.mutate(p.hours)}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          value={customHours}
          onChange={(e) => setCustomHours(e.target.value)}
          className="w-20 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
        />
        <button
          onClick={() => startFast.mutate(parseFloat(customHours) || 16)}
          className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Start custom fast
        </button>
      </div>

      {history.length > 0 && (
        <div className="mt-3 border-t border-white/5 pt-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">Recent fasts</p>
          <div className="space-y-1">
            {history.map((f) => {
              const durationH = (new Date(f.end_time!).getTime() - new Date(f.start_time).getTime()) / 3_600_000
              return (
                <p key={f.id} className="text-xs text-slate-400">
                  {new Date(f.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ·{' '}
                  {durationH.toFixed(1)}h (target {f.target_hours}h)
                </p>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
