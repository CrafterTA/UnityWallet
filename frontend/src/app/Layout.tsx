import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useThemeStore } from '@/store/theme'
import { useAuthStore } from '@/store/session'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import LightModeBackground from '@/components/LightModeBackground'
import UnifiedBackground from '@/components/UnifiedBackground'
import Assistant from '@/pages/Assistant'
import UnlockModal from '@/components/UnlockModal'
import { useAutoLock } from '@/hooks/useAutoLock'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { isDark } = useThemeStore()
  const { isAuthenticated, isLocked, lockWallet } = useAuthStore()
  const hideNavOnRoutes = ['/login']
  const shouldHideNav = hideNavOnRoutes.includes(location.pathname)
  
  // Use landing variant for home page
  const headerVariant = location.pathname === '/' ? 'landing' : 'app'

  // Auto-lock functionality
  useAutoLock({
    timeoutMinutes: 15, // Default, will be overridden by localStorage value
    onLock: () => {
      lockWallet()
    }
  })

  return (
    <div className={`relative min-h-screen w-full overflow-x-hidden antialiased ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {/* Conditional Background Rendering */}
      {isDark ? (
        <>
          {/* Dark mode background - Fixed position to prevent scrolling */}
          <div 
            className="fixed inset-0 -z-10" 
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            }}
          ></div>
          
          {/* Subtle background pattern - Fixed position */}
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            {/* Subtle grid pattern */}
            <div
              className="absolute inset-0 [background-size:32px_32px] opacity-20 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)]"
              aria-hidden
            />
            {/* Subtle accent blobs - Fixed position to prevent scrolling */}
            <div className="fixed -top-24 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/10 via-accent/8 to-transparent blur-3xl" />
            <div className="fixed bottom-[-8rem] right-[-8rem] h-[30rem] w-[30rem] rounded-full bg-gradient-to-tl from-accent/8 via-primary/6 to-transparent blur-3xl" />
          </div>
        </>
      ) : (
        <>
          <LightModeBackground />
          <UnifiedBackground />
        </>
      )}

      {/* Navigation */}
      {!shouldHideNav && <Header variant={headerVariant} />}
      
      {/* Content */}
      <main className="relative mx-auto w-full max-w-7xl px-4 py-8 pt-24 pb-20 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {!shouldHideNav && <BottomNav />}

      {/* AI Assistant Chatbox - Always visible */}
      <Assistant />

      {/* Unlock Modal - Show when wallet is locked */}
      {isAuthenticated && isLocked && (
        <UnlockModal 
          isOpen={isLocked} 
          onClose={() => {}} // Modal sẽ tự động đóng khi unlock thành công
        />
      )}
    </div>
  )
}

export default Layout
