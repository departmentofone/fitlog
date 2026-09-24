import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Library build of design-system/index.ts. Tailwind scans the whole app (its source detection
// starts at the repo root), so the compiled CSS carries every utility FitLog actually uses.
export default defineConfig({
  root: resolve(__dirname, '..'),
  // The app's public/ (icons, privacy page) has no place in a component library.
  publicDir: false,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'style',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
})
