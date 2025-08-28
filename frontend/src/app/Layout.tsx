import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useThemeStore } from '@/store/theme'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import LightModeBackground from '@/components/LightModeBackground'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { isDark } = useThemeStore()
  const hideNavOnRoutes = ['/login', '/register']
  const shouldHideNav = hideNavOnRoutes.includes(location.pathname)
  
  // Use landing variant for home page
  const headerVariant = location.pathname === '/' ? 'landing' : 'app'

  return (
    <div className={`relative min-h-screen w-full overflow-x-hidden antialiased ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {/* Conditional Background Rendering */}
      {isDark ? (
        <>
          {/* Dark mode background - matching Login page */}
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-primary"></div>
          
          {/* Subtle background pattern */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            {/* Subtle grid pattern */}
            <div
              className="absolute inset-0 [background-size:32px_32px] opacity-20 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)]"
              aria-hidden
            />
            {/* Subtle accent blobs */}
            <div className="absolute -top-24 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/10 via-accent/8 to-transparent blur-3xl" />
            <div className="absolute bottom-[-8rem] right-[-8rem] h-[30rem] w-[30rem] rounded-full bg-gradient-to-tl from-accent/8 via-primary/6 to-transparent blur-3xl" />
          </div>
        </>
      ) : (
        <LightModeBackground />
      )}

      {/* Navigation */}
      {!shouldHideNav && <Header variant={headerVariant} />}
      
      {/* Content */}
      <main className="relative mx-auto w-full max-w-7xl px-4 py-8 pt-24 pb-20 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {!shouldHideNav && <BottomNav />}
    </div>
  )
}

export default Layout
