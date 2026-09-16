/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Baked into the bundle at build time and shown in the app's menu - a cheap, permanent way
  // to tell at a glance whether an installed PWA is actually running the latest deploy, instead
  // of guessing from symptoms (this exact ambiguity cost several rounds chasing the iOS
  // bottom-gap bug, where "does force-quit even load new code" turned out to be its own bug).
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    host: true,
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
        name: 'FitLog',
        short_name: 'FitLog',
        description: 'Workout and meal tracker',
        theme_color: '#0b0f1e',
        background_color: '#0b0f1e',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        // .html deliberately excluded - src/sw.ts routes navigations through a network-first
        // strategy instead of precaching's default cache-first, so a stale shell can't get
        // stuck serving indefinitely (see the comment in sw.ts for why this mattered).
        globPatterns: ['**/*.{js,css,svg,png,ico}'],
      },
    }),
  ],
})
