import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app/frontend'),
    },
  },
  root: 'app/frontend',
  build: {
    outDir: '../../app/assets/builds',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/users': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/dashboard': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/projects': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
