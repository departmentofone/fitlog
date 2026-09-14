import { MutationCache, QueryClient } from '@tanstack/react-query'
import { emitError } from './toastBus'

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      emitError(error instanceof Error ? error.message : 'Something went wrong')
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})
