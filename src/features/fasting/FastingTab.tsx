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
import { CurrentStage, FastingStages } from './FastingStages'
import { localISO } from '../../lib/localDate'

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

type FastRow = { id: string; start_time: string; end_time: string | null; target_hours: number }

const CHART_FASTS = 14
const LIST_FASTS = 5

/** The last two weeks of fasts as bars (a filled bar reached its target), with average and longest. */
function FastHistoryChart({ history }: { history: FastRow[] }) {
  const fasts = history
    .slice(0, CHART_FASTS)
    .map((f) => ({ id: f.id, hours: (new Date(f.end_time!).getTime() - new Date(f.start_time).getTime()) / 3_600_000, target: f.target_hours, start: f.start_time }))
    .reverse()
  if (fasts.length < 2) return null
  const top = Math.max(...fasts.map((f) => Math.max(f.hours, f.target)))
  const average = fasts.reduce((sum, f) => sum + f.hours, 0) / fasts.length
  const longest = Math.max(...fasts.map((f) => f.hours))
  const reached = fasts.filter((f) => f.hours >= f.target).length
  const label = (h: number) => `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`

  return (
    <div className="mb-3">
      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-800/60 px-2 py-2">
          <p className="text-sm font-semibold text-white">{label(average)}</p>
          <p className="text-[11px] text-slate-500">average</p>
        </div>
        <div className="rounded-xl bg-slate-800/60 px-2 py-2">
          <p className="text-sm font-semibold text-white">{label(longest)}</p>
          <p className="text-[11px] text-slate-500">longest</p>
        </div>
        <div className="rounded-xl bg-slate-800/60 px-2 py-2">
          <p className="text-sm font-semibold text-white">
            {reached}/{fasts.length}
          </p>
          <p className="text-[11px] text-slate-500">hit target</p>
        </div>
      </div>
      <div className="flex h-20 items-end gap-1" role="img" aria-label={`Last ${fasts.length} fasts, ${reached} reached their target`}>
        {fasts.map((f) => (
          <div key={f.id} className="flex h-full flex-1 items-end">
            <div
              title={`${new Date(f.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${label(f.hours)}`}
              className={`w-full rounded-t-md ${f.hours >= f.target ? 'bg-emerald-400' : 'bg-slate-600'}`}
              style={{ height: `${Math.max(6, (f.hours / top) * 100)}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
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
  const [confirmingEnd, setConfirmingEnd] = useState(false)
  const [allFasts, setAllFasts] = useState(false)

  useEffect(() => {
    if (!active) return
    const interval = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(interval)
  }, [active])

  // A fasting streak credits the calendar day a fast was started on - matches how someone would
  // think of "I fasted N days in a row" for a daily intermittent-fasting habit.
  const streak = useMemo(
    () => computeDayStreaks(history.map((f) => localISO(new Date(f.start_time)))),
    [history],
  )

  // Quick-add "Start a fast": bring the fast picker (or the running fast) into view.
  useEffect(() => {
    if (quickAction == null) return
    requestAnimationFrame(() =>
      document.getElementById('fasting-primary')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    )
  }, [quickAction])

  // Clamped: `now` can predate a fast started a moment ago (it was set when the tab opened), which
  // read "-1h -1m" until the next tick.
  const elapsedMs = active ? Math.max(0, now - new Date(active.start_time).getTime()) : null
  const elapsedHours = elapsedMs != null ? elapsedMs / 3_600_000 : null

  return (
    <div className="space-y-4 p-4">

      {active && elapsedMs != null ? (
        (() => {
          const targetMs = active.target_hours * 3_600_000
          const pct = Math.min(100, (elapsedMs / targetMs) * 100)
          const remaining = targetMs - elapsedMs

          return (
            <div id="fasting-primary" className="card card-glow p-4">
              {/* The streak sits in the card's header instead of floating alone above it. */}
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="card-title">Current fast</h2>
                <FireStreak count={streak.current} label="day streak" />
              </div>
              <div className="flex items-center gap-4">
                <CircularProgress percent={pct} tone={pct >= 100 ? 'good' : 'neutral'} size={84} />
                <div className="flex-1">
                  <p className="text-lg font-semibold text-white">{formatElapsed(elapsedMs)}</p>
                  <p className="text-xs text-slate-500">
                    Target {active.target_hours}h · {remaining > 0 ? `${formatElapsed(remaining)} to go` : 'Goal reached'}
                  </p>
                  <CurrentStage elapsedHours={elapsedMs / 3_600_000} />
                </div>
              </div>
              {/* Reaching the target is the good ending, so it gets the accent; stopping short asks once
                  more, since an ended fast can't be resumed. */}
              {pct >= 100 ? (
                <button
                  onClick={() => {
                    haptics.success()
                    endFast.mutate(active.id)
                  }}
                  className="btn btn-primary mt-3 w-full text-sm"
                >
                  Finish fast
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!confirmingEnd) return setConfirmingEnd(true)
                    setConfirmingEnd(false)
                    endFast.mutate(active.id)
                  }}
                  onBlur={() => setConfirmingEnd(false)}
                  className={`mt-3 min-h-11 w-full rounded-xl text-sm font-medium transition ${
                    confirmingEnd ? 'bg-red-600 text-on-accent' : 'bg-slate-800 text-slate-300 active:bg-slate-700'
                  }`}
                >
                  {confirmingEnd ? `Tap again to end ${formatElapsed(remaining)} early` : 'End fast'}
                </button>
              )}
            </div>
          )
        })()
      ) : (
        <div id="fasting-primary" className="card card-glow p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="card-title">Start a fast</h2>
            <FireStreak count={streak.current} label="day streak" />
          </div>
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
            <label className="relative w-20 shrink-0">
              <input
                type="text"
                inputMode="decimal"
                value={customHours}
                min={0.5}
                max={MAX_FAST_HOURS}
                aria-label="Custom fast length in hours"
                onChange={(e) => setCustomHours(e.target.value)}
                className="w-full field py-2 pl-3 pr-6 text-sm"
              />
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-sm text-slate-500">
                h
              </span>
            </label>
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
        <div className="mb-2 flex items-center justify-between">
          <h2 className="card-title">Recent fasts</h2>
          {history.length > LIST_FASTS && (
            <button onClick={() => setAllFasts((v) => !v)} className="-my-2 -mr-2 min-h-11 px-2 text-xs font-medium text-emerald-400">
              {allFasts ? 'Show fewer' : `All ${history.length}`}
            </button>
          )}
        </div>
        <FastHistoryChart history={history} />
        {history.length === 0 ? (
          <EmptyState variant="calendar" message="No fasts logged yet. Finish one above and it shows up here." />
        ) : (
          <div className="space-y-1.5">
            {(allFasts ? history : history.slice(0, LIST_FASTS)).map((f) => {
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
