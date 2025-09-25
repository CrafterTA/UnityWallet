import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/session'
 
export const useSessionInit = () => {
  const [isInitializing, setIsInitializing] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const { initializeFromSession, isAuthenticated, wallet } = useAuthStore()
 
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsInitializing(true)
        setInitError(null)
 
        // Only try to initialize session if we have a wallet in localStorage
        // but are not currently authenticated (meaning page was reloaded)
        if (wallet && !isAuthenticated) {
          console.log('Attempting to restore session for wallet:', wallet.public_key)
          
          const sessionRestored = await initializeFromSession()
          
          if (sessionRestored) {
            console.log('Session restored successfully')
          } else {
            console.log('No valid session found, wallet will remain locked')
          }
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
