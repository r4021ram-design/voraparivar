import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('vanshavali_edited.json')) {
            return 'family-data';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  plugins: [react()],
})
