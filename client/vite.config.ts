import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const serverEnv = loadEnv(mode, '../server', '')
  const apiPort = serverEnv.PORT || '5000'
  const apiTarget = process.env.VITE_API_PROXY_TARGET || `http://localhost:${apiPort}`

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': apiTarget,
      },
    },
  }
})
