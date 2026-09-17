import { MutationCache, QueryClient } from '@tanstack/react-query'
import { emitError } from './toastBus'

/**
 * Supabase returns plain `{ code, message }` objects rather than Error instances, so read the
 * message off either shape. A missing table/column (PostgREST PGRST204/PGRST205, Postgres 42703)
 * means a database migration hasn't been run yet - say that instead of leaking the raw text.
 */
export function describeError(error: unknown): string {
  const e = (error ?? {}) as { code?: string; message?: string }
  if (e.code === 'PGRST205' || e.code === 'PGRST204' || e.code === '42703' || e.code === '42P01') {
    return "This feature isn't set up on the server yet - the database needs an update."
  }
  return typeof e.message === 'string' && e.message ? e.message : 'Something went wrong'
}

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      // Mutations paused by the offline queue (see offlinePersister.ts) don't reach here until
      // they actually run — a real failure once online still surfaces as an error toast.
      emitError(describeError(error))
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      // Kept in the cache long enough to read from while offline (see offlinePersister.ts).
      gcTime: 24 * 60 * 60 * 1000,
    },
  },
})
