import { Home, Send, ArrowLeftRight, BarChart3, Settings, Activity } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  path: string
  isCenter?: boolean
}

const navItems: NavItem[] = [
  { icon: Send, label: 'Pay', path: '/pay' },
  { icon: ArrowLeftRight, label: 'Swap', path: '/swap' },
  { icon: Home, label: 'Home', path: '/', isCenter: true },
  { icon: Activity, label: 'Activity', path: '/activity' },
  { icon: BarChart3, label: 'Insights', path: '/insights' },
]

function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-gradient-to-t from-slate-900/95 via-slate-800/90 to-transparent backdrop-blur-xl border-t border-white/10">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-red-950/20 via-orange-950/10 to-transparent" />
      
      <div className="relative">
        {/* Safe area padding for devices with bottom notch */}
        <div className="px-2 pt-1 pb-3" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center justify-center h-12 max-w-sm mx-auto">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              const isCenter = item.isCenter
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'flex flex-col items-center justify-center transition-all duration-300 relative',
                    isCenter 
                      ? 'mx-4 p-2' // Center item gets more space
                      : 'flex-1 p-1 max-w-[60px]', // Side items are constrained
                    'hover:scale-105 active:scale-95',
                    isActive
                      ? 'text-white'
                      : 'text-white/70 hover:text-white'
                  )}
                >
                  {/* Active background */}
                  {isActive && (
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br from-red-500/30 to-yellow-500/20 border border-white/20 backdrop-blur-sm",
                      isCenter ? "rounded-full" : "rounded-2xl"
                    )} />
                  )}
                  
                  <div className={cn(
                    'flex items-center justify-center transition-all duration-300 relative z-10',
                    isCenter 
                      ? 'w-12 h-12 rounded-full' // Larger center button
                      : 'w-7 h-7 rounded-xl', // Smaller side buttons
                    isActive 
                      ? 'bg-gradient-to-br from-red-500 to-yellow-500 shadow-lg shadow-red-500/25 scale-110' 
                      : 'bg-white/10 hover:bg-white/20'
                  )}>
                    <Icon className={cn(
                      isCenter ? "w-5 h-5" : "w-3.5 h-3.5"
                    )} />
                  </div>
                  
                  <span className={cn(
                    'font-medium transition-all duration-300 relative z-10 mt-1',
                    isCenter ? 'text-xs' : 'text-[9px]',
                    isActive ? 'text-white' : 'text-white/80'
                  )}>
                    {item.label}
                  </span>
                  
                  {/* Active indicator dot */}
                  {isActive && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gradient-to-r from-red-400 to-yellow-400 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default BottomNav
