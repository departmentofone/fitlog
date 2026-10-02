import { App } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { focusManager } from '@tanstack/react-query'
import { setAppActive } from '../lib/appState'
import { supabase } from '../lib/supabase'
import { startLinks } from './links'
import { startPush } from './push'
import { startTipStore } from './tipStore'
import { checkForUpdate, confirmBundleWorks, switchToDownloadedUpdate } from './updates'

/**
 * Startup in the Capacitor app (main.tsx loads this only there, so the web never downloads it).
 * Returns false when the app is about to reload (into a downloaded update, or to open a link), in
 * which case nothing should render.
 */
export async function startNative(): Promise<boolean> {
  if (await switchToDownloadedUpdate()) return false
  await confirmBundleWorks()
  if (await startLinks()) return false

  // Android's back button steps back through screens and sheets (each keeps a history entry, see
  // useHashRoute), and from the first screen puts FitLog in the background like the home button.
  void App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back()
    else void App.minimizeApp()
  })

  // Whether the app is in the foreground, from Android's lifecycle rather than the page's visibility.
  void App.addListener('appStateChange', ({ isActive }) => setAppActive(isActive))

  // Data refreshes when the app comes back to the front, as it does when a browser tab does.
  focusManager.setEventListener((setFocused) => {
    const handle = App.addListener('appStateChange', ({ isActive }) => setFocused(isActive))
    return () => void handle.then((h) => h.remove())
  })

  // Before the first render, so the tip jar's entry points show from the start.
  await startTipStore()
  return true
}

/** After the first render: drop the splash, then the work that can wait. */
export function afterFirstRender() {
  requestAnimationFrame(() => requestAnimationFrame(() => void SplashScreen.hide({ fadeOutDuration: 150 })))

  void supabase.auth.getSession().then(({ data }) =>
    startPush(data.session?.user.id ?? null, (url) => {
      // Notifications point at a screen (#/...) or the start page.
      const hash = url.includes('#') ? url.slice(url.indexOf('#')) : null
      if (hash) window.location.hash = hash
    }),
  )

  // In the background, once the app is up: fetch newer web code for the next launch.
  setTimeout(() => void checkForUpdate(), 5000)
}
