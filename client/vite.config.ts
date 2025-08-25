import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
const API_PORT = Number(process.env.VITE_API_PORT || 5060)

export default defineConfig({
  plugins: [react()],
  define: {
  // Expose NEXT_PUBLIC_ fallback as a global for client code
  __NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY__: JSON.stringify(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
  target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
  target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
  },
})