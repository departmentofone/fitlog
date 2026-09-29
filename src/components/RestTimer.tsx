import { useEffect, useRef, useState } from 'react'
import { haptics } from '../lib/haptics'
import { clearRestNotification, notificationPermission, scheduleRestAlert, showRestCountdown } from '../lib/restNotification'
import { setRestTimerPref, useRestTimerPref } from '../lib/restTimerPrefs'
import { formatRestTime } from '../lib/restTime'


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

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

type Phase = 'idle' | 'running' | 'done'

/** Seconds left until `endsAt`, rounded up so it shows 0:01 until the last moment. */
function secondsLeft(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000))
}

/**
 * Rest-between-sets countdown. Mount once (e.g. inside SetForm) and bump `restartKey` (a counter
 * incremented on every successful add-set) to (re)start it, unless "Start after each set" is off
 * in Settings, when it waits for Start. A new run always replaces the old one. It counts toward
 * an end time rather than ticking down, so it's right again the moment the app comes back from
 * the background. With rest timer notifications on (Settings), the countdown also shows in the
 * notification bar and the service worker alerts when rest is over (see restNotification.ts).
 */
export function RestTimer({ restartKey }: { restartKey: number }) {
  const autoStart = useRestTimerPref('autoStart')
  const notificationsOn = useRestTimerPref('notifications')
  const [phase, setPhase] = useState<Phase>('idle')
  const [defaultSeconds, setDefaultSecondsState] = useState(() => getDefaultRestSeconds())
  const [endsAt, setEndsAt] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [permission, setPermission] = useState(() => notificationPermission())
  const prevKey = useRef(restartKey)
  const runStartSeconds = useRef(defaultSeconds)
  const reducedMotion = useRef(prefersReducedMotion())

  const remaining = secondsLeft(endsAt, now)
  const notify = notificationsOn && permission === 'granted'

  function start(seconds = getDefaultRestSeconds()) {
    setDefaultSecondsState(seconds)
    runStartSeconds.current = seconds
    const t = Date.now()
    setNow(t)
    setEndsAt(t + seconds * 1000)
    setPhase('running')
  }

  function stop() {
    setPhase('idle')
    void clearRestNotification()
  }

  useEffect(() => {
    if (restartKey === prevKey.current) return
    prevKey.current = restartKey
    if (autoStart) start()
  }, [restartKey, autoStart])

  useEffect(() => {
    if (phase !== 'running') return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    // Catch up at once when the app comes back to the front.
    const onVisible = () => setNow(Date.now())
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [phase])

  // Tell the service worker when rest ends: on every start and change, and again every 30 seconds
  // so a long rest never outlives the 5 minutes Chrome gives a single wait.
  const alertSlot = Math.floor(remaining / 30)
  useEffect(() => {
    if (phase === 'running' && notify) void scheduleRestAlert(endsAt)
  }, [phase, notify, endsAt, alertSlot])

  useEffect(() => {
    if (phase === 'running' && notify && remaining > 0) void showRestCountdown(endsAt)
  }, [phase, notify, endsAt, remaining])

  useEffect(() => {
    if (phase === 'running' && remaining === 0) {
      haptics.success()
      // On screen, this card says "Rest over"; off screen, the service worker's alert does.
      if (document.visibilityState === 'visible') void clearRestNotification()
      setPhase('done')
    }
  }, [phase, remaining])

  useEffect(() => {
    if (phase !== 'done') return
    const timeout = setTimeout(() => setPhase('idle'), DONE_DISPLAY_MS)
    return () => clearTimeout(timeout)
  }, [phase])

  // Turning notifications off in Settings mid-rest takes the countdown out of the bar at once.
  useEffect(() => {
    if (!notificationsOn) void clearRestNotification()
  }, [notificationsOn])

  function adjustDefault(delta: number) {
    const next = clampSeconds(defaultSeconds + delta)
    setDefaultSecondsState(next)
    setDefaultRestSeconds(next)
  }

  function addFifteen() {
    setEndsAt((e) => e + 15000)
    runStartSeconds.current += 15
  }

  async function allowNotifications() {
    try {
      setPermission(await Notification.requestPermission())
    } catch {
      setPermission(notificationPermission())
    }
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
          {!autoStart && (
            <button
              type="button"
              onClick={() => start(defaultSeconds)}
              className="ml-1 rounded-lg bg-slate-700 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-slate-600"
            >
              Start
            </button>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="mb-3 flex items-center justify-center rounded-xl bg-emerald-600/20 py-3 text-sm font-medium text-emerald-400">
        Rest over. Go again
      </div>
    )
  }

  const pct = runStartSeconds.current > 0 ? Math.max(0, Math.min(100, (remaining / runStartSeconds.current) * 100)) : 0
  const showRing = !reducedMotion.current
  // Asked in context, the first time a rest starts, rather than as a prompt at sign-in.
  const askForPermission = notificationsOn && permission === 'default'

  return (
    <div className="mb-3 rounded-xl bg-slate-800/60 px-3 py-2.5">
      <div className="flex items-center gap-3">
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
          onClick={stop}
          className="rounded-lg bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-600"
        >
          Skip
        </button>
      </div>
      {askForPermission && (
        <div className="mt-2.5 border-t border-white/5 pt-2.5 text-xs text-slate-400">
          <p>Show the countdown in your notifications, with an alert when rest is over?</p>
          <div className="mt-1.5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRestTimerPref('notifications', false)}
              className="min-h-9 rounded-lg px-2 font-medium text-slate-400"
            >
              No thanks
            </button>
            <button
              type="button"
              onClick={() => void allowNotifications()}
              className="min-h-9 rounded-lg bg-slate-700 px-2.5 font-medium text-emerald-400 hover:bg-slate-600"
            >
              Allow
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
