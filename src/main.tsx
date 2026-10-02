import { Capacitor } from '@capacitor/core'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ToastProvider } from './components/ToastProvider.tsx'
import { AuthProvider } from './hooks/useAuth.tsx'
import { initErrorLogger } from './lib/errorLogger'
import { offlinePersister, PERSIST_MAX_AGE, shouldDehydrateQuery } from './lib/offlinePersister'
import { isAndroidApp } from './lib/platform'
import { queryClient } from './lib/queryClient'
import './lib/viewportHeight'

initErrorLogger()
// Record the Play (TWA) launch while the android-app:// referrer or ?source=play is still present.
isAndroidApp()

async function boot() {
  // In the Capacitor app, native startup first (src/native/init.ts); the web never loads it. If it
  // fails, the app still starts, without the native extras.
  let native: typeof import('./native/init') | null = null
  if (Capacitor.isNativePlatform()) {
    try {
      native = await import('./native/init')
      if (!(await native.startNative())) return
    } catch (err) {
      console.error('Native startup failed', err)
    }
  }

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

  native?.afterFirstRender()
}

void boot()
