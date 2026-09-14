import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ToastProvider } from './components/ToastProvider.tsx'
import { AuthProvider } from './hooks/useAuth.tsx'
import { offlinePersister, PERSIST_MAX_AGE, shouldDehydrateQuery } from './lib/offlinePersister'
import { queryClient } from './lib/queryClient'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: offlinePersister,
        maxAge: PERSIST_MAX_AGE,
        dehydrateOptions: {
          shouldDehydrateQuery,
          // Mutations aren't replayable after a reload (their mutationFn is an in-memory
          // closure) — see offlinePersister.ts for why. Only cached reads are persisted.
          shouldDehydrateMutation: () => false,
        },
      }}
    >
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
)
