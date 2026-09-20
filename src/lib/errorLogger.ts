import { supabase } from './supabase'

const MAX_LOGS_PER_SESSION = 20

/**
 * Path + in-app route only. location.href can hold Supabase auth tokens (#access_token=...) right
 * after a password-reset or confirmation link, and those must never reach a stored log.
 */
function safeUrl(): string {
  const route = location.hash.includes('=') ? '#<auth-callback>' : location.hash
  return `${location.pathname}${route}`
}
let logged = 0

async function logError(message: string, stack?: string) {
  if (logged >= MAX_LOGS_PER_SESSION) return
  logged++
  try {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return // error_logs RLS requires a signed-in writer - nothing to do pre-auth.
    await supabase.from('error_logs').insert({
      user_id: auth.user.id,
      message: message.slice(0, 2000),
      stack: stack?.slice(0, 4000) ?? null,
      url: safeUrl(),
      user_agent: navigator.userAgent,
    })
  } catch {
    // The logger itself must never throw - a broken logger crashing the app would be worse than
    // the original error going unreported.
  }
}

/** Call once at app startup. Catches uncaught errors and unhandled promise rejections and writes
 * them to Supabase (error_logs table, migration_v15) so a real bug surfaces without someone
 * having to notice and describe it to you first. */
export function initErrorLogger() {
  window.addEventListener('error', (event) => {
    void logError(event.message, event.error?.stack)
  })
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const message = reason instanceof Error ? reason.message : String(reason)
    const stack = reason instanceof Error ? reason.stack : undefined
    void logError(message, stack)
  })
}
