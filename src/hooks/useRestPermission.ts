import { useCallback, useEffect, useState } from 'react'
import { initialRestPermission, requestRestPermission, restPermission, type RestPermission } from '../lib/restNotification'

/**
 * Notification permission for the rest timer, on the web and in the app. The app's answer comes
 * from the native side asynchronously and is checked again whenever FitLog comes back to the
 * front, since it can be changed in system settings in between.
 */
export function useRestPermission(): [RestPermission, () => Promise<RestPermission>] {
  const [permission, setPermission] = useState<RestPermission>(() => initialRestPermission())

  useEffect(() => {
    let cancelled = false
    const refresh = () => {
      void restPermission().then((p) => {
        if (!cancelled) setPermission(p)
      })
    }
    refresh()
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const request = useCallback(async () => {
    const next = await requestRestPermission()
    setPermission(next)
    return next
  }, [])

  return [permission, request]
}
