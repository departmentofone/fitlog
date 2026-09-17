import { useEffect, useState } from 'react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { usePendingMutations } from '../hooks/usePendingMutations'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const pending = usePendingMutations()
  const [showSynced, setShowSynced] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true)
      return
    }
    if (wasOffline && pending === 0) {
      setShowSynced(true)
      setWasOffline(false)
      const t = setTimeout(() => setShowSynced(false), 3000)
      return () => clearTimeout(t)
    }
  }, [isOnline, pending, wasOffline])

  if (!isOnline) {
    return (
      <div className="flex items-center justify-center gap-1.5 bg-amber-500/15 px-4 py-1.5 text-xs font-medium text-amber-400">
        <span>Offline</span>
        <span className="text-amber-400/70">
          {pending > 0 ? `— ${pending} change${pending === 1 ? '' : 's'} will sync when you're back` : '— changes will sync automatically'}
        </span>
      </div>
    )
  }

  if (isOnline && pending > 0) {
    return (
      <div className="flex items-center justify-center gap-1.5 bg-success/15 px-4 py-1.5 text-xs font-medium text-success">
        <span>Syncing {pending} change{pending === 1 ? '' : 's'}…</span>
      </div>
    )
  }

  if (showSynced) {
    return (
      <div className="flex items-center justify-center gap-1.5 bg-success/15 px-4 py-1.5 text-xs font-medium text-success">
        <span>Back online — synced</span>
      </div>
    )
  }

  return null
}
