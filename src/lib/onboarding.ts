// v2: the three-step tour (welcome, pin sections, Community). Bumped from the old key so everyone
// sees it once, including people who went through the old navigation tour.
export const ONBOARDING_STORAGE_KEY = 'fitlog-onboarded-v2'
export const ONBOARDING_REPLAY_EVENT = 'fitlog-replay-onboarding'

/** Settings → "Show welcome again": clears the seen flag and reopens the tour right away. */
export function replayOnboarding() {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY)
  } catch {
    // Nothing stored to clear - the event below still reopens it for this session.
  }
  window.dispatchEvent(new Event(ONBOARDING_REPLAY_EVENT))
}
