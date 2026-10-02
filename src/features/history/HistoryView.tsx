import { useMemo, useState } from 'react'
import { MonthCalendar } from '../../components/MonthCalendar'
import { SkeletonLine } from '../../components/Skeleton'
import { SwipeToDelete } from '../../components/SwipeToDelete'
import { useToast } from '../../components/ToastProvider'
import { useDietStreak } from '../../hooks/useDiet'
import { useUserSettings } from '../../hooks/useUserSettings'
import {
  useAddSet,
  useDeleteSession,
  useDeleteSet,
  useRestoreSession,
  useSessionDates,
  useSessionHistory,
  useSessionDetailForDate,
  todayISO,
} from '../../hooks/useWorkouts'
import { useWorkoutStreaks } from '../../hooks/useWorkoutStreaks'
import { formatDuration, formatDurationLabel } from '../../lib/duration'
import { formatWeight, toDisplayTotal, weightUnitLabel } from '../../lib/units'
import { formatDayLabel } from '../../components/DateNav'
import { WeeklyDigestCard } from './WeeklyDigestCard'

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="tile px-3 py-2.5 text-center">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
      {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
    </div>
  )
}

function DayDetail({ date }: { date: string }) {
  const { data: session, isLoading } = useSessionDetailForDate(date)
  const { data: settings } = useUserSettings()
  const unit = settings?.unit_system
  const deleteSet = useDeleteSet(session?.id)
  const addSet = useAddSet(session?.id)
  const deleteSession = useDeleteSession()
  const restoreSession = useRestoreSession()
  const { undoable } = useToast()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-2 rounded-2xl bg-slate-800/50 p-3">
        <SkeletonLine className="h-4 w-1/2" />
        <SkeletonLine className="h-3 w-full" />
        <SkeletonLine className="h-3 w-2/3" />
      </div>
    )
  }
  if (!session || session.workout_sets.length === 0) {
    return <p className="text-sm text-slate-500">No sets logged this day.</p>
  }

  // Same as deleting from the Log: gone at once, back with Undo, in its old place and time.
  function deleteWithUndo(s: NonNullable<typeof session>['workout_sets'][number]) {
    undoable(
      `Removed ${formatWeight(s.weight, unit)} × ${s.reps}`,
      () => deleteSet.mutate(s.id),
      () =>
        addSet.mutate({
          exerciseId: s.exercise_id,
          setNumber: s.set_number,
          weight: s.weight,
          reps: s.reps,
          difficulty: s.difficulty,
          isWarmup: s.is_warmup,
          supersetGroup: s.superset_group,
          restore: true,
          createdAt: s.created_at,
        }),
    )
  }

  const grouped = new Map<string, typeof session.workout_sets>()
  for (const s of session.workout_sets) {
    const key = s.exercise?.name ?? 'Unknown'
    grouped.set(key, [...(grouped.get(key) ?? []), s])
  }

  return (
    <div className="rounded-2xl bg-slate-800/50 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">
          {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </h3>
        <div className="flex items-center gap-1.5">
          {session.duration_seconds != null && (
            <span className="flex items-center gap-1 rounded-full bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300">
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="13" r="8" />
                <path d="M12 9v4l2.5 2.5M10 2h4" />
              </svg>
              <span className="sr-only">Workout length </span>
              {formatDuration(session.duration_seconds)}
            </span>
          )}
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
              confirmingDelete ? 'bg-red-600 text-on-accent' : 'bg-slate-700/60 text-slate-500 hover:text-red-400'
            }`}
          >
            {confirmingDelete ? (
              'Confirm?'
            ) : (
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {session.notes && (
        <p className="mb-2 whitespace-pre-wrap rounded-lg bg-slate-800/60 px-2.5 py-1.5 text-xs text-slate-300">{session.notes}</p>
      )}
      <div className="space-y-2">
        {Array.from(grouped.entries()).map(([name, sets]) => (
          <div key={name} className="text-xs text-slate-300">
            <p className="mb-1 font-medium text-slate-200">{name}</p>
            <div className="flex flex-wrap gap-1">
              {sets.map((s) => (
                <SwipeToDelete key={s.id} onDelete={() => deleteWithUndo(s)} className="rounded-md">
                  <span className="flex items-center gap-1 rounded-md bg-slate-900/60 py-0.5 pl-2 pr-0.5 tabular-nums text-slate-400">
                    {s.weight > 0 ? `${formatWeight(s.weight, unit)} × ${s.reps}` : `${s.reps} reps`}
                    <button
                      onClick={() => deleteWithUndo(s)}
                      aria-label={`Delete set ${formatWeight(s.weight, unit)} × ${s.reps}`}
                      className="flex h-5 w-5 items-center justify-center rounded text-slate-600 hover:bg-red-600/20 hover:text-red-400"
                    >
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </span>
                </SwipeToDelete>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const RECENT_SHOWN = 6

/**
 * The last few workouts as rows under the calendar, newest first, so the past weeks are a scroll
 * away instead of a month-flip and a tap on each day.
 */
function RecentWorkouts({ onOpen }: { onOpen: (date: string) => void }) {
  const { data: sessions = [], isLoading } = useSessionHistory()
  const { data: settings } = useUserSettings()
  const [all, setAll] = useState(false)
  const unit = settings?.unit_system

  const rows = sessions
    .filter((s) => s.workout_sets.length > 0)
    .map((s) => {
      const working = s.workout_sets.filter((w) => !w.is_warmup)
      const names: string[] = []
      for (const w of s.workout_sets) {
        const n = w.exercise?.name
        if (n && !names.includes(n)) names.push(n)
      }
      return {
        id: s.id,
        date: s.date,
        duration: s.duration_seconds,
        volume: working.reduce((sum, w) => sum + w.weight * w.reps, 0),
        sets: working.length,
        names,
      }
    })

  if (isLoading || rows.length === 0) return null
  const shown = all ? rows : rows.slice(0, RECENT_SHOWN)

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="card-title">Recent workouts</h2>
        {rows.length > RECENT_SHOWN && (
          <button onClick={() => setAll((v) => !v)} className="-my-2 -mr-2 min-h-11 px-2 text-xs font-medium text-emerald-400">
            {all ? 'Show fewer' : `All ${rows.length}`}
          </button>
        )}
      </div>
      <div className="divide-y divide-white/5">
        {shown.map((r) => (
          <button key={r.id} onClick={() => onOpen(r.date)} className="flex w-full items-start justify-between gap-3 py-2.5 text-left transition active:bg-white/5">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-white">{formatDayLabel(r.date)}</span>
              <span className="mt-0.5 block truncate text-xs text-slate-400">
                {r.names.slice(0, 3).join(', ')}
                {r.names.length > 3 && ` +${r.names.length - 3} more`}
              </span>
            </span>
            <span className="shrink-0 text-right text-xs tabular-nums text-slate-400">
              <span className="block font-medium text-slate-200">
                {Math.round(toDisplayTotal(r.volume, unit)).toLocaleString()} {weightUnitLabel(unit)}
              </span>
              <span className="block">
                {r.sets} {r.sets === 1 ? 'set' : 'sets'}
                {r.duration ? ` · ${formatDurationLabel(r.duration)}` : ''}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function HistoryView() {
  const { data: streaks } = useWorkoutStreaks()
  const { data: settings } = useUserSettings()
  const dietStreak = useDietStreak(settings?.calorie_goal ?? null, settings?.diet_goal ?? 'deficit')
  const { data: dates = [] } = useSessionDates()

  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const markedDates = useMemo(() => new Set(dates), [dates])

  return (
    <div className="space-y-4 p-4">

      <WeeklyDigestCard />

      {/* Streaks as one row of three - it was two cards' worth of tiles repeating the streak pills
          already shown on Workouts and Diet. Left out until there's something to count. */}
      {((streaks?.totalSessions ?? 0) > 0 || (dietStreak.data?.best ?? 0) > 0) && (
        <div className="grid grid-cols-3 gap-2">
          <StatTile label="Training" value={`${streaks?.currentStreak ?? 0}d`} sub={`streak · best ${streaks?.bestStreak ?? 0}`} />
          <StatTile label="Diet" value={`${dietStreak.data?.current ?? 0}d`} sub={`streak · best ${dietStreak.data?.best ?? 0}`} />
          <StatTile label="Workouts" value={String(streaks?.totalSessions ?? 0)} sub="logged" />
        </div>
      )}

      <div className="card p-4">
        <h2 className="mb-3 card-title">Workout history</h2>
        <MonthCalendar
          month={month}
          onMonthChange={setMonth}
          markedDates={markedDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          maxDate={todayISO()}
        />
        {selectedDate && (
          <div id="history-day-detail" className="mt-3 scroll-mt-4">
            <DayDetail date={selectedDate} />
          </div>
        )}
      </div>

      <RecentWorkouts
        onOpen={(date) => {
          const d = new Date(date + 'T00:00:00')
          setMonth(new Date(d.getFullYear(), d.getMonth(), 1))
          setSelectedDate(date)
          setTimeout(() => document.getElementById('history-day-detail')?.scrollIntoView({ block: 'start' }), 60)
        }}
      />
    </div>
  )
}
