import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

/**
 * Persists successful query results to localStorage so the app still has something to show
 * (today's session, meals, etc.) when opened with no connection. Mutations are deliberately
 * NOT persisted — a queued write's mutationFn is an in-memory closure (e.g. it captures a
 * sessionId), so it can't be replayed after a full page reload without a much bigger refactor.
 * Within a single open tab, React Query already pauses mutations while offline and fires them
 * automatically on reconnect — this persister only extends that to "the data is still visible
 * across a reload while offline," not "a queued write survives a reload while offline."
 */
export const offlinePersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'fitlog-query-cache',
})

export const PERSIST_MAX_AGE = 24 * 60 * 60 * 1000

export function shouldDehydrateQuery(query: { state: { status: string } }) {
  return query.state.status === 'success'
}
