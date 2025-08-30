import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  username: string
  full_name: string
  name?: string // Added for compatibility
  email?: string // Added for compatibility
  avatar?: string
  phone?: string
  location?: string
  bio?: string
  kyc_status: 'PENDING' | 'VERIFIED' | 'REJECTED'
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  token: string | null
  login: (user: User, token: string) => void
  loginWithToken: (token: string) => void
  setUserProfile: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      
      login: (user: User, token: string) => {
        set({ user, token, isAuthenticated: true })
      },
      
      loginWithToken: (token: string) => {
        // For backend API that only returns token
        set({ token, isAuthenticated: true, user: null })
      },
      
      setUserProfile: (user: User) => {
        set({ user })
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },
      
      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } })
        }
      },
    }),
    {
      name: 'unity-wallet-auth',
      partialize: (state: AuthState) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
