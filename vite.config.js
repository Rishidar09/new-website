import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // hmr: { clientPort: 443 } is often needed for ngrok so Vite knows to use 443 for HMR
    allowedHosts: true,
    // Disabling local HTTPS for now to make ngrok testing much easier.
    // ngrok provides its own HTTPS tunnel for the public link.
    https: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true,
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      }
    }
  },
})
