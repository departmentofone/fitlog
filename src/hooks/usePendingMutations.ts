import { useEffect, useState } from 'react'
import { queryClient } from '../lib/queryClient'

/** Number of mutations currently paused (queued while offline, waiting to fire on reconnect). */
export function usePendingMutations() {
  const cache = queryClient.getMutationCache()
  const [count, setCount] = useState(() => cache.getAll().filter((m) => m.state.isPaused).length)

  useEffect(() => {
    const update = () => setCount(cache.getAll().filter((m) => m.state.isPaused).length)
    update()
    return cache.subscribe(update)
  }, [cache])

  return count
}
