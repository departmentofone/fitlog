import {
  funVolumeComparison,
  SESSION_BADGES,
  STREAK_BADGES,
  useAchievements,
  VOLUME_BADGES,
} from '../../hooks/useAchievements'
import { useSessionHistory } from '../../hooks/useWorkouts'

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-800/60 px-3 py-2.5 text-center">
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

function BadgeRow({
  emoji,
  label,
  unlocked,
}: {
  emoji: string
  label: string
  unlocked: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
        unlocked ? 'bg-emerald-600/10' : 'bg-slate-800/40'
      }`}
    >
      <span className={`text-xl ${unlocked ? '' : 'opacity-30 grayscale'}`}>{emoji}</span>
      <span className={`text-sm ${unlocked ? 'text-white' : 'text-slate-500'}`}>{label}</span>
      {unlocked && <span className="ml-auto text-xs text-emerald-400">Unlocked</span>}
    </div>
  )
}

export function ProgressTab() {
  const { data: achievements } = useAchievements()
  const { data: sessions = [], isLoading } = useSessionHistory()

  const comparison = achievements ? funVolumeComparison(achievements.totalVolumeKg) : null

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600/20 to-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h2 className="mb-1 text-sm font-medium text-slate-300">Total weight moved</h2>
        <p className="text-3xl font-bold text-white">
          {Math.round(achievements?.totalVolumeKg ?? 0).toLocaleString()} <span className="text-lg font-medium text-slate-400">kg</span>
        </p>
        {comparison && <p className="mt-1 text-xs text-slate-400">{comparison}</p>}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatTile label="Workouts" value={String(achievements?.totalSessions ?? 0)} />
          <StatTile label="Current streak" value={`${achievements?.currentStreak ?? 0}d`} />
          <StatTile label="Best streak" value={`${achievements?.bestStreak ?? 0}d`} />
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h3 className="mb-3 font-medium text-white">Badges</h3>
        <div className="space-y-1.5">
          {SESSION_BADGES.map((b) => (
            <BadgeRow
              key={b.label}
              emoji={b.emoji}
              label={b.label}
              unlocked={(achievements?.totalSessions ?? 0) >= b.threshold}
            />
          ))}
          {STREAK_BADGES.map((b) => (
            <BadgeRow
              key={b.label}
              emoji={b.emoji}
              label={b.label}
              unlocked={(achievements?.bestStreak ?? 0) >= b.threshold}
            />
          ))}
          {VOLUME_BADGES.map((b) => (
            <BadgeRow
              key={b.label}
              emoji={b.emoji}
              label={b.label}
              unlocked={(achievements?.totalVolumeKg ?? 0) >= b.threshold}
            />
          ))}
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
