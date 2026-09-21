import { useMemo, useState } from 'react'
import { SkeletonCard } from '../../components/Skeleton'
import { useAchievementsData } from '../../hooks/useAchievements'
import { useBackToClose } from '../../hooks/useHashRoute'
import { useExercises } from '../../hooks/useExercises'
import { computeAwards, monthlyChallenge, nextUp, personalRecords, type Award, type AwardCategory } from '../../lib/awards'
import type { Exercise } from '../../types'
import { ExerciseDetailModal } from '../workouts/ExerciseDetailModal'
import { Medal } from './Medal'
import { ShareCardButton } from './ShareCard'

/**
 * Awards, rethought from what users say about competitors:
 * - Real personal records are what lifters value most (Hevy's PR medals, Strong's records table).
 * - A short, time-boxed monthly challenge plus a long-term collection gives two reasons to come back
 *   (Strava, Apple's monthly challenges).
 * - Badges for merely using a feature read as "gold stars for adults", so there are none; every medal
 *   is earned by training, eating or fasting consistently, or getting stronger.
 * - Always show the next step and how close it is.
 */

const CATEGORY_LABEL: Record<AwardCategory, string> = {
  consistency: 'Consistency',
  strength: 'Strength',
  nutrition: 'Nutrition',
  fasting: 'Fasting',
}
const CATEGORY_ORDER: AwardCategory[] = ['consistency', 'strength', 'nutrition', 'fasting']
const RECENT_DAYS = 14
const RECORDS_SHOWN = 5

const card = 'rounded-3xl border-t border-white/10 bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5'

function formatProgress(a: Award): string {
  const current = a.unit === '× bodyweight' ? a.current.toFixed(2) : Math.min(a.current, a.target)
  return `${current} / ${a.target} ${a.unit}`
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
      <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} />
    </div>
  )
}

function AwardSheet({ award, onClose }: { award: Award; onClose: () => void }) {
  useBackToClose(true, onClose)
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="fade-in absolute inset-0 bg-black/60" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={award.title}
        onClick={(e) => e.stopPropagation()}
        className="sheet-up relative rounded-t-3xl border-t border-white/10 bg-slate-950 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-700" />
        <div className="flex justify-center">
          <Medal tier={award.tier} category={award.category} unlocked={award.unlocked} progress={award.current / award.target} size={88} />
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {award.tier} · {CATEGORY_LABEL[award.category]}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-white">{award.title}</h2>
        <p className="mt-1 text-sm text-slate-400">{award.description}</p>
        {!award.unlocked && (
          <div className="mx-auto mt-4 max-w-xs">
            <ProgressBar value={award.current / award.target} />
            <p className="mt-1.5 text-xs text-slate-400">{formatProgress(award)}</p>
          </div>
        )}
        {award.unlocked && (
          <div className="mt-4 flex justify-center">
            <ShareCardButton data={{ type: 'tier', title: award.title, value: award.tier[0].toUpperCase() + award.tier.slice(1), subtitle: award.description }} />
          </div>
        )}
        <button onClick={onClose} className="mt-4 min-h-11 w-full rounded-xl bg-slate-800 text-sm font-medium text-slate-200">
          Close
        </button>
      </div>
    </div>
  )
}

export function AchievementsTab() {
  const data = useAchievementsData()
  const { data: exercises = [] } = useExercises()
  const [openAward, setOpenAward] = useState<Award | null>(null)
  const [openExercise, setOpenExercise] = useState<Exercise | null>(null)
  const [allRecords, setAllRecords] = useState(false)

  const awards = useMemo(
    () =>
      computeAwards({
        sets: data.sets,
        totalWorkouts: data.totalWorkouts,
        bestWorkoutStreak: data.bestWorkoutStreak,
        bestDietStreak: data.bestDietStreak,
        completedFasts: data.completedFasts,
        currentWeightKg: data.currentWeightKg,
      }),
    [data.sets, data.totalWorkouts, data.bestWorkoutStreak, data.bestDietStreak, data.completedFasts, data.currentWeightKg],
  )
  const records = useMemo(() => personalRecords(data.sets), [data.sets])
  const challenge = useMemo(() => monthlyChallenge(data.sessionDates), [data.sessionDates])

  if (data.isLoading) {
    return (
      <div className="space-y-4 p-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={3} />
      </div>
    )
  }

  const earned = awards.filter((a) => a.unlocked).length
  const upcoming = nextUp(awards)
  const recentCutoff = Date.now() - RECENT_DAYS * 86_400_000
  const shownRecords = allRecords ? records : records.slice(0, RECORDS_SHOWN)
  const challengeDone = challenge.done >= challenge.target

  return (
    <div className="space-y-4 p-4">
      {/* This month: the short-term goal. */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-600/20 to-slate-900 p-4 shadow-[var(--glow-shadow)] ring-1 ring-white/5">
        <p className="text-xs font-medium text-slate-400">{challenge.monthLabel} challenge</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <p className="text-lg font-semibold text-white">
            {challengeDone ? 'Challenge complete' : `${challenge.target} workouts this month`}
          </p>
          <p className="shrink-0 text-sm text-slate-300">
            <span className="text-xl font-bold text-white">{challenge.done}</span> / {challenge.target}
          </p>
        </div>
        <div className="mt-2">
          <ProgressBar value={challenge.done / challenge.target} />
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          {challengeDone
            ? 'Anything more is a bonus.'
            : `${challenge.target - challenge.done} to go · ${challenge.daysLeft} day${challenge.daysLeft === 1 ? '' : 's'} left`}
        </p>
      </div>

      {/* Next up: the closest locked awards, with progress. */}
      {upcoming.length > 0 && (
        <div className={card}>
          <h3 className="mb-3 font-medium text-white">Almost there</h3>
          <div className="space-y-3">
            {upcoming.map((a) => (
              <button key={a.id} onClick={() => setOpenAward(a)} className="flex w-full items-center gap-3 text-left">
                <Medal tier={a.tier} category={a.category} unlocked={false} progress={a.current / a.target} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium text-white">{a.title}</span>
                    <span className="shrink-0 text-xs text-slate-400">{formatProgress(a)}</span>
                  </span>
                  <span className="mt-1.5 block">
                    <ProgressBar value={a.current / a.target} />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Personal records: the thing lifters actually care about. */}
      <div className={card}>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-medium text-white">Personal records</h3>
          {records.length > RECORDS_SHOWN && (
            <button onClick={() => setAllRecords((v) => !v)} className="-my-2 -mr-2 min-h-11 px-2 text-xs font-medium text-emerald-400">
              {allRecords ? 'Show fewer' : `All ${records.length}`}
            </button>
          )}
        </div>
        {records.length === 0 ? (
          <p className="text-sm text-slate-500">Your best lifts will show up here once you've logged a few workouts.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {shownRecords.map((r) => {
              const isNew = new Date(r.achievedAt).getTime() >= recentCutoff
              const exercise = exercises.find((e) => e.id === r.exerciseId)
              return (
                <button
                  key={r.exerciseId}
                  onClick={() => exercise && setOpenExercise(exercise)}
                  disabled={!exercise}
                  className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-white">{r.exerciseName}</span>
                      {isNew && (
                        <span className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-400">
                          New
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {r.weight} kg × {r.reps} ·{' '}
                      {new Date(r.achievedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold text-white">{Math.round(r.best1RM)} kg</span>
                    <span className="block text-[11px] text-slate-500">est. 1RM</span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* The long-term collection. */}
      <div className={card}>
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-medium text-white">Medals</h3>
          <span className="text-xs text-slate-400">
            {earned} of {awards.length} earned
          </span>
        </div>
        <div className="space-y-4">
          {CATEGORY_ORDER.map((category) => {
            const inCategory = awards.filter((a) => a.category === category)
            if (inCategory.length === 0) return null
            return (
              <div key={category}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{CATEGORY_LABEL[category]}</p>
                <div className="grid grid-cols-4 gap-x-2 gap-y-3">
                  {inCategory.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setOpenAward(a)}
                      aria-label={`${a.title}${a.unlocked ? ', earned' : `, ${formatProgress(a)}`}`}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <Medal tier={a.tier} category={a.category} unlocked={a.unlocked} progress={a.current / a.target} size={52} />
                      <span className={`line-clamp-2 text-[11px] leading-tight ${a.unlocked ? 'text-slate-200' : 'text-slate-500'}`}>
                        {a.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          {data.currentWeightKg == null && (
            <p className="text-xs text-slate-500">Add your weight in Goals to unlock the bodyweight strength medals.</p>
          )}
        </div>
      </div>

      {openAward && <AwardSheet award={openAward} onClose={() => setOpenAward(null)} />}
      {openExercise && <ExerciseDetailModal exercise={openExercise} onClose={() => setOpenExercise(null)} />}
    </div>
  )
}
