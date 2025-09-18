import { apiClient } from './client'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // Backend expects query parameters, not body
      const response = await apiClient.post<LoginResponse>(`/auth/login?username=${credentials.username}&password=${credentials.password}`)
      return response.data
    } catch (error) {
      throw new Error('Login failed. Please check your credentials and try again.')
    }
  },

  async getProfile(): Promise<any> {
    try {
      const response = await apiClient.get<any>('/auth/me')
      return response.data
    } catch (error) {
      throw new Error('Failed to fetch user profile')
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      // Logout should always succeed locally even if backend call fails
      console.warn('Backend logout failed, but local logout succeeded:', error)
    }
  },

  async register(payload: { username: string; full_name: string; password: string }): Promise<{ ok: true }> {
    try {
      await apiClient.post('/auth/register', payload)
      return { ok: true }
    } catch (error) {
      throw new Error('Registration failed. Please try again.')
    }
  },
}
