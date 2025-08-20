import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Wallet, Send, Repeat, Activity, ArrowRight, Menu, X, Bell, Copy, ArrowLeftRight, BarChart3, Home } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuthStore } from '@/store/session'
import LanguageSwitcher from './LanguageSwitcher'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

interface HeaderProps {
  variant?: 'landing' | 'app'
}

const Header: React.FC<HeaderProps> = ({ variant = 'app' }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const navRef = useRef<HTMLElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Handle navigation and close mobile menu
  const handleNavigation = (path: string) => {
    navigate(path)
    setIsMobileMenuOpen(false)
  }

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    // GSAP scroll animation for border and background
    const handleScroll = () => {
      const scrolled = window.scrollY > 20
      setIsScrolled(scrolled)
      
      if (scrolled) {
        // Show header background and effects when scrolled
        gsap.to(nav, {
          duration: 0.4,
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.15) 30%, rgba(251, 191, 36, 0.12) 70%, rgba(239, 68, 68, 0.08) 100%)',
          borderBottomColor: 'rgba(245, 158, 11, 0.2)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 8px 40px rgba(239, 68, 68, 0.15)',
          ease: 'power2.out'
        })
      } else {
        // Completely transparent when at top
        gsap.to(nav, {
          duration: 0.4,
          background: 'transparent',
          borderBottomColor: 'transparent',
          backdropFilter: 'none',
          boxShadow: 'none',
          ease: 'power2.out'
        })
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)

    // No entrance animation to avoid jumping effect

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [variant])

  // Mobile menu animation
  useEffect(() => {
    const mobileMenu = mobileMenuRef.current
    if (!mobileMenu) return

    if (isMobileMenuOpen) {
      gsap.to(mobileMenu, {
        duration: 0.3,
        opacity: 1,
        y: 0,
        visibility: 'visible',
        ease: 'power2.out'
      })
    } else {
      gsap.to(mobileMenu, {
        duration: 0.3,
        opacity: 0,
        y: -20,
        visibility: 'hidden',
        ease: 'power2.out'
      })
    }
  }, [isMobileMenuOpen])

  const navClass = "fixed top-0 left-0 right-0 z-50 transition-all duration-300" // Always fixed to avoid jumping

  const navStyle = {
    background: 'transparent', // Completely transparent at top
    borderBottom: '1px solid transparent', // No border at top
    backdropFilter: 'none', // No blur at top
    boxShadow: 'none' // No shadow at top
  }

  const heightClass = 'h-16 sm:h-16' // Consistent height
  const logoSize = 'h-7 w-7 sm:h-8 sm:w-8' // Slightly smaller on mobile
  const logoIconSize = 'h-3 w-3 sm:h-4 sm:w-4' // Smaller icon on mobile
  const logoTextSize = 'text-lg sm:text-xl' // Responsive text size
  const betaTextSize = 'text-[9px] sm:text-[10px]' // Smaller beta text on mobile
  const navGap = variant === 'landing' ? 'gap-8' : 'gap-8' // Same gap
  const navTextSize = 'text-sm' // Same nav text size

  return (
    <>
      <nav ref={navRef} className={navClass} style={navStyle}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={`flex ${heightClass} items-center justify-between`}>
            {/* Logo */}
            <button 
              onClick={() => handleNavigation('/')}
              className="flex items-center gap-2 group z-50"
            >
              <div className="relative">
                <div className={`grid ${logoSize} place-items-center rounded-xl bg-gradient-to-br from-red-500 to-yellow-500`}>
                  <Wallet className={`${logoIconSize} text-white`} />
                </div>
                <div className="absolute inset-0 bg-red-400 rounded-lg blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </div>
              <span className={`${logoTextSize} font-bold text-white group-hover:text-red-300 transition-colors duration-300 hidden sm:block`}>
                UnityWallet
              </span>
              <span className={`ml-2 rounded-full border border-white/10 px-2 py-0.5 ${betaTextSize} text-white/60 hidden sm:block`}>beta</span>
            </button>

            {/* Navigation Links - Desktop */}
            <div className={`hidden md:flex items-center ${navGap}`}>
              <button 
                onClick={() => handleNavigation('/')}
                className={`flex items-center gap-2 text-white/70 hover:text-white transition-all duration-300 hover:scale-105 group ${navTextSize}`}
              >
                <Home className="h-4 w-4 group-hover:text-blue-400 transition-colors" />
                <span>{t('navigation.home')}</span>
              </button>
              <button 
                onClick={() => handleNavigation('/pay')}
                className={`flex items-center gap-2 text-white/70 hover:text-white transition-all duration-300 hover:scale-105 group ${navTextSize}`}
              >
                <Send className="h-4 w-4 group-hover:text-red-400 transition-colors" />
                <span>{t('navigation.pay')}</span>
              </button>
              <button 
                onClick={() => handleNavigation('/swap')}
                className={`flex items-center gap-2 text-white/70 hover:text-white transition-all duration-300 hover:scale-105 group ${navTextSize}`}
              >
                <Repeat className="h-4 w-4 group-hover:text-yellow-400 transition-colors" />
                <span>{t('navigation.swap')}</span>
              </button>
              <button 
                onClick={() => handleNavigation('/activity')}
                className={`flex items-center gap-2 text-white/70 hover:text-white transition-all duration-300 hover:scale-105 group ${navTextSize}`}
              >
                <Activity className="h-4 w-4 group-hover:text-blue-400 transition-colors" />
                <span>{t('navigation.activity')}</span>
              </button>
            </div>

            {/* Right side - Wallet Info for authenticated users */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Wallet Button */}
              <button 
                onClick={() => handleNavigation('/wallet')}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition-all duration-200 group"
              >
                <Wallet className="h-4 w-4 text-white/70 group-hover:text-red-400 transition-colors" />
                <span className="text-white/90 font-medium">{t('navigation.wallet', 'Wallet')}</span>
              </button>

              {/* Notifications */}
              <button className="relative p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                <Bell className="h-4 w-4 text-white/70" />
                {/* Notification dot */}
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-slate-900"></div>
              </button>

              {/* User Avatar */}
              <button 
                onClick={() => handleNavigation('/settings')}
                className="flex items-center gap-2 p-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
              >
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="h-8 w-8 rounded-lg object-cover"
                    onError={(e) => {
                      // Hide broken image and show fallback
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center ${user?.avatar ? 'hidden' : ''}`}>
                  <span className="text-white font-semibold text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-white/90 text-sm font-medium hidden xl:block">
                  {user?.name || 'User'}
                </span>
              </button>
            </div>

            {/* Medium screens - Compact user info */}
            <div className="hidden md:flex lg:hidden items-center gap-2">
              {/* Notifications */}
              <button className="relative p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                <Bell className="h-4 w-4 text-white/70" />
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></div>
              </button>

              {/* User Avatar */}
              <button 
                onClick={() => handleNavigation('/settings')}
                className="p-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
              >
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="h-7 w-7 rounded-lg object-cover"
                    onError={(e) => {
                      // Hide broken image and show fallback
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`h-7 w-7 rounded-lg bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center ${user?.avatar ? 'hidden' : ''}`}>
                  <span className="text-white font-semibold text-xs">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={toggleMobileMenu}
              className="md:hidden text-white/70 hover:text-white transition-colors group z-50 p-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        ref={mobileMenuRef}
        className="fixed inset-0 z-40 md:hidden"
        style={{ 
          visibility: 'hidden',
          opacity: 0,
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(239, 68, 68, 0.1) 100%)',
          backdropFilter: 'blur(24px)'
        }}
      >
        <div className="flex flex-col h-full pt-20 px-6" style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}>
          {/* Mobile Navigation Links */}
          <div className="flex flex-col space-y-4">
            <button 
              onClick={() => handleNavigation('/')}
              className="flex items-center gap-4 text-left text-lg text-white/80 hover:text-white transition-all duration-300 group py-3 px-4 rounded-xl hover:bg-white/10"
            >
              <Home className="h-5 w-5 group-hover:text-blue-400 transition-colors" />
              <span>{t('navigation.home')}</span>
            </button>
            
            <button 
              onClick={() => handleNavigation('/pay')}
              className="flex items-center gap-4 text-left text-lg text-white/80 hover:text-white transition-all duration-300 group py-3 px-4 rounded-xl hover:bg-white/10"
            >
              <Send className="h-5 w-5 group-hover:text-red-400 transition-colors" />
              <span>{t('navigation.pay')}</span>
            </button>
            
            <button 
              onClick={() => handleNavigation('/swap')}
              className="flex items-center gap-4 text-left text-lg text-white/80 hover:text-white transition-all duration-300 group py-3 px-4 rounded-xl hover:bg-white/10"
            >
              <ArrowLeftRight className="h-5 w-5 group-hover:text-yellow-400 transition-colors" />
              <span>{t('navigation.swap')}</span>
            </button>
            
            <button 
              onClick={() => handleNavigation('/wallet')}
              className="flex items-center gap-4 text-left text-lg text-white/80 hover:text-white transition-all duration-300 group py-3 px-4 rounded-xl hover:bg-white/10"
            >
              <Wallet className="h-5 w-5 group-hover:text-yellow-400 transition-colors" />
              <span>{t('navigation.wallet', 'Wallet')}</span>
            </button>

            <button 
              onClick={() => handleNavigation('/activity')}
              className="flex items-center gap-4 text-left text-lg text-white/80 hover:text-white transition-all duration-300 group py-3 px-4 rounded-xl hover:bg-white/10"
            >
              <Activity className="h-5 w-5 group-hover:text-blue-400 transition-colors" />
              <span>{t('navigation.activity')}</span>
            </button>

            <button 
              onClick={() => handleNavigation('/insights')}
              className="flex items-center gap-4 text-left text-lg text-white/80 hover:text-white transition-all duration-300 group py-3 px-4 rounded-xl hover:bg-white/10"
            >
              <BarChart3 className="h-5 w-5 group-hover:text-green-400 transition-colors" />
              <span>{t('navigation.insights')}</span>
            </button>
          </div>

          {/* Mobile User Info */}
          <div className="flex flex-col gap-4 mt-8">
            {/* Language Switcher */}
            <div className="flex justify-center">
              <LanguageSwitcher />
            </div>

            {/* Wallet Button */}
            <button
              onClick={() => handleNavigation('/wallet')}
              className="flex items-center justify-between rounded-2xl border border-white/20 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl px-4 py-4 text-left hover:bg-white/20 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white/90 font-medium">{t('navigation.wallet', 'Wallet')}</p>
                  <p className="text-white/60 text-xs">Manage your assets</p>
                </div>
              </div>
              <div className="text-white/40">
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>

            {/* User Profile */}
            <button
              onClick={() => handleNavigation('/settings')}
              className="flex items-center gap-3 rounded-2xl border border-white/20 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl px-4 py-4 text-left hover:bg-white/20 transition-all"
            >
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="text-white/90 font-medium">{user?.name || 'User'}</p>
                <p className="text-white/60 text-sm">View Profile & Settings</p>
              </div>
            </button>

            {/* Quick actions */}
            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl px-4 py-3 text-white/80 hover:text-white transition-all hover:bg-white/20">
                <Bell className="h-4 w-4" />
                <span className="text-sm">Notifications</span>
              </button>
            </div>
          </div>

          {/* Mobile Bottom Info */}
          <div className="mt-auto pb-4 text-center">
            <div className="flex items-center justify-center gap-2 text-white/60 mb-3">
              <div className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-red-500 to-yellow-500">
                <Wallet className="h-3 w-3 text-white" />
              </div>
              <span className="text-lg font-bold">UnityWallet</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-xs">beta</span>
            </div>
            <p className="text-sm text-white/50">Secure, fast, and delightful digital wallet experience.</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default Header

