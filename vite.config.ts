import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('reactflow') || id.includes('d3') || id.includes('dagre')) {
              return 'vendor-flow';
            }
            if (id.includes('lucide-react') || id.includes('html-to-image')) {
              return 'vendor-ui';
            }
            if (id.includes('supabase')) {
              return 'vendor-supabase';
            }
            return 'vendor';
          }
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
