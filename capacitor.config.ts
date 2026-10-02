import type { CapacitorConfig } from '@capacitor/cli'

/**
 * The FitLog app on Android (and iOS later), built with Capacitor. See CAPACITOR_PLAN.md and
 * NATIVE_DEV.md. The web code is bundled into the app from dist-native (`npm run build:native`) and
 * kept current by live updates (src/native/updates.ts), so a web deploy reaches the app without a
 * store release.
 */
const config: CapacitorConfig = {
  // The Play listing's package. It must never change: the app ships as an update to it.
  appId: 'com.departmentofone.fitlog',
  appName: 'FitLog',
  webDir: 'dist-native',
  // Behind the web view while it loads: FitLog's navy, so the start never flashes white.
  backgroundColor: '#0b0f1e',
  android: {
    // Only http(s) from the app itself; everything else goes through the network as usual.
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      // Hidden by the app once it has drawn (src/native/init.ts), so there's no white flash.
      launchAutoHide: false,
      backgroundColor: '#0b0f1e',
      showSpinner: false,
    },
    SystemBars: {
      // Capacitor puts the real safe areas in --safe-area-inset-* (older Android WebViews report
      // env(safe-area-inset-*) wrong); the app's CSS reads those first.
      insetsHandling: 'css',
    },
    Keyboard: {
      // The page shrinks above the keyboard, so inputs at the bottom stay visible.
      resizeOnFullScreen: true,
    },
    CapacitorUpdater: {
      // Updates are checked, downloaded and switched to by the app itself, at launch only, so a
      // workout in progress is never reloaded under someone (src/native/updates.ts). Nothing is
      // sent to Capgo's servers: no update, stats or channel URLs of theirs.
      autoUpdate: false,
      updateUrl: '',
      statsUrl: '',
      channelUrl: '',
      appReadyTimeout: 10000,
      resetWhenUpdate: true,
      autoDeleteFailed: true,
      autoDeletePrevious: true,
    },
  },
}

export default config
