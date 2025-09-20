import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Shield, Bell, RefreshCw, LogOut, ChevronRight, Moon, Sun, Monitor, Clock, Lock } from 'lucide-react'
import { useAuthStore } from '@/store/session'
import { useThemeStore } from '@/store/theme'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

function Settings() {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState(true)
  const [language, setLanguage] = useState('en')
  const [autoLockTimeout, setAutoLockTimeout] = useState(15) // minutes
  const { wallet, logout, lockWallet } = useAuthStore()
  const { theme, setTheme, isDark } = useThemeStore()
  const navigate = useNavigate()

  // Load auto-lock timeout from localStorage
  useEffect(() => {
    const savedTimeout = localStorage.getItem('auto-lock-timeout')
    if (savedTimeout) {
      setAutoLockTimeout(parseInt(savedTimeout, 10))
    }
  }, [])

  // Save auto-lock timeout to localStorage
  const handleAutoLockTimeoutChange = (minutes: number) => {
    setAutoLockTimeout(minutes)
    localStorage.setItem('auto-lock-timeout', minutes.toString())
    toast.success(`Thời gian tự động khóa được đặt thành ${minutes} phút`)
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/')
  }

  const handleReplayDemo = () => {
    toast.success('Demo reset! You can now replay all features.')
    // In a real app, this would reset demo state
  }

  const handleLockNow = () => {
    lockWallet()
    toast.success('Ví đã được khóa để bảo mật')
  }

     const settingSections = [
     {
       title: t('settings.account', 'Account'),
       icon: User,
       items: [
         {
           label: t('settings.profileInfo', 'Profile Information'),
           value: wallet?.public_key ? `${wallet.public_key.slice(0, 8)}...${wallet.public_key.slice(-8)}` : 'Demo User',
           action: () => toast('Profile editing coming soon', { icon: 'ℹ️' }),
         },
         {
           label: t('settings.kycStatus', 'KYC Status'),
           value: wallet?.account_exists ? t('settings.verified', 'Verified') : t('settings.pending', 'Pending'),
           action: () => toast('KYC management coming soon', { icon: 'ℹ️' }),
         },
       ],
     },
     {
       title: t('settings.security', 'Security'),
       icon: Shield,
       items: [
         {
           label: t('settings.autoLock', 'Auto-Lock Timeout'),
           value: `${autoLockTimeout} minutes`,
           action: () => {
             const newTimeout = autoLockTimeout === 5 ? 15 : autoLockTimeout === 15 ? 30 : 5
             handleAutoLockTimeoutChange(newTimeout)
           },
         },
         {
           label: t('settings.lockNow', 'Lock Wallet Now'),
           value: t('settings.manualLock', 'Manual lock'),
           action: handleLockNow,
         },
         {
           label: t('settings.twoFactorAuth', 'Two-Factor Authentication'),
           value: t('settings.enabled', 'Enabled'),
           action: () => toast('2FA settings coming soon', { icon: 'ℹ️' }),
         },
         {
           label: t('settings.backupPhrase', 'Backup Phrase'),
           value: t('settings.secured', 'Secured'),
           action: () => toast('Backup management coming soon', { icon: 'ℹ️' }),
         },
       ],
     },
     {
       title: t('settings.preferences', 'Preferences'),
       icon: Bell,
       items: [
         {
           label: t('settings.pushNotifications', 'Push Notifications'),
           value: notifications ? t('settings.enabled', 'Enabled') : t('settings.disabled', 'Disabled'),
           action: () => {
             setNotifications(!notifications)
             toast.success(`Notifications ${!notifications ? 'enabled' : 'disabled'}`)
           },
         },
         {
           label: t('settings.language', 'Language'),
           value: language === 'en' ? 'English' : 'Vietnamese',
           action: () => {
             const newLang = language === 'en' ? 'vi' : 'en'
             setLanguage(newLang)
             toast.success(`Language changed to ${newLang === 'en' ? 'English' : 'Vietnamese'}`)
           },
         },
         {
           label: t('settings.appearance', 'Appearance'),
           value: theme === 'dark' ? t('settings.darkMode', 'Dark Mode') : t('settings.lightMode', 'Light Mode'),
           action: () => {
             const nextTheme = theme === 'dark' ? 'light' : 'dark'
             setTheme(nextTheme)
             
             const themeNames = {
               light: t('settings.lightMode', 'Light Mode'),
               dark: t('settings.darkMode', 'Dark Mode')
             }
             toast.success(`${t('settings.appearance', 'Appearance')}: ${themeNames[nextTheme]}`)
           },
         },
       ],
     },
   ]

  return (
         <div className={`space-y-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
       {/* Header */}
       <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
                 <h1 className="text-3xl font-bold text-white mb-2">{t('settings.title', 'Settings')}</h1>
         <p className="text-white/70">{t('settings.subtitle', 'Manage your account preferences')}</p>
      </div>

             {/* Profile Card */}
       <div className={`backdrop-blur-sm rounded-2xl p-6 border shadow-xl ${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-yellow-500 rounded-xl flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
                     <div>
             <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
               {wallet?.public_key ? `${wallet.public_key.slice(0, 8)}...${wallet.public_key.slice(-8)}` : 'Demo User'}
             </h3>
             <p className={`${isDark ? 'text-white/70' : 'text-slate-600'}`}>
               {wallet?.public_key ? 'Stellar Wallet' : 'Demo Account'}
             </p>
             <div className="flex items-center space-x-2 mt-1">
               <div className={`w-2 h-2 rounded-full ${
                 wallet?.account_exists ? 'bg-green-400' : 'bg-yellow-400'
               }`} />
               <span className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                 {wallet?.account_exists ? 'Verified Account' : 'Pending Verification'}
               </span>
             </div>
           </div>
        </div>
      </div>

      {/* Settings Sections */}
      {settingSections.map((section) => (
                 <div key={section.title} className={`backdrop-blur-sm rounded-2xl border overflow-hidden shadow-xl ${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'}`}>
          <div className={`p-4 border-b flex items-center space-x-3 ${isDark ? 'border-white/20' : 'border-slate-200'}`}>
            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
              <section.icon className="w-4 h-4 text-red-400" />
            </div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{section.title}</h3>
          </div>
          
          <div className={`divide-y ${isDark ? 'divide-white/20' : 'divide-slate-200'}`}>
            {section.items.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className={`w-full p-4 flex items-center justify-between transition-colors text-left ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100/80'}`}
              >
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.label}</p>
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>{item.value}</p>
                </div>
                <ChevronRight className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-slate-500'}`} />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Demo Actions */}
      <div className={`backdrop-blur-sm rounded-2xl border overflow-hidden shadow-xl ${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'}`}>
        <div className={`p-4 border-b flex items-center space-x-3 ${isDark ? 'border-white/20' : 'border-slate-200'}`}>
          <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-yellow-400" />
          </div>
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Demo</h3>
        </div>
        
        <button
          onClick={handleReplayDemo}
          className={`w-full p-4 flex items-center justify-between transition-colors text-left ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100/80'}`}
        >
          <div>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Replay Demo</p>
            <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Reset demo state for another walkthrough</p>
          </div>
          <ChevronRight className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-slate-500'}`} />
        </button>
      </div>

      {/* About */}
      <div className={`backdrop-blur-sm rounded-2xl p-6 border text-center shadow-xl ${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'}`}>
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-3">
          <span className="text-white font-bold">UW</span>
        </div>
        <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>SoviPay</h3>
        <p className={`text-sm mb-3 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Version 1.0.0</p>
        <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
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
