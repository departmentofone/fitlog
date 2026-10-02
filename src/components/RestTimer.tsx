import { useEffect, useRef, useState } from 'react'
import { useRestPermission } from '../hooks/useRestPermission'
import { isAppActive } from '../lib/appState'
import { haptics } from '../lib/haptics'
import { isNativeApp } from '../lib/platform'
import {
  cancelRestAlert,
  cancelsAlertOnScreen,
  clearRestNotification,
  nativeRestChanged,
  refreshWorkerRestAlert,
  scheduleRestAlert,
  showRestCountdown,
} from '../lib/restNotification'
import { RestTimer as NativeRestTimer } from '../native/restTimer'
import { setRestTimerPref, useRestTimerPref } from '../lib/restTimerPrefs'
import { formatRestTime } from '../lib/restTime'


const STORAGE_KEY = 'fitlog-rest-seconds'
const DEFAULT_SECONDS = 90
const MIN_SECONDS = 15
const MAX_SECONDS = 300
const STEP_SECONDS = 15
const DONE_DISPLAY_MS = 3000
/** With FitLog on screen, the server's alert is called off this close to the end (see below). */
const ON_SCREEN_CANCEL_SECONDS = 3
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
 * the background. With rest timer notifications on (Settings), a "Resting" notification shows the
 * time rest ends (Android), and a "Rest over" alert arrives when it does, even with the phone
 * locked (see restNotification.ts).
 */
export function RestTimer({ restartKey }: { restartKey: number }) {
  const autoStart = useRestTimerPref('autoStart')
  const notificationsOn = useRestTimerPref('notifications')
  const [phase, setPhase] = useState<Phase>('idle')
  const [defaultSeconds, setDefaultSecondsState] = useState(() => getDefaultRestSeconds())
  const [endsAt, setEndsAt] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [permission, requestPermission] = useRestPermission()
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

  // In the app, the notification's own +15s and Skip change the rest too, and a rest can still be
  // counting from before the app was closed: stay in step with the native timer.
  const endsAtRef = useRef(endsAt)
  useEffect(() => {
    endsAtRef.current = endsAt
  }, [endsAt])
  useEffect(() => {
    if (!isNativeApp()) return
    let cancelled = false
    void NativeRestTimer.current()
      .then(({ endsAt: running }) => {
        if (cancelled || !running || running <= Date.now()) return
        nativeRestChanged(running)
        runStartSeconds.current = Math.ceil((running - Date.now()) / 1000)
        setNow(Date.now())
        setEndsAt(running)
        setPhase('running')
      })
      .catch(() => undefined)
    const listener = NativeRestTimer.addListener('changed', ({ endsAt: next }) => {
      nativeRestChanged(next)
      if (next) {
        runStartSeconds.current += Math.round((next - endsAtRef.current) / 1000)
        setNow(Date.now())
        setEndsAt(next)
        setPhase('running')
      } else if (endsAtRef.current - Date.now() > 1500) {
        // Skipped from the notification; a rest that simply ran out ends here on its own.
        setPhase('idle')
      }
    })
    return () => {
      cancelled = true
      void listener.then((l) => l.remove())
    }
  }, [])

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

  // Arrange the "Rest over" alert and show "Resting" on every start and +15s. Never once a second:
  // iOS turns each update into a new banner (see restNotification.ts).
  const cancelledOnScreen = useRef(false)
  useEffect(() => {
    if (phase !== 'running' || !notify) return
    cancelledOnScreen.current = false
    void scheduleRestAlert(endsAt)
    void showRestCountdown(endsAt)
  }, [phase, notify, endsAt])

  // The service worker's stand-in timer (used only without push) needs a re-post every 30 s.
  const alertSlot = Math.floor(remaining / 30)
  useEffect(() => {
    if (phase === 'running' && notify) void refreshWorkerRestAlert(endsAt)
  }, [phase, notify, endsAt, alertSlot])

  // On screen, this card says "Rest over", so the server's alert is called off just before rest
  // ends; a push can't be held back once it's sent, and iOS would show it on top of the app. If
  // FitLog leaves the screen in those last seconds, the alert is arranged again.
  useEffect(() => {
    if (phase !== 'running' || !notify || !cancelsAlertOnScreen()) return
    if (remaining <= ON_SCREEN_CANCEL_SECONDS && remaining > 0 && !cancelledOnScreen.current && document.visibilityState === 'visible') {
      cancelledOnScreen.current = true
      void cancelRestAlert()
    }
  }, [phase, notify, remaining])
  useEffect(() => {
    if (phase !== 'running' || !notify) return
    const onHidden = () => {
      if (document.visibilityState !== 'hidden' || !cancelledOnScreen.current) return
      cancelledOnScreen.current = false
      void scheduleRestAlert(endsAt)
    }
    document.addEventListener('visibilitychange', onHidden)
    return () => document.removeEventListener('visibilitychange', onHidden)
  }, [phase, notify, endsAt])

  useEffect(() => {
    if (phase === 'running' && remaining === 0) {
      // In the background, the app's own "Rest over" alert buzzes; don't buzz twice.
      if (isAppActive()) haptics.success()
      // On screen, this card says "Rest over"; off screen, the alert does. In the app, the native
      // timer decides that itself from Android's own record of what's on screen, so it's left
      // alone here: the page can count as visible while the app isn't.
      if (document.visibilityState === 'visible' && cancelsAlertOnScreen()) void clearRestNotification()
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
    await requestPermission()
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
          <p>Get an alert when rest is over, even with your phone locked?</p>
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
