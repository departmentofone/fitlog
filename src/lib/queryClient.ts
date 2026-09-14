import { MutationCache, QueryClient } from '@tanstack/react-query'
import { emitError } from './toastBus'

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      // Mutations paused by the offline queue (see offlinePersister.ts) don't reach here until
      // they actually run — a real failure once online still surfaces as an error toast.
      emitError(error instanceof Error ? error.message : 'Something went wrong')
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
