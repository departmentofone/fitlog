import { useEffect, useState } from 'react'
import { useStartWorkoutTimer, useStopWorkoutTimer } from '../../hooks/useWorkouts'
import type { WorkoutSession } from '../../types'

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

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
    <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5">
      <span className={`text-sm font-mono ${running ? 'text-emerald-400' : 'text-slate-400'}`}>
        {formatDuration(Math.max(0, elapsed))}
      </span>
      {running ? (
        <button
          onClick={() => stop.mutate(session.started_at!)}
          className="rounded-md bg-red-600/20 px-2 py-0.5 text-xs font-medium text-red-400 hover:bg-red-600/30"
        >
          Stop
        </button>
      ) : (
        <button
          onClick={() => start.mutate()}
          className="rounded-md bg-emerald-600/20 px-2 py-0.5 text-xs font-medium text-emerald-400 hover:bg-emerald-600/30"
        >
          {session.duration_seconds ? 'Restart' : 'Start'}
        </button>
      )}
    </div>
  )
}
