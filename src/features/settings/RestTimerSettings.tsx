import { useState } from 'react'
import { Toggle } from '../../components/Toggle'
import { notificationPermission } from '../../lib/restNotification'
import { setRestTimerPref, useRestTimerPref } from '../../lib/restTimerPrefs'

/** The rest timer's two switches. Saved on this device, like the rest length itself. */
export function RestTimerSettings() {
  const autoStart = useRestTimerPref('autoStart')
  const notifications = useRestTimerPref('notifications')
  const [permission, setPermission] = useState(() => notificationPermission())

  async function setNotifications(next: boolean) {
    setRestTimerPref('notifications', next)
    if (next && permission === 'default') {
      try {
        setPermission(await Notification.requestPermission())
      } catch {
        setPermission(notificationPermission())
      }
    }
  }

  const hint =
    permission === 'unsupported'
      ? "This browser can't show notifications. The timer still runs in the app."
      : permission === 'denied'
        ? "Notifications are blocked for FitLog. Allow them in your phone's settings for FitLog to use this."
        : null

  return (
    <div className="divide-y divide-white/5 card px-4">
      <div className="flex items-center justify-between gap-4 py-3">
        <div>
          <h3 className="card-title">Start rest timer after each set</h3>
          <p className="text-xs text-slate-500">When off, tap Start on the timer instead</p>
        </div>
        <Toggle label="Start rest timer after each set" checked={autoStart} onChange={(next) => setRestTimerPref('autoStart', next)} />
      </div>
      <div className="py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="card-title">Rest timer notifications</h3>
            <p className="text-xs text-slate-500">The countdown in your notification bar, and an alert when rest is over</p>
          </div>
          <Toggle label="Rest timer notifications" checked={notifications} onChange={(next) => void setNotifications(next)} />
        </div>
        {notifications && hint && <p className="mt-2 text-xs text-amber-400">{hint}</p>}
      </div>
    </div>
  )
}
