import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({mode}) => ({
  define: { __AI_DESIGN_ENABLED__: JSON.stringify(loadEnv(mode, process.cwd(), 'AI_DESIGN_ENABLED').AI_DESIGN_ENABLED === 'true') },
  plugins: [react()],
  // Emulator handle materials and its renderer must share the app Three.js.
  resolve: { dedupe: ["three"] },
  preview: { proxy: { "/api": { target: `http://127.0.0.1:${Number(process.env.LOCAL_API_PORT)||3001}`, changeOrigin: false } } },
  server: {
    proxy: { "/api": { target: `http://127.0.0.1:${Number(process.env.LOCAL_API_PORT)||3001}`, changeOrigin: false } },
  },
}))
