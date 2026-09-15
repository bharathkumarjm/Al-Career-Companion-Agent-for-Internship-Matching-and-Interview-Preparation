import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/resumes': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/profile': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/docs': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/openapi.json': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
    },
  },
})
