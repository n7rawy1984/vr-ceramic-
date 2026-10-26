import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Emulator handle materials and its renderer must share the app Three.js.
  resolve: { dedupe: ["three"] },
  server: {
    proxy: { "/api": { target: "http://127.0.0.1:3001", changeOrigin: false } },
  },
})
