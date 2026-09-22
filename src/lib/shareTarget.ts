const KEY = 'fitlog-shared-text'

/** Called once by App.tsx when the OS share sheet (manifest `share_target`) delivers text into FitLog. */
export function storeSharedText(text: string) {
  try {
    sessionStorage.setItem(KEY, text)
  } catch {
    // Private browsing / blocked storage - the app still navigates to Meals, just without prefill.
  }
}

/** Called once by FoodPicker when it opens, so shared text prefills search exactly once. */
export function consumeSharedText(): string | null {
  try {
    const value = sessionStorage.getItem(KEY)
    if (value) sessionStorage.removeItem(KEY)
    return value
  } catch {
    return null
  }
}
