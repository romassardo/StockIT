import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Redirige cualquier petición que comience con /api al backend en el puerto 3002
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true, // Necesario para vhosts
        secure: false,      // No verificar certs SSL
      }
    }
  }
})
