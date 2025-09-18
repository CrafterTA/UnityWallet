import { useState } from 'react'
import { Eye, EyeOff, UserPlus, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth'
import { useThemeStore } from '@/store/theme'

function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isDark } = useThemeStore()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error(t('auth.register.nameRequired', 'Please enter your name')); return }
    if (password !== confirm) { toast.error(t('auth.register.passwordMismatch', 'Passwords do not match')); return }
    setIsLoading(true)
    try {
      await authApi.register({ username: email, full_name: name, password })
      toast.success(t('auth.register.success', 'Account created! Please sign in.'))
      navigate('/login')
    } catch (err) {
      console.error('Register error:', err)
      toast.error(t('auth.register.failed', 'Registration failed, please try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-navy-900 via-navy-800 to-primary' : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40'}`}>
      <div className="w-full max-w-md mx-4">
  <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-white/90 border-slate-200/50'} backdrop-blur-xl rounded-2xl p-8 border shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]`}>
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 wallet-gradient rounded-2xl flex items-center justify-center mb-4">
              <span className="text-white font-bold text-2xl">UW</span>
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('auth.register.title', 'Create Account')}</h2>
            <p className={`${isDark ? 'text-navy-300' : 'text-slate-600'}`}>{t('auth.register.subtitle', 'Join SoviPay in minutes')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-slate-700'}`}>
                {t('auth.register.name', 'Full Name')}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/80 focus:border-transparent ${isDark ? 'bg-white/10 border-white/20 text-white placeholder-navy-300' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`}
                placeholder={t('auth.register.namePlaceholder', 'e.g. Jane Doe')}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-slate-700'}`}>
                {t('auth.email', 'Email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/80 focus:border-transparent ${isDark ? 'bg-white/10 border-white/20 text-white placeholder-navy-300' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`}
                placeholder={t('auth.emailPlaceholder', 'Enter your email')}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-slate-700'}`}>
                {t('auth.password', 'Password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/80 focus:border-transparent ${isDark ? 'bg-white/10 border-white/20 text-white placeholder-navy-300' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`}
                  placeholder={t('auth.passwordPlaceholder', 'Create a password')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-3 transition-colors ${isDark ? 'text-navy-300 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-slate-700'}`}>
                {t('auth.confirmPassword', 'Confirm Password')}
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/80 focus:border-transparent ${isDark ? 'bg-white/10 border-white/20 text-white placeholder-navy-300' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`}
                  placeholder={t('auth.confirmPasswordPlaceholder', 'Re-enter your password')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className={`absolute right-3 top-3 transition-colors ${isDark ? 'text-navy-300 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent hover:bg-accent/90 text-navy-900 font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>{t('auth.register.cta', 'Create Account')}</span>
                </>
              )}
            </button>
          </form>

                     {/* Actions */}
           <div className="mt-6 space-y-3">
             <p className={`text-sm text-center ${isDark ? 'text-navy-300' : 'text-slate-600'}`}>
               {t('auth.register.haveAccountText', "Already have an account?")}
               <button
                 type="button"
                 onClick={() => navigate('/login')}
                 className="ml-1 text-accent hover:underline font-semibold"
               >
                 {t('auth.register.signIn', 'Sign in')}
               </button>
             </p>
             <button
               onClick={() => navigate('/')}
               className={`w-full rounded-lg border px-4 py-3 transition-colors inline-flex items-center justify-center gap-2 ${isDark ? 'border-white/20 bg-white/5 text-white/80 hover:bg-white/10' : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
             >
               <Home className="w-4 h-4" />
               <span>{t('common.backToHome', 'Back to Home')}</span>
             </button>
           </div>
        </div>
      </div>
    </div>
  )
}

export default Register
