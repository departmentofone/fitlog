import { useEffect, useRef, useState } from 'react'
import { haptics } from '../lib/haptics'
import { localNotify } from '../lib/localNotify'

const STORAGE_KEY = 'fitlog-rest-seconds'
const DEFAULT_SECONDS = 90
const MIN_SECONDS = 15
const MAX_SECONDS = 300
const STEP_SECONDS = 15
const DONE_DISPLAY_MS = 3000
const RING_RADIUS = 18
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function clampSeconds(seconds: number): number {
  return Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, seconds))
}

/** Per-device rest-length preference — deliberately not synced to Supabase. */
export function getDefaultRestSeconds(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SECONDS
    const parsed = parseInt(raw, 10)
    return Number.isFinite(parsed) ? clampSeconds(parsed) : DEFAULT_SECONDS
  } catch {
    // Storage unavailable (private browsing, blocked, etc.) — fall back to the built-in default.
    return DEFAULT_SECONDS
  }
}

export function setDefaultRestSeconds(seconds: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(clampSeconds(seconds)))
  } catch {
    // Ignore — the in-memory default for this session still works.
  }
}

export function formatRestTime(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

type Phase = 'idle' | 'running' | 'done'

/**
 * Rest-between-sets countdown. Mount once (e.g. inside SetForm) and bump `restartKey` — for
 * example a counter incremented on every successful add-set mutation — to (re)start it. A new
 * key always replaces whatever was already running, so only one countdown is ever live; it never
 * auto-starts on mount (only when `restartKey` actually changes).
 */
export function RestTimer({ restartKey }: { restartKey: number }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [defaultSeconds, setDefaultSecondsState] = useState(() => getDefaultRestSeconds())
  const [remaining, setRemaining] = useState(0)
  const prevKey = useRef(restartKey)
  const runStartSeconds = useRef(defaultSeconds)
  const reducedMotion = useRef(prefersReducedMotion())

  useEffect(() => {
    if (restartKey === prevKey.current) return
    prevKey.current = restartKey
    const seconds = getDefaultRestSeconds()
    setDefaultSecondsState(seconds)
    runStartSeconds.current = seconds
    setRemaining(seconds)
    setPhase('running')
  }, [restartKey])

  useEffect(() => {
    if (phase !== 'running') return
    const interval = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  useEffect(() => {
    if (phase === 'running' && remaining === 0) {
      haptics.success()
      void localNotify('Rest over', { body: 'Time for your next set.', tag: 'fitlog-rest-timer' })
      setPhase('done')
    }
  }, [phase, remaining])

  useEffect(() => {
    if (phase !== 'done') return
    const timeout = setTimeout(() => setPhase('idle'), DONE_DISPLAY_MS)
    return () => clearTimeout(timeout)
  }, [phase])

  function adjustDefault(delta: number) {
    const next = clampSeconds(defaultSeconds + delta)
    setDefaultSecondsState(next)
    setDefaultRestSeconds(next)
  }

  function addFifteen() {
    setRemaining((r) => r + 15)
    runStartSeconds.current += 15
  }

  if (phase === 'idle') {
    return (
      <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-800/60 px-3 py-2 text-xs text-slate-400">
        <span>
          Rest timer: <span className="text-slate-300">{formatRestTime(defaultSeconds)}</span>
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => adjustDefault(-STEP_SECONDS)}
            aria-label="Decrease default rest by 15 seconds"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => adjustDefault(STEP_SECONDS)}
            aria-label="Increase default rest by 15 seconds"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600"
          >
            +
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="mb-3 flex items-center justify-center rounded-xl bg-emerald-600/20 py-3 text-sm font-medium text-emerald-400">
        Rest over — go again
      </div>
    )
  }

  const pct = runStartSeconds.current > 0 ? Math.max(0, Math.min(100, (remaining / runStartSeconds.current) * 100)) : 0
  const showRing = !reducedMotion.current

  return (
    <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-800/60 px-3 py-2.5">
      {showRing && (
        <div className="relative h-11 w-11 shrink-0" aria-hidden="true">
          <svg width={44} height={44} className="-rotate-90">
            <circle cx={22} cy={22} r={RING_RADIUS} fill="none" stroke="var(--color-slate-700)" strokeWidth={5} />
            <circle
              cx={22}
              cy={22}
              r={RING_RADIUS}
              fill="none"
              stroke="var(--color-emerald-400)"
              strokeWidth={5}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - pct / 100)}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
        </div>
      )}
      <div className="flex-1">
        <p className="text-xs text-slate-400">Rest</p>
        <p className="font-mono text-lg font-semibold text-white" aria-live="polite">
          {formatRestTime(remaining)}
        </p>
      </div>
      <button
        type="button"
        onClick={addFifteen}
        className="rounded-lg bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-600"
      >
        +15s
      </button>
      <button
        type="button"
        onClick={() => setPhase('idle')}
        className="rounded-lg bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-600"
      >
        Skip
      </button>
    </div>
  )
}
