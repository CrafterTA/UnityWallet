import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '@/components/Header'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const hideNavOnRoutes = ['/login']
  const shouldHideNav = hideNavOnRoutes.includes(location.pathname)
  
  // Use landing variant for home page
  const headerVariant = location.pathname === '/' ? 'landing' : 'app'

  return (
    <div className="relative min-h-screen text-white antialiased">
      {/* Beautiful red-yellow gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-slate-900 to-amber-950"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-red-900/20 via-transparent to-yellow-900/20"></div>
      <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-orange-950/15 to-transparent"></div>
      
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* subtle grid */}
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:32px_32px] opacity-30"
          aria-hidden
        />
        {/* Enhanced gradient blobs - Red/Yellow theme */}
        <div className="absolute -top-24 left-1/2 h-[50rem] w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-red-500/25 via-orange-400/20 to-yellow-500/15 blur-3xl" />
        <div className="absolute top-1/2 -right-32 h-[40rem] w-[40rem] rounded-full bg-gradient-to-br from-yellow-500/20 via-amber-400/15 to-red-500/10 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[-10rem] h-[35rem] w-[35rem] rounded-full bg-gradient-to-tr from-orange-500/20 via-red-400/15 to-yellow-400/10 blur-3xl" />
        
        {/* Additional warm accent lights */}
        <div className="absolute top-1/4 left-1/4 h-[25rem] w-[25rem] rounded-full bg-gradient-to-r from-red-400/10 to-amber-400/10 blur-2xl" />
        <div className="absolute bottom-1/4 right-1/4 h-[30rem] w-[30rem] rounded-full bg-gradient-to-l from-yellow-400/10 to-orange-400/10 blur-2xl" />
        <div className="absolute top-3/4 left-1/2 h-[20rem] w-[20rem] -translate-x-1/2 rounded-full bg-gradient-to-t from-amber-500/8 to-red-500/8 blur-2xl" />
      </div>

      {/* Navigation */}
      {!shouldHideNav && <Header variant={headerVariant} />}
      
      {/* Content */}
      <main className="relative mx-auto max-w-7xl px-4 py-8 pt-24">
        {children}
      </main>
    </div>
  )
}

export default Layout
