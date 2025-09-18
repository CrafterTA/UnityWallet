import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
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
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || 'http://localhost:8001'),
    'import.meta.env.VITE_CHAIN_API_BASE_URL': JSON.stringify(process.env.VITE_CHAIN_API_BASE_URL || 'http://localhost:8000'),
    'import.meta.env.VITE_HORIZON_URL': JSON.stringify(process.env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org'),
    'import.meta.env.VITE_NETWORK_PASSPHRASE': JSON.stringify(process.env.VITE_NETWORK_PASSPHRASE || 'Test SDF Network; September 2015'),
  },
})
