import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En desarrollo /api va al backend local: misma origen, así la cookie de sesión funciona sin CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:8080' },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
