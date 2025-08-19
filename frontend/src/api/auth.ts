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

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Mock data for demo
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      return {
        user: {
          id: '1',
          email: credentials.email,
          name: 'Demo User',
          avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=DemoUser',
          kycStatus: 'verified',
        },
        token: 'mock-jwt-token-' + Date.now(),
      }
    }

    const response = await apiClient.post<LoginResponse>('/auth/login', credentials)
    return response.data
  },

  async logout(): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      return
    }

    await apiClient.post('/auth/logout')
  },
}
