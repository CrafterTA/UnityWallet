import { useState } from 'react'
import { Eye, EyeOff, LogIn, UserPlus, Home } from 'lucide-react'
import { useAuthStore } from '@/store/session'
import { authApi } from '@/api/auth'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

function Login() {
  const [email, setEmail] = useState('demo@unitywallet.com')
  const [password, setPassword] = useState('demo123')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await authApi.login({ email, password })
      login(response.user, response.token)
      toast.success('Welcome to UnityWallet!')
      navigate('/')
    } catch (error) {
      toast.error('Login failed. Please try again.')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-primary">
      {/* Desktop Layout */}
      <div className="hidden lg:flex w-full max-w-6xl mx-8">
        {/* Left Side - Hero */}
        <div className="flex-1 flex flex-col justify-center px-12">
          <div className="max-w-lg">
            <div className="w-20 h-20 wallet-gradient rounded-3xl flex items-center justify-center mb-8">
              <span className="text-white font-bold text-3xl">UW</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-6">UnityWallet</h1>
            <p className="text-xl text-navy-300 mb-8">Transform loyalty into digital assets with the power of Stellar blockchain</p>
            <div className="space-y-4 text-navy-300">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Secure digital asset management</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Real-time transaction monitoring</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Advanced analytics and insights</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center px-12">
          <div className="w-full max-w-md">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-navy-300">Sign in to your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-accent/80 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-accent/80 focus:border-transparent"
                      placeholder="Enter your password"
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-accent hover:bg-accent/90 text-navy-900 font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <p className="text-sm text-navy-300 text-center">
                  Don't have an account?
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="ml-1 text-accent hover:underline font-semibold"
                  >
                    Create one
                  </button>
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white/80 hover:bg-white/10 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Back to Home</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden w-full max-w-md mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 wallet-gradient rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">UW</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">UnityWallet</h1>
          <p className="text-navy-300">Transform loyalty into digital assets</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email-mobile" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <input
                id="email-mobile"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password-mobile" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password-mobile"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Enter your password"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent hover:bg-accent/90 text-navy-900 font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Actions */}
          <div className="mt-6 space-y-3">
            <p className="text-sm text-navy-300 text-center">
              Don't have an account?
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="ml-1 text-accent hover:underline font-semibold"
              >
                Create one
              </button>
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white/80 hover:bg-white/10 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-navy-400 text-sm">
            Powered by Stellar Blockchain
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
