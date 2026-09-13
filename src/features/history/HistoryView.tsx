import { FireStreak } from '../../components/FireStreak'
import { useDietStreak } from '../../hooks/useDiet'
import { useUserSettings } from '../../hooks/useUserSettings'
import { useSessionHistory } from '../../hooks/useWorkouts'
import { useWorkoutStreaks } from '../../hooks/useWorkoutStreaks'

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-800/60 px-3 py-2.5 text-center">
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

export function HistoryView({ onBack }: { onBack: () => void }) {
  const { data: streaks } = useWorkoutStreaks()
  const { data: settings } = useUserSettings()
  const dietStreak = useDietStreak(settings?.calorie_goal ?? null, settings?.diet_goal ?? 'deficit')
  const { data: sessions = [], isLoading } = useSessionHistory()

  return (
    <div className="space-y-4 p-4">
      <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-200">
        ← Back
      </button>

      <div className="rounded-2xl bg-gradient-to-br from-emerald-600/20 to-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h2 className="mb-3 text-sm font-medium text-slate-300">Streaks</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-800/60 p-3">
            <FireStreak count={streaks?.currentStreak ?? 0} />
            <p className="mt-1 text-xs text-slate-500">Workout streak</p>
          </div>
          <div className="rounded-xl bg-slate-800/60 p-3">
            <FireStreak count={dietStreak.data?.current ?? 0} />
            <p className="mt-1 text-xs text-slate-500">On-target diet streak</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <StatTile label="Workouts logged" value={String(streaks?.totalSessions ?? 0)} />
          <StatTile label="Best workout streak" value={`${streaks?.bestStreak ?? 0}d`} />
          <StatTile label="Best diet streak" value={`${dietStreak.data?.best ?? 0}d`} />
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h3 className="mb-3 font-medium text-white">History</h3>
        {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
        {!isLoading && sessions.length === 0 && <p className="text-sm text-slate-500">No workout history yet.</p>}
        <div className="space-y-3">
          {sessions.map((session) => {
            const grouped = new Map<string, typeof session.workout_sets>()
            for (const s of session.workout_sets) {
              const key = s.exercise?.name ?? 'Unknown'
              grouped.set(key, [...(grouped.get(key) ?? []), s])
            }

            return (
              <div key={session.id} className="rounded-xl bg-slate-800/50 p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-white">
                    {new Date(session.date + 'T00:00:00').toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </h4>
                  {session.preworkout && (
                    <span className="rounded-full bg-emerald-600/20 px-2 py-0.5 text-xs text-emerald-400">
                      Preworkout
                    </span>
                  )}
                </div>
                {grouped.size === 0 ? (
                  <p className="text-xs text-slate-500">No sets logged.</p>
                ) : (
                  <div className="space-y-1">
                    {Array.from(grouped.entries()).map(([name, sets]) => (
                      <div key={name} className="text-xs text-slate-300">
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
      </div>
    </div>
  )
}
