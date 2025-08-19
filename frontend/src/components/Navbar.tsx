import { Bell, User, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/session'
import { useNavigate } from 'react-router-dom'

function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-navy-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-md">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 wallet-gradient rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">UW</span>
          </div>
          <span className="font-semibold text-navy-900">UnityWallet</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button className="p-2 hover:bg-navy-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-navy-600" />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-navy-200 rounded-full flex items-center justify-center">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-navy-600" />
              )}
            </div>
            
            <div className="flex space-x-1">
              <button
                onClick={() => navigate('/settings')}
                className="p-1.5 hover:bg-navy-100 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4 text-navy-600" />
              </button>
              
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
