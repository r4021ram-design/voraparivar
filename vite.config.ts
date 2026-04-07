import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // ReactFlow + dagre (graph rendering engine)
          if (id.includes('reactflow') || id.includes('dagre') || id.includes('@reactflow')) {
            return 'vendor-reactflow';
          }
          // Supabase client
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
          // Icon library
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          // html-to-image (export feature)
          if (id.includes('html-to-image')) {
            return 'vendor-export';
          }
        },
      },
    },
  },
  plugins: [react()],
})
