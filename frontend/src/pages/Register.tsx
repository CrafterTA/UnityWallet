import { useState } from 'react'
import { Eye, EyeOff, UserPlus, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth'

function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()

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
      await authApi.register({ name, email, password })
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-primary">
      <div className="w-full max-w-md mx-4">
  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 wallet-gradient rounded-2xl flex items-center justify-center mb-4">
              <span className="text-white font-bold text-2xl">UW</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{t('auth.register.title', 'Create Account')}</h2>
            <p className="text-navy-300">{t('auth.register.subtitle', 'Join UnityWallet in minutes')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                {t('auth.register.name', 'Full Name')}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-accent/80 focus:border-transparent"
                placeholder={t('auth.register.namePlaceholder', 'e.g. Jane Doe')}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                {t('auth.email', 'Email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-accent/80 focus:border-transparent"
                placeholder={t('auth.emailPlaceholder', 'Enter your email')}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                {t('auth.password', 'Password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-accent/80 focus:border-transparent"
                  placeholder={t('auth.passwordPlaceholder', 'Create a password')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-navy-300 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-white mb-2">
                {t('auth.confirmPassword', 'Confirm Password')}
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-accent/80 focus:border-transparent"
                  placeholder={t('auth.confirmPasswordPlaceholder', 'Re-enter your password')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3 text-navy-300 hover:text-white transition-colors"
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
            <p className="text-sm text-navy-300 text-center">
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
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white/80 hover:bg-white/10 transition-colors inline-flex items-center justify-center gap-2"
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
