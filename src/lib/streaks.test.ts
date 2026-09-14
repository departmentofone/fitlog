import { describe, expect, it } from 'vitest'
import { computeDayStreaks, toDayNumber, todayDayNumber } from './streaks'

function isoDaysAgo(n: number): string {
  const d = new Date(todayDayNumber() * 86_400_000)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

describe('toDayNumber', () => {
  it('increments by exactly 1 per calendar day regardless of time-of-day formatting', () => {
    expect(toDayNumber('2024-03-02') - toDayNumber('2024-03-01')).toBe(1)
  })

  it('handles month/year boundaries correctly', () => {
    expect(toDayNumber('2024-03-01') - toDayNumber('2024-02-29')).toBe(1) // 2024 is a leap year
    expect(toDayNumber('2025-01-01') - toDayNumber('2024-12-31')).toBe(1)
  })
})

describe('computeDayStreaks', () => {
  it('returns zero streaks for no logged days', () => {
    expect(computeDayStreaks([])).toEqual({ current: 0, best: 0 })
  })

  it('counts a single day as a streak of 1', () => {
    expect(computeDayStreaks([isoDaysAgo(0)])).toEqual({ current: 1, best: 1 })
  })

  it('dedupes multiple entries on the same day', () => {
    const today = isoDaysAgo(0)
    expect(computeDayStreaks([today, today, today])).toEqual({ current: 1, best: 1 })
  })

  it('counts a run ending today as the current streak', () => {
    const days = [isoDaysAgo(0), isoDaysAgo(1), isoDaysAgo(2)]
    expect(computeDayStreaks(days)).toEqual({ current: 3, best: 3 })
  })

  it('still counts the current streak with a grace day if today has not been logged yet', () => {
    // logged yesterday and the day before, nothing logged yet today
    const days = [isoDaysAgo(1), isoDaysAgo(2)]
    expect(computeDayStreaks(days).current).toBe(2)
  })

  it('resets the current streak to 0 once the gap is more than one day', () => {
    // last logged 3 days ago - too old for the "yesterday" grace period
    const days = [isoDaysAgo(3), isoDaysAgo(4)]
    expect(computeDayStreaks(days).current).toBe(0)
  })

  it('tracks the best streak separately from a broken current streak', () => {
    // a 4-day run a while ago, then a gap, then today logged alone
    const days = [isoDaysAgo(0), isoDaysAgo(10), isoDaysAgo(11), isoDaysAgo(12), isoDaysAgo(13)]
    const result = computeDayStreaks(days)
    expect(result.best).toBe(4)
    expect(result.current).toBe(1)
  })

  it('is not confused by out-of-order input', () => {
    const days = [isoDaysAgo(2), isoDaysAgo(0), isoDaysAgo(1)]
    expect(computeDayStreaks(days)).toEqual({ current: 3, best: 3 })
  })
})
