import { useState } from 'react'
import { User, Shield, Bell, RefreshCw, LogOut, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/session'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

function Settings() {
  const [notifications, setNotifications] = useState(true)
  const [language, setLanguage] = useState('en')
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const handleReplayDemo = () => {
    toast.success('Demo reset! You can now replay all features.')
    // In a real app, this would reset demo state
  }

  const settingSections = [
    {
      title: 'Account',
      icon: User,
      items: [
        {
          label: 'Profile Information',
          value: user?.name || 'Demo User',
          action: () => toast('Profile editing coming soon', { icon: 'ℹ️' }),
        },
        {
          label: 'KYC Status',
          value: user?.kycStatus === 'verified' ? 'Verified' : 'Pending',
          action: () => toast('KYC management coming soon', { icon: 'ℹ️' }),
        },
      ],
    },
    {
      title: 'Security',
      icon: Shield,
      items: [
        {
          label: 'Two-Factor Authentication',
          value: 'Enabled',
          action: () => toast('2FA settings coming soon', { icon: 'ℹ️' }),
        },
        {
          label: 'Backup Phrase',
          value: 'Secured',
          action: () => toast('Backup management coming soon', { icon: 'ℹ️' }),
        },
      ],
    },
    {
      title: 'Preferences',
      icon: Bell,
      items: [
        {
          label: 'Push Notifications',
          value: notifications ? 'Enabled' : 'Disabled',
          action: () => {
            setNotifications(!notifications)
            toast.success(`Notifications ${!notifications ? 'enabled' : 'disabled'}`)
          },
        },
        {
          label: 'Language',
          value: language === 'en' ? 'English' : 'Vietnamese',
          action: () => {
            const newLang = language === 'en' ? 'vi' : 'en'
            setLanguage(newLang)
            toast.success(`Language changed to ${newLang === 'en' ? 'English' : 'Vietnamese'}`)
          },
        },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-white/70">Manage your account and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-yellow-500 rounded-xl flex items-center justify-center">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-xl object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">{user?.name}</h3>
            <p className="text-white/70">{user?.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${
                user?.kycStatus === 'verified' ? 'bg-green-400' : 'bg-yellow-400'
              }`} />
              <span className="text-sm text-white/70">
                {user?.kycStatus === 'verified' ? 'Verified Account' : 'Pending Verification'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      {settingSections.map((section) => (
        <div key={section.title} className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/20 flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
              <section.icon className="w-4 h-4 text-red-400" />
            </div>
            <h3 className="font-semibold text-white">{section.title}</h3>
          </div>
          
          <div className="divide-y divide-white/20">
            {section.items.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full p-4 flex items-center justify-between hover:bg-white/10 transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-white">{item.label}</p>
                  <p className="text-sm text-white/70">{item.value}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/60" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Demo Actions */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/20 flex items-center space-x-3">
          <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-yellow-400" />
          </div>
          <h3 className="font-semibold text-white">Demo</h3>
        </div>
        
        <button
          onClick={handleReplayDemo}
          className="w-full p-4 flex items-center justify-between hover:bg-white/10 transition-colors text-left"
        >
          <div>
            <p className="font-medium text-white">Replay Demo</p>
            <p className="text-sm text-white/70">Reset demo state for another walkthrough</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/60" />
        </button>
      </div>

      {/* About */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center shadow-xl">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-3">
          <span className="text-white font-bold">UW</span>
        </div>
        <h3 className="font-semibold text-white mb-1">UnityWallet</h3>
        <p className="text-sm text-white/70 mb-3">Version 1.0.0</p>
        <p className="text-xs text-white/60">
          Powered by Stellar Blockchain • Built for Hackathon Demo
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
      >
        <LogOut className="w-5 h-5" />
        <span>Sign Out</span>
      </button>
    </div>
  )
}

export default Settings
