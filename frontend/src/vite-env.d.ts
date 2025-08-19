/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_USE_MOCK: string
  readonly VITE_STELLAR_NETWORK: string
  readonly VITE_HORIZON_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
