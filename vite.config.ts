/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
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
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
