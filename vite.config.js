import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    strictPort: true,
    port: 5173,
  },
  build: {
    // pdf renderer se divide en chunk aparte; subir umbral de warning
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          recharts: ['recharts'],
          pdf: ['@react-pdf/renderer'],
        },
      },
    },
  },
})
