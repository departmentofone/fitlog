import { useEffect, useState } from 'react'
import { useStartWorkoutTimer, useStopWorkoutTimer } from '../../hooks/useWorkouts'
import { formatDuration } from '../../lib/duration'
import type { WorkoutSession } from '../../types'

export function SessionTimer({ session }: { session: WorkoutSession }) {
  const start = useStartWorkoutTimer(session.id)
  const stop = useStopWorkoutTimer(session.id)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!session.started_at) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [session.started_at])

  const running = !!session.started_at
  const elapsed = running ? Math.floor((now - new Date(session.started_at!).getTime()) / 1000) : (session.duration_seconds ?? 0)

  return (
    <div className="flex items-center gap-2">
      <span className={`flex items-center gap-1.5 text-sm font-semibold tabular-nums ${running ? 'text-emerald-400' : 'text-slate-400'}`}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 2.5M10 2h4" />
        </svg>
        <span className="sr-only">Workout time </span>
        {formatDuration(Math.max(0, elapsed))}
      </span>
      {running ? (
        <button
          onClick={() => stop.mutate(session.started_at!)}
          className="min-h-8 rounded-lg bg-red-600/15 px-2.5 text-xs font-medium text-red-400 active:bg-red-600/30"
        >
          Stop
        </button>
      ) : (
        <button
          onClick={() => start.mutate()}
          className="min-h-8 rounded-lg bg-emerald-600/15 px-2.5 text-xs font-medium text-emerald-400 active:bg-emerald-600/30"
        >
          {session.duration_seconds ? 'Restart' : 'Start'}
        </button>
      )}
    </div>
  )
}
