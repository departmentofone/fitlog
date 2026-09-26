import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { subscribeToPush, unsubscribeFromPush, useIsPushSubscribed, usePushPermission } from '../../hooks/usePushSubscription'

/**
 * Push notifications on/off - see PUSH_NOTIFICATIONS.md. Subscriptions are stored in
 * push_subscriptions; the Vercel crons (weekly digest, streak check) send the pushes once the
 * VAPID keys and CRON_SECRET are set in Vercel.
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
    <div className="card p-4">
      <h3 className="mb-1 font-medium text-white">Notifications</h3>
      <p className="mb-3 text-xs text-slate-500">
        A summary of your week every Sunday, and an evening heads-up when your workout streak is about to end.
      </p>

      {permission === 'denied' ? (
        <p className="text-xs text-amber-400">
          Blocked in your browser/OS settings. Allow notifications for FitLog there, then reload.
        </p>
      ) : (
        <button
          onClick={handleToggle}
          disabled={pending}
          className={`w-full rounded-xl py-2.5 text-sm font-medium transition disabled:opacity-50 ${
            isSubscribed ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-emerald-600 text-on-accent hover:brightness-90'
          }`}
        >
          {pending ? 'Working…' : isSubscribed ? 'Notifications on — turn off' : 'Enable notifications'}
        </button>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
