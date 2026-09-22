/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Captured from the real app at 1080x1920 (see store-listing/README.md) and shown in the richer
// Android install sheet. Order = display order.
const STORE_SCREENSHOTS = ['workouts', 'set-logging', 'meals', 'more'] as const
const SCREENSHOT_LABELS: Record<(typeof STORE_SCREENSHOTS)[number], string> = {
  workouts: "Today's workout at a glance",
  'set-logging': 'Log sets fast with steppers and a rest timer',
  meals: 'Meals, macros, and water in one place',
  more: 'Every section one tap away',
}

// https://vite.dev/config/
export default defineConfig({
  // Baked into the bundle at build time and shown in the app's menu - a cheap, permanent way
  // to tell at a glance whether an installed PWA is actually running the latest deploy, instead
  // of guessing from symptoms (this exact ambiguity cost several rounds chasing the iOS
  // bottom-gap bug, where "does force-quit even load new code" turned out to be its own bug).
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    rollupOptions: {
      // Second page: the public, logged-out account deletion flow (served at /delete-account).
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        deleteAccount: fileURLToPath(new URL('./delete-account.html', import.meta.url)),
      },
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
    VitePWA({
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
          'Free workout, meal, macro, and fasting tracker. Log sets and meals, track goals and progress. No ads, no paywalls.',
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
})
