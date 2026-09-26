import { parseDecimal } from '../../lib/number'
import { useEffect, useMemo, useState } from 'react'
import { CircularProgress } from '../../components/CircularProgress'
import { EmptyState } from '../../components/EmptyState'
import { FireStreak } from '../../components/FireStreak'
import { SwipeToDelete } from '../../components/SwipeToDelete'
import { useToast } from '../../components/ToastProvider'
import { useActiveFast, useDeleteFast, useEndFast, useFastHistory, useRestoreFast, useStartFast } from '../../hooks/useFasting'
import { haptics } from '../../lib/haptics'
import { formatDurationLabel } from '../../lib/duration'
import { computeDayStreaks } from '../../lib/streaks'
import { FastingStages } from './FastingStages'

const DEFAULT_FAST_HOURS = 16
const MAX_FAST_HOURS = 168

/** A negative number is truthy, so `|| 16` let "-5h" through and opened the timer at "Goal reached". */
function clampFastHours(input: string): number {
  const parsed = parseDecimal(input)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_FAST_HOURS
  return Math.min(parsed, MAX_FAST_HOURS)
}

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

export function FastingTab({ quickAction }: { quickAction?: number }) {
  const { data: active } = useActiveFast()
  const { data: history = [] } = useFastHistory()
  const startFast = useStartFast()
  const endFast = useEndFast()
  const deleteFast = useDeleteFast()
  const restoreFast = useRestoreFast()
  const { undoable } = useToast()
  const [customHours, setCustomHours] = useState('16')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!active) return
    const interval = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(interval)
  }, [active])

  // A fasting streak credits the calendar day a fast was started on - matches how someone would
  // think of "I fasted N days in a row" for a daily intermittent-fasting habit.
  const streak = useMemo(
    () => computeDayStreaks(history.map((f) => new Date(f.start_time).toISOString().slice(0, 10))),
    [history],
  )

  // Quick-add "Start a fast": bring the fast picker (or the running fast) into view.
  useEffect(() => {
    if (quickAction == null) return
    requestAnimationFrame(() =>
      document.getElementById('fasting-primary')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    )
  }, [quickAction])

  const elapsedMs = active ? now - new Date(active.start_time).getTime() : null
  const elapsedHours = elapsedMs != null ? elapsedMs / 3_600_000 : null

  return (
    <div className="space-y-4 p-4">
      <FireStreak count={streak.current} label="day streak" />

      {active && elapsedMs != null ? (
        (() => {
          const targetMs = active.target_hours * 3_600_000
          const pct = Math.min(100, (elapsedMs / targetMs) * 100)
          const remaining = targetMs - elapsedMs

          return (
            <div id="fasting-primary" className="card card-glow p-4">
              <h3 className="mb-3 font-medium text-white">Current fast</h3>
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
                onClick={() => {
                  if (pct >= 100) haptics.success()
                  endFast.mutate(active.id)
                }}
                className="mt-3 w-full rounded-xl bg-red-600/20 py-2 text-sm font-medium text-red-400 hover:bg-red-600/30"
              >
                End fast
              </button>
            </div>
          )
        })()
      ) : (
        <div id="fasting-primary" className="card card-glow p-4">
          <h3 className="mb-3 font-medium text-white">Start a fast</h3>
          <p className="mb-2 text-sm text-slate-400">Pick a fasting window and start the timer.</p>
          <div className="mb-2 grid grid-cols-2 gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  haptics.tap()
                  startFast.mutate(p.hours)
                }}
                className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={customHours}
              min={0.5}
              max={MAX_FAST_HOURS}
              aria-label="Custom fast length in hours"
              onChange={(e) => setCustomHours(e.target.value)}
              className="w-20 field px-3 py-2 text-sm"
            />
            <button
              onClick={() => startFast.mutate(clampFastHours(customHours))}
              className="btn btn-primary flex-1 py-2 text-sm"
            >
              Start custom fast
            </button>
          </div>
        </div>
      )}

      <div className="card p-4">
        <p className="mb-2 text-sm font-medium text-white">Recent fasts</p>
        {history.length === 0 ? (
          <EmptyState variant="calendar" message="No fasts logged yet - finish one above and it'll show up here." />
        ) : (
          <div className="space-y-1.5">
            {history.map((f) => {
              const durationS = (new Date(f.end_time!).getTime() - new Date(f.start_time).getTime()) / 1000
              const reached = durationS >= f.target_hours * 3600
              return (
                <SwipeToDelete
                  key={f.id}
                  className="rounded-xl"
                  onDelete={() => undoable('Fast deleted', () => deleteFast.mutate(f.id), () => restoreFast.mutate(f))}
                >
                <div className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-800/60 pl-3 text-sm">
                  <span className="text-slate-300">
                    {new Date(f.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <span className={`ml-auto ${reached ? 'font-medium text-success' : 'text-slate-400'}`}>
                    {/* "12 min" rather than "0.2h" for fasts ended early */}
                    {formatDurationLabel(durationS)} <span className="font-normal text-slate-500">of {f.target_hours} h</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => undoable('Fast deleted', () => deleteFast.mutate(f.id), () => restoreFast.mutate(f))}
                    aria-label="Delete this fast"
                    className="flex h-11 w-10 shrink-0 items-center justify-center text-slate-500 active:text-red-400"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
                </SwipeToDelete>
              )
            })}
          </div>
        )}
      </div>

      <FastingStages elapsedHours={elapsedHours} />
    </div>
  )
}
