import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
    minify: 'esbuild',
    commonjsOptions: {
      transformMixedEsModules: true,
      ignoreDynamicRequires: true,
      include: [/node_modules/],
      exclude: [/\.esm\.js$/], // Don't try to CJS-transform ESM files
    },
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Graph rendering engine (Heavy CJS)
          if (id.includes('dagre')) {
            return 'vendor-dagre';
          }
          // ReactFlow (Types & Flow logic)
          if (id.includes('reactflow') || id.includes('@reactflow')) {
            return 'vendor-reactflow';
          }
          // Supabase client
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
          // Other distinct vendors
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('jspdf')) return 'vendor-pdf';
        },
      },
    },
  },
  plugins: [react(), cloudflare()],
})