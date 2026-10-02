/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Captured from the real app at 1080x1920 (see store-listing/README.md) and shown in the richer
// Android install sheet. Order = display order.
const STORE_SCREENSHOTS = ['workouts', 'set-logging', 'meals', 'progress'] as const
const SCREENSHOT_LABELS: Record<(typeof STORE_SCREENSHOTS)[number], string> = {
  workouts: "Today's workout at a glance",
  'set-logging': 'Log sets fast with steppers and a rest timer',
  meals: 'Meals, macros, and water in one place',
  progress: 'Body weight over time, next to your goal',
}

// The app's web code version, for live updates (src/native/updates.ts): 1.<date>.<time>, so it's
// valid semver and always increases.
const now = new Date()
const WEB_VERSION = `1.${now.toISOString().slice(0, 10).replace(/-/g, '')}.${Number(now.toISOString().slice(11, 19).replace(/:/g, ''))}`

/**
 * Native builds only: writes the version next to the build (scripts/pack-web-update.mjs puts it in
 * the update manifest) and leaves out files the app never uses: store screenshots, the share
 * preview image, the website's policy pages and app-link file.
 */
function nativeBundle(): Plugin {
  return {
    name: 'fitlog-native-bundle',
    apply: 'build',
    closeBundle() {
      const out = fileURLToPath(new URL('./dist-native/', import.meta.url))
      for (const path of ['screenshots', 'shortcuts', '.well-known', 'og-image.png', 'privacy.html', 'legal.css']) {
        rmSync(out + path, { recursive: true, force: true })
      }
      writeFileSync(out + 'fitlog-version.json', JSON.stringify({ version: WEB_VERSION }) + '\n')
    },
  }
}

// https://vite.dev/config/
// `vite build --mode native` builds the app the Capacitor shell bundles (CAPACITOR_PLAN.md): into
// dist-native, without the service worker (the app's files are already on the phone, and a worker
// would only get between the app and its updates) and without the web-only deletion page.
export default defineConfig(({ mode }) => {
  const native = mode === 'native'
  const pages: Record<string, string> = { main: fileURLToPath(new URL('./index.html', import.meta.url)) }
  if (!native) pages.deleteAccount = fileURLToPath(new URL('./delete-account.html', import.meta.url))
  return {
  // Baked into the bundle at build time and shown in the app's menu - a cheap, permanent way
  // to tell at a glance whether an installed PWA is actually running the latest deploy, instead
  // of guessing from symptoms (this exact ambiguity cost several rounds chasing the iOS
  // bottom-gap bug, where "does force-quit even load new code" turned out to be its own bug).
  define: {
    __BUILD_TIME__: JSON.stringify(now.toISOString()),
    __WEB_VERSION__: JSON.stringify(WEB_VERSION),
  },
  build: {
    outDir: native ? 'dist-native' : 'dist',
    rollupOptions: {
      // Second page: the public, logged-out account deletion flow (served at /delete-account).
      input: pages,
    },
  },
  server: {
    host: true,
    // Lets a preview harness run a second dev server alongside one already on 5173.
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  },
  test: {
    // Most tests are pure logic and don't need a DOM — component tests opt into jsdom
    // individually with a `// @vitest-environment jsdom` comment, which keeps the suite fast.
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  plugins: [
    react(),
    tailwindcss(),
    native && nativeBundle(),
    VitePWA({
      disable: native,
      registerType: 'autoUpdate',
      // Switched from the default generateSW (fully auto-generated, no room for custom
      // event listeners) to injectManifest so src/sw.ts can handle `push`/`notificationclick`
      // for web push notifications (see PUSH_NOTIFICATIONS.md). Precaching behavior is
      // unchanged - src/sw.ts calls precacheAndRoute itself with the same file list.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['apple-touch-icon.png', 'favicon.svg'],
      manifest: {
        // Stable app identity - must never change once installed/published, even if start_url does.
        id: '/',
        name: 'FitLog - Workout & Meal Tracker',
        short_name: 'FitLog',
        description:
          'Workout, meal, macro, and fasting tracker. Log sets and meals, track goals and progress.',
        lang: 'en',
        dir: 'ltr',
        categories: ['health', 'fitness', 'lifestyle'],
        theme_color: '#0b0f1e',
        background_color: '#0b0f1e',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        // A shortcut tapped while FitLog is already open reuses that window and navigates it.
        launch_handler: { client_mode: ['navigate-existing', 'auto'] },
        prefer_related_applications: false,
        // Points browsers' install UI at the real Play listing (doesn't require the app to be
        // live yet - it's just a hint, and prefer_related_applications stays false so PWA install
        // is never blocked in its favor).
        related_applications: [
          {
            platform: 'play',
            id: 'com.departmentofone.fitlog',
            url: 'https://play.google.com/store/apps/details?id=com.departmentofone.fitlog',
          },
        ],
        // Lets someone share a link or a bit of text (a recipe URL, "2 eggs, 100g rice") into
        // FitLog from another app's share sheet. GET + query params only, no file/photo sharing -
        // that would need a service-worker POST handler. App.tsx reads title/text/url off the
        // URL once on launch; FoodPicker's search box picks up whatever it finds.
        share_target: {
          action: '/',
          method: 'GET',
          params: { title: 'share-title', text: 'share-text', url: 'share-url' },
        },
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Log a set',
            short_name: 'Log set',
            description: "Open today's workout with the exercise picker",
            url: '/?quick=set#/workouts',
            icons: [{ src: '/shortcuts/shortcut-set.png', sizes: '96x96', type: 'image/png' }],
          },
          {
            name: 'Log a meal',
            short_name: 'Log meal',
            description: "Add the next meal to today's log",
            url: '/?quick=meal#/meals',
            icons: [{ src: '/shortcuts/shortcut-meal.png', sizes: '96x96', type: 'image/png' }],
          },
          {
            name: 'Start a fast',
            short_name: 'Fast',
            description: 'Pick a fasting window and start the timer',
            url: '/?quick=fast#/fasting',
            icons: [{ src: '/shortcuts/shortcut-fast.png', sizes: '96x96', type: 'image/png' }],
          },
        ],
        screenshots: STORE_SCREENSHOTS.map((name) => ({
          src: `/screenshots/${name}.png`,
          sizes: '1080x1920',
          type: 'image/png',
          form_factor: 'narrow',
          label: SCREENSHOT_LABELS[name],
        })),
      },
      injectManifest: {
        // .html deliberately excluded - src/sw.ts routes navigations through a network-first
        // strategy instead of precaching's default cache-first, so a stale shell can't get
        // stuck serving indefinitely (see the comment in sw.ts for why this mattered).
        globPatterns: ['**/*.{js,css,svg,png,ico}'],
        // Store-size screenshots are only for install prompts - not worth precaching on every device.
        globIgnores: ['screenshots/**'],
      },
    }),
  ],
  }
})
