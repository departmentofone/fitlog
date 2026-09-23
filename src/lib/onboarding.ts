// v2: the three-step tour (welcome, pin sections, Community). Bumped from the old key so everyone
// sees it once, including people who went through the old navigation tour.
export const ONBOARDING_STORAGE_KEY = 'fitlog-onboarded-v2'
export const ONBOARDING_REPLAY_EVENT = 'fitlog-replay-onboarding'
const TIPS_STORAGE_KEY = 'fitlog-dismissed-tab-tips'

/** Tabs whose tip has been closed on this device. */
export function readDismissedTips(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(TIPS_STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : []
  } catch {
    return []
  }
}

export function writeDismissedTips(tabs: string[]) {
  try {
    localStorage.setItem(TIPS_STORAGE_KEY, JSON.stringify(tabs))
  } catch {
    // Not saved - the tip just shows again next time.
  }
}

/** Settings → "Show welcome and tips again": clears both and reopens the tour right away. */
export function replayOnboarding() {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY)
    localStorage.removeItem(TIPS_STORAGE_KEY)
  } catch {
    // Nothing stored to clear - the event below still reopens it for this session.
  }
  window.dispatchEvent(new Event(ONBOARDING_REPLAY_EVENT))
}
