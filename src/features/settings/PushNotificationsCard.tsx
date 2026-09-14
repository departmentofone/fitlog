import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { subscribeToPush, unsubscribeFromPush, useIsPushSubscribed, usePushPermission } from '../../hooks/usePushSubscription'

/**
 * Scaffolding for push notifications - see PUSH_NOTIFICATIONS.md. Subscribing works end to end
 * up through storing the subscription, but push_subscriptions doesn't exist in the database yet
 * and nothing sends a real push. This card is here so the client half is real and testable; the
 * sending half (Vercel cron -> web-push) is a separate, not-yet-enabled piece.
 */
export function PushNotificationsCard() {
  const { user } = useAuth()
  const permission = usePushPermission()
  const { isSubscribed, checked, setIsSubscribed } = useIsPushSubscribed()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (permission === 'unsupported' || !checked) return null

  async function handleToggle() {
    if (!user) return
    setError(null)
    setPending(true)
    try {
      if (isSubscribed) {
        await unsubscribeFromPush()
        setIsSubscribed(false)
      } else {
        await subscribeToPush(user.id)
        setIsSubscribed(true)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <h3 className="mb-1 font-medium text-white">Notifications</h3>
      <p className="mb-3 text-xs text-slate-500">
        Get your weekly digest as a push notification instead of only seeing it in the app.
      </p>

      {permission === 'denied' ? (
        <p className="text-xs text-amber-400">
          Blocked in your browser/OS settings. Allow notifications for FitLog there, then reload.
        </p>
      ) : (
        <button
          onClick={handleToggle}
          disabled={pending}
          className={`w-full rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-50 ${
            isSubscribed ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-emerald-600 text-white hover:bg-emerald-500'
          }`}
        >
          {pending ? 'Working…' : isSubscribed ? 'Notifications on — turn off' : 'Enable notifications'}
        </button>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
