export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface UserProfile {
  username: string
  full_name: string
  email?: string
  stellar_public_key?: string
}

// Simple in-memory auth system for wallet-only app
export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // Simple demo auth - in production would use proper authentication
      const storedUser = localStorage.getItem('user_profile')
      if (storedUser) {
        const user = JSON.parse(storedUser)
        if (user.username === credentials.username) {
          // Generate a simple token
          const token = btoa(JSON.stringify({ 
            username: credentials.username, 
            timestamp: Date.now() 
          }))
          localStorage.setItem('auth_token', token)
          return {
            access_token: token,
            token_type: 'bearer'
          }
        }
      }
      
      // For demo purposes, allow any login
      const token = btoa(JSON.stringify({ 
        username: credentials.username, 
        timestamp: Date.now() 
      }))
      localStorage.setItem('auth_token', token)
      
      // Create default user profile
      const defaultProfile: UserProfile = {
        username: credentials.username,
        full_name: credentials.username.charAt(0).toUpperCase() + credentials.username.slice(1),
        stellar_public_key: localStorage.getItem('stellar_public_key') || undefined
      }
      localStorage.setItem('user_profile', JSON.stringify(defaultProfile))
      
      return {
        access_token: token,
        token_type: 'bearer'
      }
    } catch (error) {
      throw new Error('Login failed. Please check your credentials and try again.')
    }
  },

  async getProfile(): Promise<UserProfile> {
    try {
      const storedProfile = localStorage.getItem('user_profile')
      if (storedProfile) {
        const profile = JSON.parse(storedProfile)
        // Update with current stellar key if available
        profile.stellar_public_key = localStorage.getItem('stellar_public_key') || profile.stellar_public_key
        return profile
      }
      
      // Return default profile
      return {
        username: 'user',
        full_name: 'SoviPay User',
        stellar_public_key: localStorage.getItem('stellar_public_key') || undefined
      }
    } catch (error) {
      throw new Error('Failed to fetch user profile')
    }
  },

  async logout(): Promise<void> {
    try {
      // Clear all auth data but keep wallet data
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_profile')
    } catch (error) {
      console.warn('Logout cleanup failed:', error)
    }
  },

  async register(payload: { username: string; full_name: string; password: string }): Promise<{ ok: true }> {
    try {
      // Simple registration - store user profile
      const userProfile: UserProfile = {
        username: payload.username,
        full_name: payload.full_name,
        stellar_public_key: localStorage.getItem('stellar_public_key') || undefined
      }
      localStorage.setItem('user_profile', JSON.stringify(userProfile))
      
      return { ok: true }
    } catch (error) {
      throw new Error('Registration failed. Please try again.')
    }
  },

  // Helper method to check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token')
    if (!token) return false
    
    try {
      const decoded = JSON.parse(atob(token))
      // Token expires after 24 hours
      return Date.now() - decoded.timestamp < 24 * 60 * 60 * 1000
    } catch {
      return false
    }
  }
}
