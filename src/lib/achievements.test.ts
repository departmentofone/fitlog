import { describe, expect, it } from 'vitest'
import { bestLiftEstimates, countGenuinePRs, matchLift, type SetForAchievements } from './achievements'

function set(overrides: Partial<SetForAchievements>): SetForAchievements {
  return {
    exercise_id: 'ex-1',
    exercise_name: 'Barbell Bench Press',
    weight: 60,
    reps: 8,
    is_warmup: false,
    created_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('matchLift', () => {
  it('matches the big 3 by name', () => {
    expect(matchLift('Barbell Bench Press')).toBe('bench')
    expect(matchLift('Barbell Back Squat')).toBe('squat')
    expect(matchLift('Deadlift')).toBe('deadlift')
  })

  it('excludes variants that would skew standards', () => {
    expect(matchLift('Incline Bench Press')).toBeNull()
    expect(matchLift('Dumbbell Bench Press')).toBeNull()
    expect(matchLift('Bulgarian Split Squat (Dumbbell)')).toBeNull()
    expect(matchLift('Romanian Deadlift')).toBeNull()
  })

  it('returns null for unrelated exercises', () => {
    expect(matchLift('Barbell Curl')).toBeNull()
  })
})

describe('countGenuinePRs', () => {
  it('does not count the first-ever log of an exercise as a PR', () => {
    const sets = [set({ created_at: '2024-01-01T00:00:00.000Z', weight: 60, reps: 8 })]
    expect(countGenuinePRs(sets)).toBe(0)
  })

  it('counts a later set that beats every prior set', () => {
    const sets = [
      set({ created_at: '2024-01-01T00:00:00.000Z', weight: 60, reps: 8 }),
      set({ created_at: '2024-01-08T00:00:00.000Z', weight: 65, reps: 8 }),
    ]
    expect(countGenuinePRs(sets)).toBe(1)
  })

  it('does not count a set that fails to beat the running best', () => {
    const sets = [
      set({ created_at: '2024-01-01T00:00:00.000Z', weight: 70, reps: 8 }),
      set({ created_at: '2024-01-08T00:00:00.000Z', weight: 60, reps: 8 }),
    ]
    expect(countGenuinePRs(sets)).toBe(0)
  })

  it('ignores warmup sets entirely', () => {
    const sets = [
      set({ created_at: '2024-01-01T00:00:00.000Z', weight: 60, reps: 8, is_warmup: false }),
      set({ created_at: '2024-01-02T00:00:00.000Z', weight: 100, reps: 8, is_warmup: true }),
      set({ created_at: '2024-01-08T00:00:00.000Z', weight: 65, reps: 8, is_warmup: false }),
    ]
    // the 100kg warmup would trivially "beat" 65kg if counted - it must not be
    expect(countGenuinePRs(sets)).toBe(1)
  })

  it('tracks separate exercises independently', () => {
    const sets = [
      set({ exercise_id: 'bench', created_at: '2024-01-01T00:00:00.000Z', weight: 60, reps: 8 }),
      set({ exercise_id: 'squat', created_at: '2024-01-01T00:00:00.000Z', weight: 80, reps: 5 }),
      set({ exercise_id: 'bench', created_at: '2024-01-08T00:00:00.000Z', weight: 65, reps: 8 }),
      set({ exercise_id: 'squat', created_at: '2024-01-08T00:00:00.000Z', weight: 90, reps: 5 }),
    ]
    expect(countGenuinePRs(sets)).toBe(2)
  })

  it('sorts out-of-order input by created_at before comparing', () => {
    const sets = [
      set({ created_at: '2024-01-08T00:00:00.000Z', weight: 65, reps: 8 }),
      set({ created_at: '2024-01-01T00:00:00.000Z', weight: 60, reps: 8 }),
    ]
    expect(countGenuinePRs(sets)).toBe(1)
  })
})

describe('bestLiftEstimates', () => {
  it('tracks the best estimated 1RM per matched lift and ignores unmatched exercises', () => {
    const sets = [
      set({ exercise_name: 'Barbell Bench Press', weight: 60, reps: 8 }),
      set({ exercise_name: 'Barbell Bench Press', weight: 70, reps: 5 }),
      set({ exercise_name: 'Barbell Curl', weight: 1000, reps: 100 }),
    ]
    const best = bestLiftEstimates(sets)
    expect(best.bench).toBeGreaterThan(0)
    expect(best.squat).toBe(0)
    expect(best.deadlift).toBe(0)
  })

  it('excludes warmup sets from the best estimate', () => {
    const sets = [set({ exercise_name: 'Deadlift', weight: 200, reps: 5, is_warmup: true })]
    expect(bestLiftEstimates(sets).deadlift).toBe(0)
  })
})
