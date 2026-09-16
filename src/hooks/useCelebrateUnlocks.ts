import { useEffect } from 'react'
import { useToast } from '../components/ToastProvider'
import { countGenuinePRs, PR_COUNT_TIERS, STREAK_TIERS, tierProgress } from '../lib/achievements'
import { haptics } from '../lib/haptics'
import { useAchievementsData } from './useAchievements'
import { useAuth } from './useAuth'

interface CelebrationBaseline {
  prCount: number
  workoutStreak: number
  dietStreak: number
  firstPr: boolean
  firstRecipe: boolean
  firstFast: boolean
  firstPreset: boolean
  firstGoal: boolean
}

function storageKey(userId: string) {
  return `fitlog-celebrated-unlocks:${userId}`
}

function readBaseline(userId: string): CelebrationBaseline | null {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return null
    return JSON.parse(raw) as CelebrationBaseline
  } catch {
    return null
  }
}

function writeBaseline(userId: string, baseline: CelebrationBaseline) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(baseline))
  } catch {
    // Storage unavailable (private browsing, blocked, etc.) - a celebration may re-fire
    // (or be missed) next load, which is an acceptable tradeoff.
  }
}

/** Tier labels newly crossed going from `prev` to `current` (empty if nothing new unlocked). */
function newlyUnlockedTierLabels(prev: number, current: number, tiers: readonly number[], labelSuffix: string): string[] {
  if (current <= prev) return []
  const before = tierProgress(prev, tiers, labelSuffix)
  const after = tierProgress(current, tiers, labelSuffix)
  return after.filter((t, i) => t.unlocked && !before[i].unlocked).map((t) => t.label)
}

/**
 * Watches achievement-relevant numbers app-wide (reusing useAchievementsData's existing
 * queries - no duplicate fetching) and fires a one-time celebratory toast + haptic the moment
 * something newly crosses an unlock threshold: a "first", a PR-count tier, or a streak tier.
 * Without this, unlocks only became visible passively, whenever the user happened to open the
 * Achievements tab.
 *
 * Bookkeeping - "have I already celebrated this" - lives in localStorage per user/device; it's
 * not real app data, just a dedupe record. On the very first run for a user (no stored
 * baseline yet), the baseline is seeded from their current values WITHOUT celebrating -
 * otherwise everyone would get a flood of "unlocked!" toasts for achievements they already had
 * the moment this feature shipped.
 */
export function useCelebrateUnlocks() {
  const { user } = useAuth()
  const data = useAchievementsData()
  const { show } = useToast()

  useEffect(() => {
    if (!user || data.isLoading) return

    const prCount = countGenuinePRs(data.sets)
    const current: CelebrationBaseline = {
      prCount,
      workoutStreak: data.bestWorkoutStreak,
      dietStreak: data.bestDietStreak,
      firstPr: prCount >= 1,
      firstRecipe: data.recipeCount >= 1,
      firstFast: data.completedFastCount >= 1,
      firstPreset: data.presetCount >= 1,
      firstGoal: data.completedGoalCount >= 1,
    }

    const prev = readBaseline(user.id)

    if (!prev) {
      // First time we've seen this user - nothing here is "new", it's just what they already
      // have. Seed silently.
      writeBaseline(user.id, current)
      return
    }

    const celebrations: string[] = []

    const firsts: [keyof CelebrationBaseline, string][] = [
      ['firstPr', 'First PR'],
      ['firstRecipe', 'First recipe'],
      ['firstFast', 'First completed fast'],
      ['firstPreset', 'First saved preset'],
      ['firstGoal', 'First goal completed'],
    ]
    for (const [key, label] of firsts) {
      if (current[key] && !prev[key]) celebrations.push(`🎉 ${label} unlocked!`)
    }

    for (const label of newlyUnlockedTierLabels(prev.prCount, current.prCount, PR_COUNT_TIERS, ' PRs')) {
      celebrations.push(`🎉 ${label} milestone unlocked!`)
    }
    for (const label of newlyUnlockedTierLabels(prev.workoutStreak, current.workoutStreak, STREAK_TIERS, 'd')) {
      celebrations.push(`🔥 ${label} workout streak!`)
    }
    for (const label of newlyUnlockedTierLabels(prev.dietStreak, current.dietStreak, STREAK_TIERS, 'd')) {
      celebrations.push(`🔥 ${label} on-target diet streak!`)
    }

    if (celebrations.length > 0) {
      for (const message of celebrations) show(message)
      haptics.celebrate()
    }

    writeBaseline(user.id, current)
  }, [user, data.isLoading, data.sets, data.bestWorkoutStreak, data.bestDietStreak, data.recipeCount, data.completedFastCount, data.presetCount, data.completedGoalCount, show])
}
