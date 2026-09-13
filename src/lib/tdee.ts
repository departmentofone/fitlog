import type { UserSettings } from '../types'

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

const KCAL_PER_KG = 7700

/** Mifflin-St Jeor estimate. Returns null if required stats are missing. */
export function estimateTDEE(settings: Pick<UserSettings, 'current_weight' | 'height_cm' | 'age' | 'sex' | 'activity_level'>): number | null {
  const { current_weight, height_cm, age, sex, activity_level } = settings
  if (current_weight == null || height_cm == null || age == null || !sex || !activity_level) return null

  const base = 10 * current_weight + 6.25 * height_cm - 5 * age + (sex === 'male' ? 5 : sex === 'female' ? -161 : -78)
  return Math.round(base * ACTIVITY_MULTIPLIERS[activity_level])
}

export interface GoalProjection {
  daysNeeded: number
  dailyDelta: number
  direction: 'lose' | 'gain'
  onTrack: boolean
  targetDate: Date
}

/** Projects days-to-goal from current/goal weight, estimated TDEE, and the diet's daily calorie target. */
export function projectGoal(currentWeight: number, weightGoal: number, tdee: number, calorieGoal: number): GoalProjection | null {
  const weightDelta = weightGoal - currentWeight
  if (Math.abs(weightDelta) < 0.1) return null

  const direction: 'lose' | 'gain' = weightDelta < 0 ? 'lose' : 'gain'
  const dailyDelta = calorieGoal - tdee
  const onTrack = direction === 'lose' ? dailyDelta < 0 : dailyDelta > 0
  if (!onTrack || dailyDelta === 0) {
    return { daysNeeded: Infinity, dailyDelta, direction, onTrack: false, targetDate: new Date() }
  }

  const totalKcal = Math.abs(weightDelta) * KCAL_PER_KG
  const daysNeeded = Math.ceil(totalKcal / Math.abs(dailyDelta))
  const targetDate = new Date(Date.now() + daysNeeded * 86_400_000)

  return { daysNeeded, dailyDelta, direction, onTrack: true, targetDate }
}
