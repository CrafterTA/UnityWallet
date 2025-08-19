import { Home, CreditCard, RefreshCw, BarChart3, MessageCircle } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: CreditCard, label: 'Pay', path: '/pay' },
  { icon: RefreshCw, label: 'Swap', path: '/swap' },
  { icon: BarChart3, label: 'Insights', path: '/insights' },
  { icon: MessageCircle, label: 'Assistant', path: '/assistant' },
]

function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-navy-200">
      <div className="container mx-auto px-4 max-w-md">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex flex-col items-center justify-center space-y-1 p-2 rounded-lg transition-all duration-200',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-navy-500 hover:text-navy-700 hover:bg-navy-50'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default BottomNav
