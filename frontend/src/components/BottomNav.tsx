import { Home, Send, ArrowLeftRight, BarChart3, Settings, Activity } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Send, label: 'Pay', path: '/pay' },
  { icon: ArrowLeftRight, label: 'Swap', path: '/swap' },
  { icon: Activity, label: 'Activity', path: '/activity' },
  { icon: BarChart3, label: 'Insights', path: '/insights' },
]

function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-gradient-to-t from-slate-900/95 via-slate-800/90 to-transparent backdrop-blur-xl border-t border-white/10">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-red-950/20 via-orange-950/10 to-transparent" />
      
      <div className="relative">
        {/* Safe area padding for devices with bottom notch */}
        <div className="px-4 pt-2 pb-6" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center justify-around h-14">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'flex flex-col items-center justify-center space-y-1 p-3 rounded-2xl transition-all duration-300 flex-1 relative',
                    'hover:scale-105 active:scale-95',
                    isActive
                      ? 'text-white'
                      : 'text-white/70 hover:text-white'
                  )}
                >
                  {/* Active background */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-yellow-500/20 rounded-2xl border border-white/20 backdrop-blur-sm" />
                  )}
                  
                  <div className={cn(
                    'w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-300 relative z-10',
                    isActive 
                      ? 'bg-gradient-to-br from-red-500 to-yellow-500 shadow-lg shadow-red-500/25 scale-110' 
                      : 'bg-white/10 hover:bg-white/20'
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <span className={cn(
                    'text-xs font-medium transition-all duration-300 relative z-10',
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
