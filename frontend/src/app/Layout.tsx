import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const hideNavOnRoutes = ['/login']
  const shouldHideNav = hideNavOnRoutes.includes(location.pathname)

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 to-navy-100">
      {!shouldHideNav && <Navbar />}
      
      <main className={`${!shouldHideNav ? 'pt-16 pb-20' : ''} min-h-screen`}>
        <div className="container mx-auto px-4 py-6 max-w-md">
          {children}
        </div>
      </main>
      
      {!shouldHideNav && <BottomNav />}
    </div>
  )
}

export default Layout
