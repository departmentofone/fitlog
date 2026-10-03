import { describe, expect, it } from 'vitest'
import { inMuscleFilter, matchesExercise } from './exerciseSearch'

describe('matchesExercise', () => {
  it('matches every typed word, in any order', () => {
    expect(matchesExercise('Incline Dumbbell Press', 'press incline')).toBe(true)
    expect(matchesExercise('Incline Dumbbell Press', 'incline barbell')).toBe(false)
  })

  it('expands gym shorthand', () => {
    expect(matchesExercise('Dumbbell Bench Press', 'db bench')).toBe(true)
    expect(matchesExercise('Romanian Deadlift (Barbell)', 'rdl')).toBe(true)
    expect(matchesExercise('Overhead Barbell Press', 'ohp')).toBe(true)
    expect(matchesExercise('Machine Shoulder Press', 'ohp')).toBe(false)
  })

  it('treats hyphens and spaces alike for pull-ups and push-ups', () => {
    expect(matchesExercise('Pull-Up', 'pullup')).toBe(true)
    expect(matchesExercise('Pull-Up', 'pull up')).toBe(true)
    expect(matchesExercise('Push-Up', 'pushups')).toBe(true)
  })

  it('ignores quotes and case', () => {
    expect(matchesExercise('"Farmer\'s Carry"', 'farmer')).toBe(true)
    expect(matchesExercise('Barbell Back Squat', 'SQUAT')).toBe(true)
  })

  it('matches everything on an empty query', () => {
    expect(matchesExercise('Deadlift', '   ')).toBe(true)
  })
})

describe('inMuscleFilter', () => {
  it('groups the finer muscle groups under each chip', () => {
    expect(inMuscleFilter('lats', 'back')).toBe(true)
    expect(inMuscleFilter('side_delts', 'shoulders')).toBe(true)
    expect(inMuscleFilter('triceps', 'arms')).toBe(true)
    expect(inMuscleFilter('glutes', 'legs')).toBe(true)
    expect(inMuscleFilter('abs', 'legs')).toBe(false)
    expect(inMuscleFilter('abs', 'all')).toBe(true)
  })
})
