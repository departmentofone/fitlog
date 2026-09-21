import { useEffect, useMemo } from 'react'
import { useToast } from '../components/ToastProvider'
import { computeAwards } from '../lib/awards'
import { haptics } from '../lib/haptics'
import { useAchievementsData } from './useAchievements'
import { useAuth } from './useAuth'

/** Per user/device: which award ids have already been celebrated. */
function storageKey(userId: string) {
  return `fitlog-celebrated-unlocks:${userId}`
}

interface Baseline {
  version: 2
  unlocked: string[]
}

function readBaseline(userId: string): Baseline | null {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Baseline>
    // An older-format record (before awards were redesigned) is treated as "no baseline", so the
    // switch seeds silently instead of re-announcing everything the user already had.
    return parsed.version === 2 && Array.isArray(parsed.unlocked) ? (parsed as Baseline) : null
  } catch {
    return null
  }
}

function writeBaseline(userId: string, unlocked: string[]) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify({ version: 2, unlocked } satisfies Baseline))
  } catch {
    // Storage unavailable - a celebration may repeat or be missed next load; acceptable.
  }
}

/**
 * Fires a one-time toast + haptic the moment an award is newly earned, anywhere in the app - the
 * immediate "you did it" moment reviewers single out (Hevy's live PR medal), rather than finding
 * out only when opening Awards. The first run for a user seeds silently.
 */
export function useCelebrateUnlocks() {
  const { user } = useAuth()
  const data = useAchievementsData()
  const { show } = useToast()

  const unlocked = useMemo(() => {
    if (data.isLoading) return null
    return computeAwards({
      sets: data.sets,
      totalWorkouts: data.totalWorkouts,
      bestWorkoutStreak: data.bestWorkoutStreak,
      bestDietStreak: data.bestDietStreak,
      completedFasts: data.completedFasts,
      currentWeightKg: data.currentWeightKg,
    })
      .filter((a) => a.unlocked)
      .map((a) => ({ id: a.id, title: a.title }))
  }, [data.isLoading, data.sets, data.totalWorkouts, data.bestWorkoutStreak, data.bestDietStreak, data.completedFasts, data.currentWeightKg])

  useEffect(() => {
    if (!user || !unlocked) return
    const prev = readBaseline(user.id)
    const ids = unlocked.map((a) => a.id)
    if (!prev) {
      writeBaseline(user.id, ids)
      return
    }
    const fresh = unlocked.filter((a) => !prev.unlocked.includes(a.id))
    if (fresh.length > 0) {
      for (const award of fresh) show(`Award earned: ${award.title}`)
      haptics.celebrate()
    }
    // Union, so an award that locks again (e.g. bodyweight went up) isn't re-celebrated later.
    writeBaseline(user.id, [...new Set([...prev.unlocked, ...ids])])
  }, [user, unlocked, show])
}
