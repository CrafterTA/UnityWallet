import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useThemeStore } from '@/store/theme'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'

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
    <div className={`relative min-h-screen w-full overflow-x-hidden antialiased ${isDark ? 'text-white' : 'text-slate-800'}`}>
      {/* Theme-aware background */}
      {isDark ? (
        <>
          {/* Dark mode background */}
          <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-slate-900 to-amber-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-red-900/20 via-transparent to-yellow-900/20"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-orange-950/15 to-transparent"></div>
        </>
      ) : (
        <>
          {/* Light mode background - red-orange theme */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-100 via-orange-100 to-yellow-100"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-red-200/40 via-transparent to-yellow-200/40"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-orange-200/30 to-transparent"></div>
        </>
      )}
      
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* subtle grid */}
        <div
          className={`absolute inset-0 [background-size:32px_32px] opacity-30 ${
            isDark 
              ? 'bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)]'
              : 'bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.03)_1px,transparent_0)]'
          }`}
          aria-hidden
        />
        {/* Theme-aware gradient blobs */}
        {isDark ? (
          <>
            {/* Dark mode blobs */}
            <div className="absolute -top-24 left-1/2 h-[50rem] w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-red-500/25 via-orange-400/20 to-yellow-500/15 blur-3xl" />
            <div className="absolute top-1/2 -right-32 h-[40rem] w-[40rem] rounded-full bg-gradient-to-br from-yellow-500/20 via-amber-400/15 to-red-500/10 blur-3xl" />
            <div className="absolute bottom-[-8rem] left-[-10rem] h-[35rem] w-[35rem] rounded-full bg-gradient-to-tr from-orange-500/20 via-red-400/15 to-yellow-400/10 blur-3xl" />
            <div className="absolute top-1/4 left-1/4 h-[25rem] w-[25rem] rounded-full bg-gradient-to-r from-red-400/10 to-amber-400/10 blur-2xl" />
            <div className="absolute bottom-1/4 right-1/4 h-[30rem] w-[30rem] rounded-full bg-gradient-to-l from-yellow-400/10 to-orange-400/10 blur-2xl" />
            <div className="absolute top-3/4 left-1/2 h-[20rem] w-[20rem] -translate-x-1/2 rounded-full bg-gradient-to-t from-amber-500/8 to-red-500/8 blur-2xl" />
          </>
        ) : (
          <>
            {/* Light mode blobs - red-orange theme */}
            <div className="absolute -top-24 left-1/2 h-[50rem] w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-red-300/35 via-orange-300/30 to-yellow-300/25 blur-3xl" />
            <div className="absolute top-1/2 -right-32 h-[40rem] w-[40rem] rounded-full bg-gradient-to-br from-yellow-300/30 via-amber-300/25 to-red-300/20 blur-3xl" />
            <div className="absolute bottom-[-8rem] left-[-10rem] h-[35rem] w-[35rem] rounded-full bg-gradient-to-tr from-orange-300/30 via-red-300/25 to-yellow-300/20 blur-3xl" />
            <div className="absolute top-1/4 left-1/4 h-[25rem] w-[25rem] rounded-full bg-gradient-to-r from-red-300/25 to-amber-300/25 blur-2xl" />
            <div className="absolute bottom-1/4 right-1/4 h-[30rem] w-[30rem] rounded-full bg-gradient-to-l from-yellow-300/25 to-orange-300/25 blur-2xl" />
            <div className="absolute top-3/4 left-1/2 h-[20rem] w-[20rem] -translate-x-1/2 rounded-full bg-gradient-to-t from-amber-300/20 to-red-300/20 blur-2xl" />
          </>
        )}
      </div>

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
