import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Shield, Bell, RefreshCw, LogOut, ChevronRight, Moon, Sun, Monitor, Clock, Lock, Eye, EyeOff, Copy, Check } from 'lucide-react'
import { useAuthStore } from '@/store/session'
import { useThemeStore } from '@/store/theme'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

function Settings() {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState(true)
  const [language, setLanguage] = useState('en')
  const [autoLockTimeout, setAutoLockTimeout] = useState(15) // minutes
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [secretKeyCopied, setSecretKeyCopied] = useState(false)
  const [secretKeyMasked, setSecretKeyMasked] = useState(true)
  const [autoMaskTimeout, setAutoMaskTimeout] = useState<NodeJS.Timeout | null>(null)
  const { wallet, logout, lockWallet, unlockWallet } = useAuthStore()
  const { theme, setTheme, isDark } = useThemeStore()
  const navigate = useNavigate()

  // Load auto-lock timeout from localStorage
  useEffect(() => {
    const savedTimeout = localStorage.getItem('auto-lock-timeout')
    if (savedTimeout) {
      setAutoLockTimeout(parseInt(savedTimeout, 10))
    }
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoMaskTimeout) {
        clearTimeout(autoMaskTimeout)
      }
    }
  }, [autoMaskTimeout])

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

  const handleShowSecretKey = () => {
    setShowPasswordModal(true)
    setPassword('')
    setPasswordError('')
  }

  const handlePasswordSubmit = async () => {
    if (password.length < 6) {
      setPasswordError(t('settings.passwordTooShort', 'Password must be at least 6 characters'))
      return
    }
    
    try {
      // Use the same unlockWallet function to verify password
      const success = await unlockWallet(password)
      
      if (success) {
        setShowPasswordModal(false)
        setShowSecretKey(true)
        setPassword('')
        setPasswordError('')
        setSecretKeyMasked(true) // Start with masked state
      } else {
        setPasswordError(t('settings.incorrectPassword', 'Incorrect password. Please try again.'))
      }
    } catch (error) {
      setPasswordError(t('settings.passwordVerificationFailed', 'Password verification failed. Please try again.'))
    }
  }

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false)
    setPassword('')
    setPasswordError('')
  }

  const handleCloseSecretKeyModal = () => {
    setShowSecretKey(false)
    setSecretKeyMasked(true)
    if (autoMaskTimeout) {
      clearTimeout(autoMaskTimeout)
      setAutoMaskTimeout(null)
    }
  }

  const handleToggleSecretKeyVisibility = () => {
    if (secretKeyMasked) {
      // Show full secret key
      setSecretKeyMasked(false)
      
      // Set auto-mask after 5 seconds
      const timeout = setTimeout(() => {
        setSecretKeyMasked(true)
      }, 5000)
      setAutoMaskTimeout(timeout)
    } else {
      // Hide secret key immediately
      setSecretKeyMasked(true)
      if (autoMaskTimeout) {
        clearTimeout(autoMaskTimeout)
        setAutoMaskTimeout(null)
      }
    }
  }

  const handleCopySecretKey = async () => {
    if (wallet?.secret) {
      try {
        await navigator.clipboard.writeText(wallet.secret)
        setSecretKeyCopied(true)
        toast.success(t('settings.secretKeyCopied', 'Secret key copied to clipboard'))
        setTimeout(() => setSecretKeyCopied(false), 2000)
      } catch (error) {
        toast.error(t('settings.copyFailed', 'Failed to copy secret key'))
      }
    }
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
           value: t('settings.viewSecretKey', 'View Secret Key'),
           action: handleShowSecretKey,
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

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-8 max-w-md w-full ${isDark ? 'bg-gray-900 border border-white/10' : 'bg-white border border-slate-200'}`}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('settings.enterPassword', 'Enter Password')}
              </h3>
              <p className={`${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {t('settings.passwordRequired', 'Please enter your password to view the secret key.')}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                  {t('settings.password', 'Password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordError('')
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    isDark 
                      ? 'bg-white/5 border-white/20 text-white placeholder-white/50' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500'
                  }`}
                  placeholder={t('settings.enterPasswordPlaceholder', 'Enter your password')}
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                />
                {passwordError && (
                  <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleClosePasswordModal}
                className={`flex-1 font-semibold py-3 px-6 rounded-xl transition-colors ${
                  isDark 
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {t('settings.cancel', 'Cancel')}
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
              >
                {t('settings.verify', 'Verify')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secret Key Modal */}
      {showSecretKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-8 max-w-md w-full ${isDark ? 'bg-gray-900 border border-white/10' : 'bg-white border border-slate-200'}`}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-red-600" />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('settings.secretKey', 'Secret Key')}
              </h3>
              <p className={`${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {t('settings.secretKeyWarning', 'Keep your secret key safe and never share it with anyone.')}
              </p>
            </div>

            <div className={`rounded-lg p-4 mb-6 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                  {t('settings.yourSecretKey', 'Your Secret Key')}
                </label>
                <button
                  onClick={handleCopySecretKey}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                    secretKeyCopied
                      ? 'bg-green-100 text-green-700'
                      : isDark
                        ? 'bg-white/10 hover:bg-white/20 text-white/70'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {secretKeyCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{secretKeyCopied ? t('settings.copied', 'Copied') : t('settings.copy', 'Copy')}</span>
                </button>
              </div>
              <div className={`font-mono text-sm p-3 rounded border ${
                isDark 
                  ? 'bg-black/20 border-white/20 text-white' 
                  : 'bg-white border-slate-300 text-gray-900'
              }`}>
                <div className="break-all overflow-x-auto max-w-full">
                  {secretKeyMasked 
                    ? '***'
                    : wallet?.secret || 'S...'
                  }
                </div>
                {wallet?.secret && wallet.secret.length > 16 && (
                  <button
                    onClick={handleToggleSecretKeyVisibility}
                    className={`mt-2 text-xs px-2 py-1 rounded transition-colors ${
                      isDark 
                        ? 'bg-white/10 hover:bg-white/20 text-white/70' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    {secretKeyMasked ? t('settings.showFull', 'Show Full') : t('settings.hide', 'Hide')}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCloseSecretKeyModal}
                className="w-full bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
              >
                {t('settings.close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

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
