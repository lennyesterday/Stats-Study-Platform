import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // all course content ships in the main chunk on purpose (local app, works offline)
  build: { chunkSizeWarningLimit: 1600 },
  test: { environment: 'node' },
} as never)
