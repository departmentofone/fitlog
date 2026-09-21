import { estimate1RM } from './oneRepMax'

export type LiftKey = 'bench' | 'squat' | 'deadlift'

export const STRENGTH_STANDARDS: Record<LiftKey, { label: string; tiers: { label: string; ratio: number }[] }> = {
  bench: {
    label: 'Bench Press',
    tiers: [
      { label: 'Bronze', ratio: 0.75 },
      { label: 'Silver', ratio: 1 },
      { label: 'Gold', ratio: 1.5 },
    ],
  },
  squat: {
    label: 'Squat',
    tiers: [
      { label: 'Bronze', ratio: 1 },
      { label: 'Silver', ratio: 1.5 },
      { label: 'Gold', ratio: 2 },
    ],
  },
  deadlift: {
    label: 'Deadlift',
    tiers: [
      { label: 'Bronze', ratio: 1.25 },
      { label: 'Silver', ratio: 1.75 },
      { label: 'Gold', ratio: 2.5 },
    ],
  },
}

/**
 * Rough, commonly-cited bodyweight-ratio milestones (not an official/verified standards
 * table) - deliberately labeled "milestones" in the UI rather than "standards".
 */
export function matchLift(exerciseName: string): LiftKey | null {
  const n = exerciseName.toLowerCase()
  if (n.includes('bench press') && !n.includes('incline') && !n.includes('decline') && !n.includes('dumbbell') && !n.includes('machine') && !n.includes('smith')) {
    return 'bench'
  }
  if (n.includes('squat') && !n.includes('split') && !n.includes('goblet') && !n.includes('bulgarian') && !n.includes('sissy') && !n.includes('leg press')) {
    return 'squat'
  }
  if (n.includes('deadlift') && !n.includes('romanian') && !n.includes('stiff') && !n.includes('single')) {
    return 'deadlift'
  }
  return null
}

export interface SetForAchievements {
  exercise_id: string
  exercise_name: string
  weight: number
  reps: number
  is_warmup: boolean
  created_at: string
}

/**
 * Counts genuine PRs: a set that beats every prior (non-warmup) set's estimated 1RM for the
 * same exercise. Mirrors WorkoutsTab's live PR-detection exactly - the first time an exercise
 * is ever logged is never a PR (there's nothing to beat yet), matching "don't count the first
 * time a workout/exercise is logged".
 */
export function countGenuinePRs(sets: SetForAchievements[]): number {
  const byExercise = new Map<string, SetForAchievements[]>()
  for (const s of sets) {
    if (s.is_warmup) continue
    const list = byExercise.get(s.exercise_id) ?? []
    list.push(s)
    byExercise.set(s.exercise_id, list)
  }

  let prCount = 0
  for (const list of byExercise.values()) {
    const sorted = [...list].sort((a, b) => a.created_at.localeCompare(b.created_at))
    let best = 0
    for (const s of sorted) {
      const oneRm = estimate1RM(s.weight, s.reps)
      if (best > 0 && oneRm > best) prCount++
      best = Math.max(best, oneRm)
    }
  }
  return prCount
}

/** Best estimated 1RM ever logged (non-warmup) per matched "big 3" lift. */
export function bestLiftEstimates(sets: SetForAchievements[]): Record<LiftKey, number> {
  const best: Record<LiftKey, number> = { bench: 0, squat: 0, deadlift: 0 }
  for (const s of sets) {
    if (s.is_warmup) continue
    const lift = matchLift(s.exercise_name)
    if (!lift) continue
    best[lift] = Math.max(best[lift], estimate1RM(s.weight, s.reps))
  }
  return best
}
