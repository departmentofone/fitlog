import { describe, expect, it } from 'vitest'
import { estimateTDEE, projectGoal } from './tdee'

const baseSettings = {
  current_weight: 80,
  height_cm: 180,
  age: 30,
  sex: 'male' as const,
  activity_level: 'moderate' as const,
}

describe('estimateTDEE (Mifflin-St Jeor)', () => {
  it('returns null when any required stat is missing', () => {
    expect(estimateTDEE({ ...baseSettings, current_weight: null })).toBeNull()
    expect(estimateTDEE({ ...baseSettings, height_cm: null })).toBeNull()
    expect(estimateTDEE({ ...baseSettings, age: null })).toBeNull()
    expect(estimateTDEE({ ...baseSettings, sex: null })).toBeNull()
    expect(estimateTDEE({ ...baseSettings, activity_level: null })).toBeNull()
  })

  it('computes the male formula and applies the activity multiplier', () => {
    // base = 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780; * 1.55 = 2759
    expect(estimateTDEE(baseSettings)).toBe(2759)
  })

  it('uses -161 instead of +5 for female', () => {
    // base = 800 + 1125 - 150 - 161 = 1614; * 1.55 = 2501.7 -> 2502
    expect(estimateTDEE({ ...baseSettings, sex: 'female' })).toBe(2502)
  })

  it('uses -78 for sex "other"', () => {
    // base = 800 + 1125 - 150 - 78 = 1697; * 1.55 = 2630.35 -> 2630
    expect(estimateTDEE({ ...baseSettings, sex: 'other' })).toBe(2630)
  })

  it('applies each activity multiplier', () => {
    // base = 1780 for baseSettings regardless of activity level
    expect(estimateTDEE({ ...baseSettings, activity_level: 'sedentary' })).toBe(Math.round(1780 * 1.2))
    expect(estimateTDEE({ ...baseSettings, activity_level: 'very_active' })).toBe(Math.round(1780 * 1.9))
  })
})

describe('projectGoal', () => {
  it('returns null when already at the goal weight', () => {
    expect(projectGoal(80, 80.05, 2500, 2000)).toBeNull()
  })

  it('projects days needed for a deficit that is actually a deficit', () => {
    // weightDelta = -2kg, dailyDelta = 2000 - 2500 = -500, totalKcal = 2*7700 = 15400
    const result = projectGoal(80, 78, 2500, 2000)
    expect(result).not.toBeNull()
    expect(result!.direction).toBe('lose')
    expect(result!.onTrack).toBe(true)
    expect(result!.daysNeeded).toBe(Math.ceil(15400 / 500))
  })

  it('flags a losing goal as not on track when the calorie target is not actually a deficit', () => {
    const result = projectGoal(80, 78, 2500, 2600)
    expect(result).toEqual(
      expect.objectContaining({ direction: 'lose', onTrack: false, daysNeeded: Infinity }),
    )
  })

  it('projects days needed for a surplus goal (gaining weight)', () => {
    // weightDelta = +3kg, dailyDelta = 3000 - 2500 = 500, totalKcal = 3*7700 = 23100
    const result = projectGoal(80, 83, 2500, 3000)
    expect(result).not.toBeNull()
    expect(result!.direction).toBe('gain')
    expect(result!.onTrack).toBe(true)
    expect(result!.daysNeeded).toBe(Math.ceil(23100 / 500))
  })

  it('flags a gaining goal as not on track when the calorie target is not actually a surplus', () => {
    const result = projectGoal(80, 83, 2500, 2400)
    expect(result).toEqual(
      expect.objectContaining({ direction: 'gain', onTrack: false, daysNeeded: Infinity }),
    )
  })
})
