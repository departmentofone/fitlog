import type { CommunityKind } from '../hooks/useCommunity'

/**
 * Lets another screen open Community on one kind of item (Train's "Browse workouts" lands on the
 * Workouts filter). Set right before navigating; Community reads it once when it mounts, then
 * clears it, so a later visit starts on All as usual.
 */
let pending: CommunityKind | null = null

export function landCommunityOn(kind: CommunityKind) {
  pending = kind
}

export function peekCommunityLanding(): CommunityKind | null {
  return pending
}

export function clearCommunityLanding() {
  pending = null
}
