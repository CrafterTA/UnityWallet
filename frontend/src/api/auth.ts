import { apiClient } from './client'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: {
    id: string
    email: string
    name: string
    avatar?: string
    kycStatus: 'pending' | 'verified' | 'rejected'
  }
  token: string
}

// Helper to build a mock login response
function buildMockResponse(email: string): LoginResponse {
  return {
    user: {
      id: '1',
      email,
      name: 'Thang Pham',
      kycStatus: 'verified',
    },
    token: 'mock-jwt-token-' + Date.now(),
  }
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const useMock = import.meta.env.VITE_USE_MOCK === 'true'
    const allowDemoFallback = import.meta.env.VITE_ALLOW_DEMO_LOGIN === 'true'

    if (useMock) {
      return buildMockResponse(credentials.email)
    }

    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials)
      return response.data
    } catch (err: any) {
      // Network / backend not available fallback (dev convenience)
      const isNetworkIssue =
        (err?.message && /fetch|network|failed/i.test(err.message)) || err?.status === 'error'
      if (allowDemoFallback && isNetworkIssue) {
        console.warn('[authApi] Backend unavailable, falling back to demo login:', err)
        return buildMockResponse(credentials.email)
      }
      throw err
    }
  },

  async logout(): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') return
    try {
      await apiClient.post('/auth/logout')
    } catch (err) {
      // Non‑critical; just log
      console.warn('[authApi] logout error (ignored):', err)
    }
  },

  // Simple mock register for demo; backend call if available
  async register(payload: { name: string; email: string; password: string }): Promise<{ ok: true }> {
    const useMock = import.meta.env.VITE_USE_MOCK === 'true'
    if (useMock) {
      return { ok: true }
    }
    try {
      await apiClient.post('/auth/register', payload)
      return { ok: true }
    } catch (err: any) {
      const isNetworkIssue = (err?.message && /fetch|network|failed/i.test(err.message)) || err?.status === 'error'
      if (isNetworkIssue) {
        console.warn('[authApi] Backend unavailable, falling back to mock register:', err)
        return { ok: true }
      }
      throw err
    }
  },
}
