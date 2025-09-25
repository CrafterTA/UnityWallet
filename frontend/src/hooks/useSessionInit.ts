import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/session'
import { SessionManager } from '@/lib/sessionManager'
 
export const useSessionInit = () => {
  const [isInitializing, setIsInitializing] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const { initializeFromSession, isAuthenticated, isLocked, wallet, lockWallet } = useAuthStore()
 
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsInitializing(true)
        setInitError(null)
 
        // Only try to initialize session if we have a wallet in localStorage
        // but don't have secret key (meaning page was reloaded and wallet needs to be unlocked)
        if (wallet && isAuthenticated && !wallet.secret) {
          // Ensure wallet is locked if no secret key
          lockWallet()
          
          const sessionRestored = await initializeFromSession()
        }
      } catch (error) {
        console.error('Session initialization error:', error)
        setInitError(error instanceof Error ? error.message : 'Unknown error')
      } finally {
        setIsInitializing(false)
      }
    }
 
    initializeSession()
  }, []) // Only run once on mount
 
  return {
    isInitializing,
    initError
  }
}
