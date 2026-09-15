import { useMemo, useState } from 'react'
import { FireStreak } from '../../components/FireStreak'
import { MonthCalendar } from '../../components/MonthCalendar'
import { useToast } from '../../components/ToastProvider'
import { useDietStreak } from '../../hooks/useDiet'
import { useUserSettings } from '../../hooks/useUserSettings'
import {
  useDeleteSession,
  useDeleteSet,
  useRestoreSession,
  useSessionDates,
  useSessionDetailForDate,
} from '../../hooks/useWorkouts'
import { useWorkoutStreaks } from '../../hooks/useWorkoutStreaks'
import { WeeklyDigestCard } from './WeeklyDigestCard'

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-800/60 px-3 py-2.5 text-center">
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

function DayDetail({ date }: { date: string }) {
  const { data: session, isLoading } = useSessionDetailForDate(date)
  const deleteSet = useDeleteSet(session?.id)
  const deleteSession = useDeleteSession()
  const restoreSession = useRestoreSession()
  const { undoable } = useToast()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  if (isLoading) return <p className="text-sm text-slate-400">Loading…</p>
  if (!session || session.workout_sets.length === 0) {
    return <p className="text-sm text-slate-500">No sets logged this day.</p>
  }

  const grouped = new Map<string, typeof session.workout_sets>()
  for (const s of session.workout_sets) {
    const key = s.exercise?.name ?? 'Unknown'
    grouped.set(key, [...(grouped.get(key) ?? []), s])
  }

  return (
    <div className="rounded-xl bg-slate-800/50 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">
          {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </h4>
        <div className="flex items-center gap-1.5">
          {session.preworkout && (
            <span className="rounded-full bg-emerald-600/20 px-2 py-0.5 text-xs text-emerald-400">Preworkout</span>
          )}
          <button
            onClick={() => {
              if (!confirmingDelete) {
                setConfirmingDelete(true)
                return
              }
              const snapshot = session
              setConfirmingDelete(false)
              undoable(
                'Workout deleted',
                () => deleteSession.mutate(session.id),
                () => restoreSession.mutate(snapshot),
              )
            }}
            onBlur={() => setConfirmingDelete(false)}
            aria-label="Delete workout"
            className={`rounded-full px-2 py-0.5 text-xs font-medium transition ${
              confirmingDelete ? 'bg-red-600 text-white' : 'bg-slate-700/60 text-slate-500 hover:text-red-400'
            }`}
          >
            {confirmingDelete ? 'Confirm?' : '🗑️'}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {Array.from(grouped.entries()).map(([name, sets]) => (
          <div key={name} className="text-xs text-slate-300">
            <p className="mb-1 font-medium text-slate-200">{name}</p>
            <div className="flex flex-wrap gap-1">
              {sets.map((s) => (
                <span
                  key={s.id}
                  className="flex items-center gap-1 rounded-md bg-slate-900/60 py-0.5 pl-2 pr-1 text-slate-400"
                >
                  {s.weight}×{s.reps}
                  <button
                    onClick={() => deleteSet.mutate(s.id)}
                    aria-label={`Delete set ${s.weight}×${s.reps}`}
                    className="rounded px-1 text-slate-600 hover:bg-red-600/20 hover:text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function HistoryView({ onBack }: { onBack: () => void }) {
  const { data: streaks } = useWorkoutStreaks()
  const { data: settings } = useUserSettings()
  const dietStreak = useDietStreak(settings?.calorie_goal ?? null, settings?.diet_goal ?? 'deficit')
  const { data: dates = [] } = useSessionDates()

  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const markedDates = useMemo(() => new Set(dates), [dates])

  return (
    <div className="space-y-4 p-4">
      <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-200">
        ← Back
      </button>

      <WeeklyDigestCard />

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
        <h3 className="mb-3 font-medium text-white">Workout history</h3>
        <MonthCalendar
          month={month}
          onMonthChange={setMonth}
          markedDates={markedDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          maxDate={new Date().toISOString().slice(0, 10)}
        />
        {selectedDate && (
          <div className="mt-3">
            <DayDetail date={selectedDate} />
          </div>
        )}
      </div>
    </div>
  )
}
