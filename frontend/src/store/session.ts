import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { QueryClient } from '@tanstack/react-query'

interface Wallet {
  public_key: string
  secret: string
  mnemonic?: string
  account_exists: boolean
  funded_or_existing: boolean
  balances: Record<string, string>
  created_at: string
}

interface AuthState {
  wallet: Wallet | null
  isAuthenticated: boolean
  queryClient: QueryClient | null
  setWallet: (wallet: Wallet) => void
  setQueryClient: (client: QueryClient) => void
  logout: () => void
  updateWallet: (updates: Partial<Wallet>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      wallet: null,
      isAuthenticated: false,
      queryClient: null,
      
      setWallet: (wallet: Wallet) => {
        set({ wallet, isAuthenticated: true })
      },
      
      setQueryClient: (client: QueryClient) => {
        set({ queryClient: client })
      },
      
      logout: () => {
        // Clear only auth-related data, preserve theme and other preferences
        localStorage.removeItem('unity-wallet-auth')
        
        // Clear all other localStorage keys except theme
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key !== 'theme-storage') {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
        
        // Clear session storage
        sessionStorage.clear()
        
        // Clear query cache
        const { queryClient } = get()
        if (queryClient) {
          queryClient.clear()
        }
        
        // Reset state
        set({ wallet: null, isAuthenticated: false })
      },
      
      updateWallet: (updates: Partial<Wallet>) => {
        const currentWallet = get().wallet
        if (currentWallet) {
          set({ wallet: { ...currentWallet, ...updates } })
        }
      },
    }),
    {
      name: 'unity-wallet-auth',
      partialize: (state: AuthState) => ({
        wallet: state.wallet,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
