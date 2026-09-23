import { describe, expect, it } from 'vitest'
import { parseRoute } from './useHashRoute'

describe('parseRoute', () => {
  it('reads a tab or settings from the hash', () => {
    expect(parseRoute('#/meals')).toBe('meals')
    expect(parseRoute('#/settings')).toBe('settings')
    expect(parseRoute('#achievements')).toBe('achievements')
    expect(parseRoute('#/foods')).toBe('foods')
    expect(parseRoute('#/community')).toBe('community')
  })

  it('falls back to workouts for an empty or unknown hash', () => {
    expect(parseRoute('')).toBe('workouts')
    expect(parseRoute('#/')).toBe('workouts')
    expect(parseRoute('#/nope')).toBe('workouts')
  })

  it('ignores anything after the route segment', () => {
    expect(parseRoute('#/goals/extra')).toBe('goals')
    expect(parseRoute('#/diet?x=1')).toBe('diet')
  })
})
