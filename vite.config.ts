import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base so the built app can be dropped into any subdirectory and
  // served from a plain static host.
  base: './',
  build: {
    target: 'es2022',
    outDir: 'docs'
  }
})
