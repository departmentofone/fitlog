/** Set on every sign-in, so the auth screen can open on Sign in for people who've been here before. */
export const SIGNED_IN_BEFORE_KEY = 'fitlog-signed-in-before'

/**
 * localStorage keys that only ever exist after someone signed in on this device. The last three
 * cover people who signed in before SIGNED_IN_BEFORE_KEY existed. `fitlog-query-cache` isn't
 * here: the query persister can write it before anyone signs in.
 */
const SIGNED_IN_KEYS = [SIGNED_IN_BEFORE_KEY, 'fitlog-onboarded-v2', 'fitlog-rest-seconds']
const SIGNED_IN_PREFIXES = ['fitlog-celebrated-unlocks:']
// Supabase's saved session: `sb-<project ref>-auth-token`.
const SUPABASE_SESSION = /^sb-.+-auth-token$/

export function isReturningDevice(keys: string[]): boolean {
  return keys.some(
    (k) => SIGNED_IN_KEYS.includes(k) || SIGNED_IN_PREFIXES.some((p) => k.startsWith(p)) || SUPABASE_SESSION.test(k),
  )
}

/** True when this device has had a signed-in FitLog session before. */
export function hasSignedInBefore(): boolean {
  try {
    return isReturningDevice(Object.keys(localStorage))
  } catch {
    return false
  }
}

export function rememberSignedIn(): void {
  try {
    localStorage.setItem(SIGNED_IN_BEFORE_KEY, '1')
  } catch {
    // Storage unavailable: the auth screen just opens on Create account next time.
  }
}
