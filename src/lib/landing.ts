import type { CommunityKind } from '../hooks/useCommunity'

/**
 * Lets one screen open another already pointed at something: Train's "Browse workouts" lands on
 * Community's Workouts filter, Scan from a meal offers that meal, a food tapped in search opens
 * the Foods library on it. Set right before navigating; the screen reads it once when it mounts
 * (peek in the state initializer, clear in an effect, so React's double-run in development can't
 * lose it), and a later visit starts as usual.
 */
interface Landings {
  communityFilter: CommunityKind
  scanMeal: string
  foodSearch: string
}

const pending: Partial<Landings> = {}

export function land<K extends keyof Landings>(key: K, value: Landings[K]) {
  pending[key] = value
}

export function peekLanding<K extends keyof Landings>(key: K): Landings[K] | null {
  return pending[key] ?? null
}

export function clearLanding(key: keyof Landings) {
  delete pending[key]
}
