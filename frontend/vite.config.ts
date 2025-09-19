import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "./src"),
      },
    },
    server: {
      port: 3000,
      host: true,
    },
    build: {
      outDir: 'dist',
    },
    define: {
      // Define environment variables for build
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || 'http://localhost:8001'),
      'import.meta.env.VITE_CHAIN_API_BASE_URL': JSON.stringify(env.VITE_CHAIN_API_BASE_URL || 'http://localhost:8000'),
      'import.meta.env.VITE_HORIZON_URL': JSON.stringify(env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org'),
      'import.meta.env.VITE_NETWORK_PASSPHRASE': JSON.stringify(env.VITE_NETWORK_PASSPHRASE || 'Test SDF Network; September 2015'),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
      'import.meta.env.VITE_GEMINI_MODEL': JSON.stringify(env.VITE_GEMINI_MODEL || 'gemini-2.0-flash'),
    },
  }
})
