import { describe, expect, it } from 'vitest'
import type { SetForAchievements } from './achievements'
import { computeAwards, monthlyChallenge, nextUp, personalRecords } from './awards'

const set = (exercise: string, weight: number, reps: number, at: string, warmup = false): SetForAchievements => ({
  exercise_id: exercise,
  exercise_name: exercise,
  weight,
  reps,
  is_warmup: warmup,
  created_at: at,
})

const base = { sets: [], totalWorkouts: 0, bestWorkoutStreak: 0, bestDietStreak: 0, completedFasts: 0, currentWeightKg: null }

describe('computeAwards', () => {
  it('awards training and consistency, not feature usage', () => {
    const ids = computeAwards(base).map((a) => a.id)
    expect(ids.some((id) => /recipe|preset|goal/.test(id))).toBe(false)
  })

  it('unlocks tiers by threshold', () => {
    const awards = computeAwards({ ...base, totalWorkouts: 60 })
    const workouts = awards.filter((a) => a.id.startsWith('workouts-'))
    expect(workouts.map((a) => a.unlocked)).toEqual([true, true, false, false])
    expect(workouts.map((a) => a.tier)).toEqual(['bronze', 'silver', 'gold', 'platinum'])
  })

  it('leaves strength milestones out until a bodyweight is known', () => {
    expect(computeAwards(base).some((a) => a.id.startsWith('lift-'))).toBe(false)
    const withWeight = computeAwards({ ...base, currentWeightKg: 80, sets: [set('Bench Press', 80, 1, '2026-09-01')] })
    expect(withWeight.find((a) => a.id === 'lift-bench-1')?.unlocked).toBe(true)
  })
})

describe('nextUp', () => {
  it('offers the lowest locked rung of each ladder, closest first, and skips ones at zero', () => {
    const awards = computeAwards({ ...base, totalWorkouts: 8, bestWorkoutStreak: 3 })
    const next = nextUp(awards)
    expect(next.map((a) => a.id)).toEqual(['workouts-10', 'streak-7'])
  })
})

describe('personalRecords', () => {
  it('keeps the best estimated 1RM per exercise, ignoring warm-ups, newest improvement first', () => {
    const prs = personalRecords([
      set('Squat', 100, 5, '2026-09-01'),
      set('Squat', 140, 1, '2026-09-02', true),
      set('Squat', 105, 5, '2026-09-10'),
      set('Bench', 80, 5, '2026-09-05'),
    ])
    expect(prs.map((p) => [p.exerciseName, p.weight])).toEqual([
      ['Squat', 105],
      ['Bench', 80],
    ])
  })
})

describe('monthlyChallenge', () => {
  it('starts new users at 8 and counts this month only', () => {
    const c = monthlyChallenge(['2026-09-02', '2026-09-02', '2026-09-10'], new Date(2026, 8, 20))
    expect(c).toMatchObject({ target: 8, done: 2, daysLeft: 10 })
  })

  it('sets a personal target one above the recent monthly average', () => {
    const dates = [
      ...Array.from({ length: 12 }, (_, i) => `2026-08-${String(i + 1).padStart(2, '0')}`),
      ...Array.from({ length: 10 }, (_, i) => `2026-07-${String(i + 1).padStart(2, '0')}`),
    ]
    expect(monthlyChallenge(dates, new Date(2026, 8, 5)).target).toBe(12)
  })
})
