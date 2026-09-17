import type { SupabaseClient } from '@supabase/supabase-js'

/** localStorage keys the app writes that belong to (or describe) the signed-in account. */
const LOCAL_KEYS = ['fitlog-query-cache']
const LOCAL_PREFIXES = ['fitlog-celebrated-unlocks:']

/**
 * Calls the server-side deletion endpoint with the current session's access token, then removes
 * everything the deleted account left on this device and signs out. Shared by the in-app Settings
 * flow and the public /delete-account page. Throws with a user-facing message on failure.
 */
export async function deleteAccount(client: SupabaseClient, onDeleted?: () => void): Promise<void> {
  const { data } = await client.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Please sign in again, then retry.')

  let response: Response
  try {
    response = await fetch('/api/account/delete', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.")
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? "We couldn't delete your account. Please try again.")
  }

  onDeleted?.()

  try {
    for (const key of Object.keys(localStorage)) {
      if (LOCAL_KEYS.includes(key) || LOCAL_PREFIXES.some((p) => key.startsWith(p))) localStorage.removeItem(key)
    }
  } catch {
    // Storage unavailable - nothing to clean.
  }
  // The user no longer exists server-side; this just clears the local session.
  await client.auth.signOut({ scope: 'local' }).catch(() => {})
}
