import { useSyncExternalStore } from 'react'
import { queryClient } from '../lib/queryClient'

const cache = queryClient.getMutationCache()

const getPausedCount = () => cache.getAll().filter((m) => m.state.isPaused).length

/**
 * `useMutation` constructs its MutationObserver during render, and the constructor notifies the
 * mutation cache synchronously (`observerOptionsUpdated`). Observer events never change which
 * mutations are paused, so ignore them - reacting would update this hook's owner while another
 * component (e.g. SessionTimer) is still rendering. useSyncExternalStore also skips re-renders
 * when the count hasn't changed.
 */
const subscribe = (onChange: () => void) =>
  cache.subscribe((event) => {
    if (event.type === 'added' || event.type === 'removed' || event.type === 'updated') onChange()
  })

/** Number of mutations currently paused (queued while offline, waiting to fire on reconnect). */
export function usePendingMutations() {
  return useSyncExternalStore(subscribe, getPausedCount)
}
