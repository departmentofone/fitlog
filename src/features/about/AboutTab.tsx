import { TabIcon } from '../../components/TabIcon'
import { useSessionDates } from '../../hooks/useWorkouts'
import { useWorkoutStreaks } from '../../hooks/useWorkoutStreaks'
import { formatBuildTime } from '../../lib/buildInfo'
import type { Tab } from '../../types'

const AREAS: { icon: Tab | 'progress'; name: string; text: string }[] = [
  { icon: 'workouts', name: 'Train', text: 'Sets, reps and weight for every exercise, with a rest timer, presets, programs and your personal records.' },
  { icon: 'meals', name: 'Eat', text: 'Meals by the gram or by the serving, macros and calories against a goal, water, fasting and a barcode scanner.' },
  { icon: 'progress', name: 'Progress', text: 'Weight, measurements and progress photos over time, plus medals for the lifts and habits that add up.' },
  { icon: 'community', name: 'Community', text: 'Ready-made diets, meal plans and workouts, and anything people choose to share.' },
]

/** "your first workout was on 2 Jun 2026, 31 logged since" - only once there's a history to speak of. */
function YourFitLog() {
  const { data: streaks } = useWorkoutStreaks()
  const { data: dates = [] } = useSessionDates()
  const total = streaks?.totalSessions ?? 0
  if (total === 0 || dates.length === 0) return null
  const first = [...dates].sort()[0]
  const since = new Date(first + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="card p-4">
      <h2 className="card-title">Your FitLog so far</h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-400">
        <span className="font-semibold text-white">{total.toLocaleString()}</span> {total === 1 ? 'workout' : 'workouts'} logged since {since}
        {(streaks?.bestStreak ?? 0) > 1 && (
          <>
            , with a best streak of <span className="font-semibold text-white">{streaks!.bestStreak} days</span>
          </>
        )}
        .
      </p>
    </div>
  )
}

export function AboutTab() {
  return (
    <div className="space-y-4 p-4">
      <div className="card card-glow flex items-center gap-4 p-4">
        <span className="area-mark flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-emerald-400">
          <TabIcon tab="workouts" className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-white">FitLog</h2>
          <p className="text-sm text-slate-400">Workouts, meals and fasts in one log.</p>
        </div>
      </div>

      <YourFitLog />

      <div className="card p-4">
        <h2 className="mb-3 card-title">What's in it</h2>
        <ul className="space-y-3">
          {AREAS.map((a) => (
            <li key={a.name} className="flex gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <TabIcon tab={a.icon} className="h-[18px] w-[18px]" />
              </span>
              <p className="text-sm leading-relaxed text-slate-400">
                <span className="font-semibold text-white">{a.name}.</span> {a.text}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-4">
        <h2 className="mb-2 card-title">Who makes it</h2>
        <p className="text-sm leading-relaxed text-slate-400">
          One person, who builds it, fixes it and reads every message sent from Feedback & support in Settings.
        </p>
      </div>

      <div className="card p-4">
        <h2 className="mb-2 card-title">Data & privacy</h2>
        <p className="text-sm leading-relaxed text-slate-400">
          Your data is private to your account. It isn't sold or used for ads, and FitLog has no trackers.
          You can export everything or delete your account at any time from Settings.
        </p>
        <a
          href="/privacy"
          target="_blank"
          rel="noopener"
          className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-emerald-400"
        >
          Read the privacy policy
        </a>
      </div>

      <p className="text-center text-xs text-slate-500">Build {formatBuildTime()}</p>
    </div>
  )
}
