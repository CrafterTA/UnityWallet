import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { QueryClient } from '@tanstack/react-query'
import { SecureStorage } from '@/lib/secureStorage'

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
  isLocked: boolean
  queryClient: QueryClient | null
  setWallet: (wallet: Wallet) => void
  setQueryClient: (client: QueryClient) => void
  logout: () => void
  updateWallet: (updates: Partial<Wallet>) => void
  lockWallet: () => void
  unlockWallet: (password: string) => Promise<boolean>
  saveSecureWalletData: (secret: string, password: string, mnemonic?: string) => Promise<void>
  loadSecureWalletData: (password: string) => Promise<{ secret: string; mnemonic?: string } | null>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      wallet: null,
      isAuthenticated: false,
      isLocked: false,
      queryClient: null,
      
      setWallet: (wallet: Wallet) => {
        set({ wallet, isAuthenticated: true, isLocked: false })
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
        
        // Explicitly remove password if it exists
        localStorage.removeItem('wallet-password')
        
        // Clear secure data from sessionStorage
        SecureStorage.clearSecureData()
        
        // Clear query cache
        const { queryClient } = get()
        if (queryClient) {
          queryClient.clear()
        }
        
        // Reset state
        set({ wallet: null, isAuthenticated: false, isLocked: false })
      },
      
      updateWallet: (updates: Partial<Wallet>) => {
        const currentWallet = get().wallet
        if (currentWallet) {
          set({ wallet: { ...currentWallet, ...updates } })
        }
      },
      
      lockWallet: () => {
        // Only set locked state, don't clear secret key from memory
        // Secret key will be cleared only on logout
        set({ isLocked: true })
      },
      
      unlockWallet: async (password: string) => {
        // Web3 standard: verify password by trying to decrypt secret key
        try {
          const secret = await SecureStorage.getSecureItem('wallet-secret', password)
          const mnemonic = await SecureStorage.getSecureItem('wallet-mnemonic', password)
          
          if (secret || mnemonic) {
            // Load secret key and mnemonic into memory
            const currentWallet = get().wallet
            if (currentWallet) {
              set({ 
                isLocked: false,
                wallet: {
                  ...currentWallet,
                  secret: secret || '',
                  mnemonic: mnemonic || undefined
                }
              })
            } else {
              set({ isLocked: false })
            }
            return true
          }
          
          return false
        } catch (error) {
          console.error('Failed to verify password:', error)
          return false
        }
      },

      saveSecureWalletData: async (secret: string, password: string, mnemonic?: string) => {
        try {
          // Web3 standard: encrypt secret key with password
          if (secret) {
            await SecureStorage.setSecureItem('wallet-secret', secret, password)
          }
          // Also save mnemonic for backup
          if (mnemonic) {
            await SecureStorage.setSecureItem('wallet-mnemonic', mnemonic, password)
          }
        } catch (error) {
          console.error('Failed to save secure wallet data:', error)
          throw new Error('Failed to save wallet data securely')
        }
      },

      loadSecureWalletData: async (password: string) => {
        try {
          // Try to load secret key first (Web3 standard)
          const secret = await SecureStorage.getSecureItem('wallet-secret', password)
          const mnemonic = await SecureStorage.getSecureItem('wallet-mnemonic', password)
          
          if (secret) {
            return { secret, mnemonic: mnemonic || undefined }
          }
          
          // Fallback to mnemonic if no secret key
          if (mnemonic) {
            return { secret: '', mnemonic }
          }
          
          return null
        } catch (error) {
          console.error('Failed to load secure wallet data:', error)
          return null
        }
      },
    }),
    {
      name: 'unity-wallet-auth',
      partialize: (state: AuthState) => ({
        // Store all wallet data including secret and mnemonic in localStorage
        // This ensures memory is preserved when reloading the page
        wallet: state.wallet,
        isAuthenticated: state.isAuthenticated,
        isLocked: state.isLocked,
      }),
    }
  )
)
