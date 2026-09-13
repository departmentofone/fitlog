import { useSessionHistory } from '../../hooks/useWorkouts'

export function HistoryTab() {
  const { data: sessions = [], isLoading } = useSessionHistory()

  if (isLoading) return <p className="p-4 text-slate-400">Loading…</p>

  if (sessions.length === 0) {
    return <p className="p-4 text-slate-500">No workout history yet.</p>
  }

  return (
    <div className="space-y-4 p-4">
      {sessions.map((session) => {
        const grouped = new Map<string, typeof session.workout_sets>()
        for (const s of session.workout_sets) {
          const key = s.exercise?.name ?? 'Unknown'
          grouped.set(key, [...(grouped.get(key) ?? []), s])
        }

        return (
          <div key={session.id} className="rounded-xl bg-slate-900 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium text-white">
                {new Date(session.date + 'T00:00:00').toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </h3>
              {session.preworkout && (
                <span className="rounded-full bg-emerald-600/20 px-2 py-0.5 text-xs text-emerald-400">
                  Preworkout
                </span>
              )}
            </div>
            {grouped.size === 0 ? (
              <p className="text-sm text-slate-500">No sets logged.</p>
            ) : (
              <div className="space-y-2">
                {Array.from(grouped.entries()).map(([name, sets]) => (
                  <div key={name} className="text-sm text-slate-300">
                    <span className="font-medium text-slate-200">{name}</span>{' '}
                    <span className="text-slate-500">
                      · {sets.map((s) => `${s.weight}×${s.reps}`).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
