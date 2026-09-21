import { bestLiftEstimates, countGenuinePRs, STRENGTH_STANDARDS, type LiftKey, type SetForAchievements } from './achievements'
import { estimate1RM } from './oneRepMax'

/**
 * Awards, redesigned around what reviewers of other fitness apps say works:
 * - earned for training, eating and fasting consistently or getting stronger - never for merely
 *   using a feature ("first saved preset" is the "gold star for adults" people resent);
 * - tiered (bronze → silver → gold → platinum) so there's always a next step, with visible progress;
 * - paired with a short, time-boxed monthly challenge (Strava/Apple's "two reasons to come back").
 */

export type AwardCategory = 'consistency' | 'strength' | 'nutrition' | 'fasting'
export type AwardTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface Award {
  id: string
  /** The ladder this tier belongs to (e.g. "workouts"), and its display name ("Workouts"). */
  ladder: string
  ladderName: string
  category: AwardCategory
  tier: AwardTier
  title: string
  /** What earns it, in plain words. */
  description: string
  current: number
  target: number
  unlocked: boolean
  /** Formats progress numbers, e.g. "12 / 25 workouts". */
  unit: string
}

export interface AwardInput {
  sets: SetForAchievements[]
  totalWorkouts: number
  bestWorkoutStreak: number
  bestDietStreak: number
  /** Fasts that reached their target length. */
  completedFasts: number
  currentWeightKg: number | null
}

const TIERS: AwardTier[] = ['bronze', 'silver', 'gold', 'platinum']

function ladder(
  id: string,
  ladderName: string,
  category: AwardCategory,
  current: number,
  steps: { target: number; title: string }[],
  describe: (target: number) => string,
  unit: string,
): Award[] {
  return steps.map((step, i) => ({
    id: `${id}-${step.target}`,
    ladder: id,
    ladderName,
    category,
    tier: TIERS[Math.min(i, TIERS.length - 1)],
    title: step.title,
    description: describe(step.target),
    current,
    target: step.target,
    unlocked: current >= step.target,
    unit,
  }))
}

export function computeAwards(input: AwardInput): Award[] {
  const prCount = countGenuinePRs(input.sets)
  const awards: Award[] = [
    ...ladder(
      'workouts',
      'Workouts',
      'consistency',
      input.totalWorkouts,
      [
        { target: 10, title: '10 workouts' },
        { target: 50, title: '50 workouts' },
        { target: 150, title: '150 workouts' },
        { target: 365, title: '365 workouts' },
      ],
      (t) => `Log ${t} workouts`,
      'workouts',
    ),
    ...ladder(
      'streak',
      'Training streak',
      'consistency',
      input.bestWorkoutStreak,
      [
        { target: 7, title: 'One-week streak' },
        { target: 30, title: 'One-month streak' },
        { target: 90, title: 'Three-month streak' },
        { target: 365, title: 'One-year streak' },
      ],
      (t) => `Keep a ${t}-day training streak (rest days count)`,
      'days',
    ),
    ...ladder(
      'prs',
      'Personal records',
      'strength',
      prCount,
      [
        { target: 1, title: 'First PR' },
        { target: 10, title: '10 PRs' },
        { target: 50, title: '50 PRs' },
        { target: 150, title: '150 PRs' },
      ],
      (t) => (t === 1 ? 'Beat one of your own bests' : `Beat your own best ${t} times`),
      'PRs',
    ),
    ...ladder(
      'diet',
      'On-target days',
      'nutrition',
      input.bestDietStreak,
      [
        { target: 7, title: 'On target for a week' },
        { target: 30, title: 'On target for a month' },
        { target: 90, title: 'On target for 3 months' },
      ],
      (t) => `Hit your calorie target ${t} days in a row`,
      'days',
    ),
    ...ladder(
      'fasts',
      'Full fasts',
      'fasting',
      input.completedFasts,
      [
        { target: 1, title: 'First full fast' },
        { target: 10, title: '10 full fasts' },
        { target: 50, title: '50 full fasts' },
      ],
      (t) => (t === 1 ? 'Finish a fast at its target length' : `Finish ${t} fasts at their target length`),
      'fasts',
    ),
  ]

  // Strength milestones need a bodyweight to be meaningful; without one they're simply left out
  // rather than shown as permanently locked.
  if (input.currentWeightKg && input.currentWeightKg > 0) {
    const bests = bestLiftEstimates(input.sets)
    for (const lift of Object.keys(STRENGTH_STANDARDS) as LiftKey[]) {
      const spec = STRENGTH_STANDARDS[lift]
      const ratio = bests[lift] / input.currentWeightKg
      spec.tiers.forEach((t, i) => {
        awards.push({
          id: `lift-${lift}-${t.ratio}`,
          ladder: `lift-${lift}`,
          ladderName: spec.label,
          category: 'strength',
          tier: TIERS[i],
          title: `${spec.label} ${t.ratio}× bodyweight`,
          description: `Estimated 1-rep max of ${t.ratio}× your bodyweight on the ${spec.label.toLowerCase()}`,
          current: Math.round(ratio * 100) / 100,
          target: t.ratio,
          unlocked: ratio >= t.ratio,
          unit: '× bodyweight',
        })
      })
    }
  }
  return awards
}

/** Locked awards you're closest to finishing - the "goal gradient" that makes the next one feel reachable. */
export function nextUp(awards: Award[], count = 3): Award[] {
  const byLadder = new Map<string, Award>()
  for (const a of awards) {
    if (a.unlocked) continue
    // Only the lowest locked rung of each ladder: "50 workouts" isn't "next" while 10 is still locked.
    if (!byLadder.has(a.ladder)) byLadder.set(a.ladder, a)
  }
  return [...byLadder.values()]
    .filter((a) => a.current > 0)
    .sort((a, b) => b.current / b.target - a.current / a.target)
    .slice(0, count)
}

export interface AwardLadder {
  id: string
  name: string
  category: AwardCategory
  /** Every tier, lowest first. */
  tiers: Award[]
  /** Highest tier earned so far, if any. */
  earned?: Award
  /** The next tier to aim for, if any are left. */
  next?: Award
}

/**
 * One entry per ladder rather than per tier: the collection shows one medal per achievement (at
 * the tier you've reached, heading for the next) instead of a wall of mostly-locked discs.
 */
export function groupLadders(awards: Award[]): AwardLadder[] {
  const ladders = new Map<string, AwardLadder>()
  for (const a of awards) {
    const entry = ladders.get(a.ladder) ?? { id: a.ladder, name: a.ladderName, category: a.category, tiers: [] }
    entry.tiers.push(a)
    ladders.set(a.ladder, entry)
  }
  for (const l of ladders.values()) {
    l.earned = [...l.tiers].reverse().find((t) => t.unlocked)
    l.next = l.tiers.find((t) => !t.unlocked)
  }
  return [...ladders.values()]
}

export interface PersonalRecord {
  exerciseId: string
  exerciseName: string
  /** Best estimated 1-rep max. */
  best1RM: number
  /** The set that produced it. */
  weight: number
  reps: number
  /** When that best was set (ISO timestamp). */
  achievedAt: string
  /** True when that best beat an earlier one - a first-ever log of a lift isn't a new record. */
  improved: boolean
}

/** Best estimated 1RM per exercise (working sets only), most recently improved first. */
export function personalRecords(sets: SetForAchievements[]): PersonalRecord[] {
  const best = new Map<string, PersonalRecord>()
  for (const s of sets) {
    if (s.is_warmup || s.reps < 1 || s.weight <= 0) continue
    const e1rm = estimate1RM(s.weight, s.reps)
    const prev = best.get(s.exercise_id)
    if (!prev || e1rm > prev.best1RM) {
      best.set(s.exercise_id, {
        exerciseId: s.exercise_id,
        exerciseName: s.exercise_name,
        best1RM: e1rm,
        weight: s.weight,
        reps: s.reps,
        achievedAt: s.created_at,
        improved: prev !== undefined,
      })
    }
  }
  return [...best.values()].sort((a, b) => b.achievedAt.localeCompare(a.achievedAt))
}

export interface MonthlyChallenge {
  /** e.g. "September" */
  monthLabel: string
  target: number
  done: number
  daysLeft: number
}

/**
 * This month's workout challenge. The target is personal - your average over the last three full
 * months, nudged up by one - so it's reachable but still a stretch, and starts at 8 for new users.
 */
export function monthlyChallenge(sessionDates: string[], today = new Date()): MonthlyChallenge {
  const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const thisMonth = ym(today)
  const unique = [...new Set(sessionDates)]
  const done = unique.filter((d) => d.startsWith(thisMonth)).length

  const previous: number[] = []
  for (let back = 1; back <= 3; back++) {
    const m = ym(new Date(today.getFullYear(), today.getMonth() - back, 1))
    const count = unique.filter((d) => d.startsWith(m)).length
    if (count > 0) previous.push(count)
  }
  const average = previous.length > 0 ? previous.reduce((a, b) => a + b, 0) / previous.length : 0
  const target = Math.max(8, Math.min(26, Math.round(average) + 1))

  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  return {
    monthLabel: today.toLocaleDateString(undefined, { month: 'long' }),
    target,
    done,
    daysLeft: lastDay - today.getDate(),
  }
}
