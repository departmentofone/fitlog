import { useMemo, useState } from 'react'
import { SkeletonCard } from '../../components/Skeleton'
import { useAchievementsData } from '../../hooks/useAchievements'
import { useBackToClose } from '../../hooks/useHashRoute'
import { useExercises } from '../../hooks/useExercises'
import { useUserSettings } from '../../hooks/useUserSettings'
import {
  computeAwards,
  groupLadders,
  monthlyChallenge,
  nextUp,
  personalRecords,
  type Award,
  type AwardCategory,
  type AwardLadder,
} from '../../lib/awards'
import { formatWeight, toDisplayTotal, weightUnitLabel } from '../../lib/units'
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

/** Compact caption under a collection medal. */
function shortProgress(a: Award): string {
  if (a.unit === '× bodyweight') return a.current > 0 ? `${a.current.toFixed(2)}× of ${a.target}×` : 'Not logged yet'
  return `${Math.min(a.current, a.target)} / ${a.target}`
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
      <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} />
    </div>
  )
}

const TIER_NAME: Record<Award['tier'], string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' }

/** A ladder's details: every tier, what earns it, and progress to the next one. */
function LadderSheet({ ladder, onClose }: { ladder: AwardLadder; onClose: () => void }) {
  useBackToClose(true, onClose)
  const { earned, next } = ladder
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="fade-in absolute inset-0 bg-black/60" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ladder.name}
        onClick={(e) => e.stopPropagation()}
        className="sheet-up relative rounded-t-3xl border-t border-white/10 bg-slate-950 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-700" />
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">{CATEGORY_LABEL[ladder.category]}</p>
        <h2 className="mt-1 text-center text-xl font-semibold text-white">{ladder.name}</h2>
        <p className="mt-1 text-center text-sm text-slate-400">
          {earned ? `${TIER_NAME[earned.tier]} earned` : 'Not earned yet'}
          {next ? ` · next: ${TIER_NAME[next.tier].toLowerCase()}` : ' · every tier complete'}
        </p>

        <div className="mt-4 space-y-2">
          {ladder.tiers.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-slate-900 px-3 py-2">
              <Medal tier={t.tier} category={t.category} unlocked={t.unlocked} progress={t.current / t.target} size={40} />
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-medium ${t.unlocked ? 'text-white' : 'text-slate-300'}`}>{t.title}</span>
                <span className="block text-xs text-slate-500">{t.description}</span>
              </span>
              {t.unlocked ? (
                <ShareCardButton data={{ type: 'tier', title: t.title, value: TIER_NAME[t.tier], subtitle: t.description }} />
              ) : (
                t === next && <span className="shrink-0 text-xs text-slate-400">{formatProgress(t)}</span>
              )}
            </div>
          ))}
        </div>

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
  const { data: settings } = useUserSettings()
  const unit = settings?.unit_system
  const [openLadder, setOpenLadder] = useState<AwardLadder | null>(null)
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
  const ladders = groupLadders(awards)
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
              <button
                key={a.id}
                onClick={() => setOpenLadder(ladders.find((l) => l.id === a.ladder) ?? null)}
                className="flex w-full items-center gap-3 text-left"
              >
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
              const isNew = r.improved && new Date(r.achievedAt).getTime() >= recentCutoff
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
                      {formatWeight(r.weight, unit)} × {r.reps} ·{' '}
                      {new Date(r.achievedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold text-white">{Math.round(toDisplayTotal(r.best1RM, unit))} {weightUnitLabel(unit)}</span>
                    <span className="block text-[11px] text-slate-500">est. 1RM</span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* The long-term collection: one medal per achievement, at the tier you've reached. */}
      <div className={card}>
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-medium text-white">Medals</h3>
          <span className="text-xs text-slate-400">
            {earned} earned
          </span>
        </div>
        <div className="grid grid-cols-3 gap-x-2 gap-y-4">
          {CATEGORY_ORDER.flatMap((category) => ladders.filter((l) => l.category === category)).map((l) => {
            const shown = l.earned ?? l.next ?? l.tiers[0]
            const progressTo = l.next
            return (
              <button
                key={l.id}
                onClick={() => setOpenLadder(l)}
                aria-label={`${l.name}: ${l.earned ? `${TIER_NAME[l.earned.tier]} earned` : 'not earned yet'}`}
                className="flex flex-col items-center gap-1 text-center"
              >
                <Medal
                  tier={shown.tier}
                  category={l.category}
                  unlocked={!!l.earned}
                  progress={progressTo ? progressTo.current / progressTo.target : 1}
                  size={56}
                />
                <span className={`text-xs font-medium leading-tight ${l.earned ? 'text-slate-200' : 'text-slate-400'}`}>{l.name}</span>
                <span className="text-[11px] leading-tight text-slate-500">
                  {l.earned ? TIER_NAME[l.earned.tier] : progressTo ? shortProgress(progressTo) : ''}
                </span>
              </button>
            )
          })}
        </div>
        {data.currentWeightKg == null && (
          <p className="mt-4 text-xs text-slate-500">Add your weight in Goals to unlock the bodyweight strength medals.</p>
        )}
      </div>

      {openLadder && <LadderSheet ladder={openLadder} onClose={() => setOpenLadder(null)} />}
      {openExercise && <ExerciseDetailModal exercise={openExercise} onClose={() => setOpenExercise(null)} />}
    </div>
  )
}
