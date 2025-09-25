import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { QueryClient } from '@tanstack/react-query'
import { Web3Keystore } from '@/lib/web3Keystore'
import { SessionManager } from '@/lib/sessionManager'

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
  saveSecureWalletData: (secret: string, password: string, publicKey: string, mnemonic?: string) => Promise<void>
  initializeFromSession: () => Promise<boolean>
  refreshSession: () => Promise<boolean>
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
        // Clear session with SessionManager
        SessionManager.logout()
        
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
        
        // Clear Web3 keystore from localStorage
        Web3Keystore.clearKeystore()
        
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
        try {
          // Try to login with SessionManager (creates session)
          const loginResult = await SessionManager.login(
            get().wallet?.public_key || '', 
            password
          )

          if (loginResult.success && loginResult.sessionData) {
            // Verify session to get decrypted secret
            const verifyResult = await SessionManager.verifySession()
            
            if (verifyResult.success && verifyResult.secret) {
              const currentWallet = get().wallet
              if (currentWallet) {
                set({ 
                  isLocked: false,
                  wallet: {
                    ...currentWallet,
                    secret: verifyResult.secret,
                  }
                })
              }
              return true
            }
          }
          
          // Fallback to old method if session login fails
          const keystore = Web3Keystore.loadKeystore()
          if (!keystore) {
            return false
          }

          const secret = await Web3Keystore.decryptKeystore(keystore, password)
          
          const currentWallet = get().wallet
          if (currentWallet) {
            set({ 
              isLocked: false,
              wallet: {
                ...currentWallet,
                secret: secret,
              }
            }) 
          } else {
            set({ isLocked: false })
          }
          return true
        } catch (error) {
          console.error('Failed to unlock wallet:', error)
          return false
        }
      },

      initializeFromSession: async () => {
        try {
          // Check if we have a valid session
          if (!SessionManager.hasSession()) {
            return false
          }

          // Verify and restore session
          const result = await SessionManager.verifySession()
          
          if (result.success && result.secret && result.publicKey) {
            // Get wallet data from localStorage
            const currentWallet = get().wallet
            
            if (currentWallet) {
              // Restore wallet with secret from session
              set({
                wallet: {
                  ...currentWallet,
                  secret: result.secret
                },
                isAuthenticated: true,
                isLocked: false
              })
              return true
            }
          }
          
          // Session invalid or doesn't match current wallet
          SessionManager.clearSession()
          return false
        } catch (error) {
          console.error('Failed to initialize from session:', error)
          SessionManager.clearSession()
          return false
        }
      },

      refreshSession: async () => {
        try {
          const result = await SessionManager.refreshSession()
          return result.success
        } catch (error) {
          console.error('Failed to refresh session:', error)
          return false
        }
      },

      saveSecureWalletData: async (secret: string, password: string, publicKey: string, mnemonic?: string) => {
        try {
          // Create Web3 keystore for secret key
          const keystore = await Web3Keystore.createKeystore(secret, password, publicKey)
          Web3Keystore.storeKeystore(keystore)

          // Note: Mnemonic is not stored in keystore for security
          // Only secret key is stored in Web3 keystore format
        } catch (error) {
          console.error('Failed to save secure wallet data:', error)
          throw new Error('Failed to save wallet data securely')
        }
      },

    }),
    {
      name: 'unity-wallet-auth',
      partialize: (state: AuthState) => {
        // Store only non-sensitive data in localStorage
        // Sensitive data (secret key, mnemonic) will be stored in Web3 keystore
        const wallet = state.wallet ? {
          public_key: state.wallet.public_key,
          account_exists: state.wallet.account_exists,
          funded_or_existing: state.wallet.funded_or_existing,
          balances: state.wallet.balances,
          created_at: state.wallet.created_at,
          // DO NOT store secret or mnemonic in localStorage
        } : null
        
        return {
          wallet,
          isAuthenticated: state.isAuthenticated,
          isLocked: state.isLocked,
        }
      },
    }
  )
)
