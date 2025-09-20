// Header.tsx — Enhanced Neon Glass header matching SoviPay style
// - Center segmented nav with sliding indicator (desktop only)
// - Glass/gradient background that intensifies on scroll
// - SPA navigation with useNavigate (requires <BrowserRouter>)
// - Mobile drawer with blurred radial gradient
// - Enhanced wallet button and notifications

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import {
  Wallet,
  Send,
  Repeat,
  Activity,
  Menu,
  X,
  BarChart3,
  Home,
  Settings,
  User,
  LogOut,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/session';
import { useThemeStore } from '@/store/theme';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';

interface HeaderProps { variant?: 'landing' | 'app' }

const Header: React.FC<HeaderProps> = ({ variant = 'landing' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { wallet, logout, isAuthenticated } = useAuthStore();
  const { isDark } = useThemeStore();


  const navRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const walletButtonRef = useRef<HTMLButtonElement>(null);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const links = useMemo(() => ([
    { path: '/', label: t('navigation.home', 'Home'), icon: Home },
    { path: '/pay', label: t('navigation.pay', 'Pay'), icon: Send },
    { path: '/swap', label: t('navigation.swap', 'Swap'), icon: Repeat },
    { path: '/activity', label: t('navigation.activity', 'Activity'), icon: Activity },
    { path: '/insights', label: t('navigation.insights', 'Insights'), icon: BarChart3 },
  ]), [t]);

  const activeIndex = useMemo(() => {
    // Nếu đang ở /wallet thì không có nav item nào active
    if (location.pathname === '/wallet') {
      return -1;
    }
    
    const idx = links.findIndex(l => {
      if (l.path === '/') {
        // Only match exact '/' for home, not '/wallet' or other paths
        return location.pathname === '/';
      }
      return location.pathname.startsWith(l.path);
    });
    return idx === -1 ? 0 : idx;
  }, [location.pathname, links]);

// Thay cả khối useEffect dài bằng khối rút gọn này
useEffect(() => {
  const nav = navRef.current;
  if (!nav) return;

  const update = () => {
    const p = Math.min(window.scrollY / 300, 1); // 0 → 1
    nav.style.setProperty('--scroll-progress', String(p));
  };

  window.addEventListener('scroll', update, { passive: true });
  update(); // sync lần đầu

  return () => window.removeEventListener('scroll', update);
}, [location.pathname]);

  // Enhanced sliding indicator with bounce effect
  const placeIndicator = () => {
    const list = listRef.current;
    const pill = pillRef.current;
    if (!list || !pill) return;
    const items = Array.from(list.querySelectorAll<HTMLButtonElement>('[data-nav-item]'));
    const target = items[activeIndex];
    if (!target) {
      // Ẩn indicator khi không có active item
      gsap.to(pill, { 
        opacity: 0,
        duration: 0.3, 
        ease: 'power2.out'
      });
      return;
    }
    const listBox = list.getBoundingClientRect();
    const box = target.getBoundingClientRect();
    const x = box.left - listBox.left;
    const w = box.width;
    gsap.to(pill, { 
      x, 
      width: w, 
      opacity: 1,
      duration: 0.4, 
      ease: 'back.out(1.7)'
    });
  };

  useEffect(() => { placeIndicator(); }, [activeIndex]);
  useEffect(() => { 
    const onResize = () => placeIndicator(); 
    window.addEventListener('resize', onResize); 
    return () => window.removeEventListener('resize', onResize); 
  }, []);

  // Enhanced mobile drawer animation
  useEffect(() => {
    const el = mobileRef.current; 
    if (!el) return;
    
    if (isMobileOpen) {
      gsap.set(el, { display: 'block' });
      gsap.to(el, { 
        y: 0, 
        opacity: 1, 
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => {
          el.style.pointerEvents = 'auto';
        }
      });
    } else {
      gsap.to(el, { 
        y: -20, 
        opacity: 0,
        duration: 0.25, 
        ease: 'power2.in',
        onComplete: () => {
          el.style.pointerEvents = 'none';
          gsap.set(el, { display: 'none' });
        }
      });
    }
  }, [isMobileOpen]);

  // Wallet button hover effect - only when not active
  useEffect(() => {
    const walletBtn = walletButtonRef.current;
    if (!walletBtn) return;

    const handleMouseEnter = () => {
      // Only apply hover effect if not on wallet page
      if (location.pathname !== '/wallet') {
        gsap.to(walletBtn, {
          scale: 1.05,
          duration: 0.2,
          ease: 'power2.out'
        });
      }
    };

    const handleMouseLeave = () => {
      // Only reset scale if not on wallet page
      if (location.pathname !== '/wallet') {
        gsap.to(walletBtn, {
          scale: 1,
          duration: 0.2,
          ease: 'power2.out'
        });
      }
    };

    walletBtn.addEventListener('mouseenter', handleMouseEnter);
    walletBtn.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      walletBtn.removeEventListener('mouseenter', handleMouseEnter);
      walletBtn.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [location.pathname]);

  const go = (path: string) => { 
    navigate(path); 
    setIsMobileOpen(false); 
    setShowUserMenu(false);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
  };

  return (
    <>
             <nav ref={navRef} className={`fixed inset-x-0 top-0 z-[100] border-b border-transparent ${isDark ? 'text-white' : 'text-slate-900'}`} style={{willChange:'backdrop-filter, background'}}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* Enhanced Logo and Mobile Language Switcher */}
            <div className="flex items-center gap-2">
              <button onClick={() => go('/')} className="flex items-center gap-3 group">
                {/* Premium Logo Design */}
                <div className="relative">
                  {/* Main Logo Container with Soft Circular Shape */}
                  <div className="relative grid h-12 w-12 place-items-center bg-gradient-to-br from-red-600 via-red-500 to-yellow-500 shadow-2xl rounded-3xl overflow-hidden transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-2">
                    {/* Soft Inner Glow Ring */}
                    <div className="absolute inset-1 bg-gradient-to-br from-red-400/30 via-yellow-400/30 to-red-600/30 rounded-3xl blur-sm"></div>
                    
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 via-yellow-400/20 to-red-600/20 animate-pulse rounded-3xl"></div>
                    
                    {/* Premium Logo */}
                    <div className="relative z-10 transform transition-all duration-300 group-hover:scale-110">
                <div className="relative">
                        <img 
                          src="/images/logo.png" 
                          alt="SoviPay Logo" 
                          className="h-6 w-6 drop-shadow-lg rounded-sm"
                        />
                        {/* Logo Glow */}
                        <div className="absolute inset-0 h-6 w-6 bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm"></div>
                      </div>
                    </div>
                    
                    {/* Enhanced Glow Effects */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-400/40 to-yellow-400/40 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 scale-150 rounded-3xl"></div>
                    
                    {/* Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                    
                    {/* Border Glow */}
                    <div className="absolute inset-0 ring-2 ring-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>
                  </div>
                  
                  {/* Floating Energy Particles */}
                  <div className="absolute -top-2 -right-2 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-0 group-hover:opacity-100 animate-bounce transition-all duration-500 shadow-lg"></div>
                  <div className="absolute -bottom-2 -left-2 w-2.5 h-2.5 bg-gradient-to-br from-red-400 to-pink-500 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-all duration-700 delay-200 shadow-lg"></div>
                  <div className="absolute top-1/2 -right-3 w-2 h-2 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-all duration-600 delay-300 shadow-lg"></div>
                  </div>

                {/* Premium Brand Name */}
                <div className="flex flex-col items-start">
                  <span className={`hidden sm:block font-black text-2xl tracking-tight transition-all duration-300 ${isDark ? 'text-white group-hover:text-red-200' : 'text-slate-900 group-hover:text-red-600'}`}>
                    Sovi
                    <span className="bg-gradient-to-r from-red-500 via-red-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-sm">Pay</span>
                  </span>
                </div>
              </button>

              {/* Mobile Language Switcher - Right next to logo */}
              <div className="lg:hidden">
                <LanguageSwitcher compact={true} />
              </div>
            </div>

            {/* Enhanced Center segmented nav - Desktop only */}
            <div className="hidden md:flex items-center">
                             <div ref={listRef} className={`relative flex items-center rounded-2xl border backdrop-blur-xl p-1 shadow-lg ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100/80'}`}>
                {/* Enhanced sliding indicator */}
                <div ref={pillRef} className={`absolute left-0 top-1/2 -translate-y-1/2 h-[34px] rounded-xl ring-1 ring-inset backdrop-blur-sm ${
                  isDark 
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 ring-white/20 shadow-[0_4px_18px_rgba(239,68,68,0.3)]' 
                    : 'bg-gradient-to-r from-slate-200 to-slate-300 ring-slate-300/50 shadow-[0_4px_18px_rgba(0,0,0,0.1)]'
                }`} style={{width:0}} />
                {links.map((l, i) => (
              <button 
                    key={l.path}
                    data-nav-item
                    onClick={() => go(l.path)}
                                         className={`relative z-10 flex items-center gap-2 rounded-xl min-w-[80px] px-4 py-2 text-sm transition-all duration-200 whitespace-nowrap font-medium ${
                       i===activeIndex 
                         ? `${isDark ? 'text-white' : 'text-red-600'}` 
                         : `${isDark ? 'text-white/80 hover:text-white hover:bg-white/5' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'}`
                     }`}
                  >
                                         <l.icon className={`h-4 w-4 transition-all duration-200 flex-shrink-0 ${
                       i===activeIndex ? `${isDark ? 'text-white' : 'text-red-600'} scale-110` : 'opacity-80'
                     }`} />
                     <span className={i===activeIndex ? `${isDark ? 'text-white' : 'text-red-600'} font-semibold` : ''}>{l.label}</span>
              </button>
                ))}
              </div>
            </div>

            {/* Enhanced Right utilities */}
            <div className="flex items-center gap-3">
              
              {/* Theme Switcher - Always visible */}
              <ThemeSwitcher />
              
              {/* Language Switcher - Desktop only */}
              <div className="hidden lg:block">
                <LanguageSwitcher />
              </div>
              
              {isAuthenticated ? (
                <>
                  {/* Enhanced Wallet Button */}
                  <button 
                    ref={walletButtonRef}
                    onClick={() => go('/wallet')} 
                                         className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all duration-200 group ${location.pathname === '/wallet' ? `${isDark ? 'bg-gradient-to-r from-red-600 to-orange-500 ring-white/20 shadow-[0_4px_18px_rgba(239,68,68,0.3)]' : 'bg-gradient-to-r from-slate-200 to-slate-300 ring-slate-300/50 shadow-[0_4px_18px_rgba(0,0,0,0.1)]'} ring-1 ring-inset backdrop-blur-sm` : isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20' : 'bg-slate-100/80 hover:bg-slate-200/80 border-slate-200 hover:border-slate-300'}`}
                  >
                                         <Wallet className={`h-4 w-4 transition-colors duration-200 wallet-icon ${
                       location.pathname === '/wallet' 
                         ? `${isDark ? 'text-white' : 'text-red-600'}` 
                         : 'text-white/70 group-hover:text-red-400'
                     }`} />
                     <span className={`hidden sm:block transition-colors duration-200 wallet-text ${
                       location.pathname === '/wallet' 
                         ? `${isDark ? 'text-white' : 'text-red-600'} font-semibold` 
                         : `${isDark ? 'text-white group-hover:text-red-200' : 'text-slate-700 group-hover:text-red-600'}`
                     }`}>{t('navigation.wallet','Wallet')}</span>
                  </button>

                  {/* Enhanced Notifications - Removed */}

                  {/* Enhanced User Menu */}
                  <div className="relative" ref={userMenuRef}>
                                         <button 
                       onClick={() => setShowUserMenu(!showUserMenu)}
                       className={`flex items-center p-1 rounded-xl border transition-all duration-200 group ${isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20' : 'bg-slate-100/80 hover:bg-slate-200/80 border-slate-200 hover:border-slate-300'}`}
                     >
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-red-500 to-yellow-500 text-white text-sm font-semibold shadow-lg">
                        {wallet?.public_key ? wallet.public_key.slice(0, 2).toUpperCase() : 'W'}
                      </div>
                    </button>

                    {/* User Dropdown Menu */}
                    {showUserMenu && (
                                             <div className={`absolute right-0 top-full mt-3 w-64 rounded-2xl border backdrop-blur-2xl shadow-2xl z-50 ${isDark ? 'border-white/20 bg-slate-900/95' : 'border-slate-200 bg-white/95'}`} style={{minWidth: '256px', maxWidth: '256px', width: '256px'}}>
                        {/* Wallet Info Header */}
                                                 <div className={`p-4 border-b bg-gradient-to-r from-red-500/10 to-yellow-500/10 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                          <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-yellow-500 text-white text-lg font-semibold shadow-lg flex items-center justify-center flex-shrink-0">
                                {wallet?.public_key ? wallet.public_key.slice(0, 2).toUpperCase() : 'W'}
                              </div>
                                                                                 <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>Wallet</p>
                          <p className={`text-xs truncate ${isDark ? 'text-white/60' : 'text-slate-600'}`}>{wallet?.public_key ? `${wallet.public_key.slice(0, 8)}...${wallet.public_key.slice(-8)}` : 'No wallet'}</p>
                        </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                                                     <button 
                             onClick={() => go('/settings')}
                             className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 group ${isDark ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
                           >
                                                         <div className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isDark ? 'bg-white/5 group-hover:bg-red-500/20' : 'bg-slate-100 group-hover:bg-red-100'}`}>
                              <Settings className="h-4 w-4" />
                            </div>
                            <span className="font-medium">{t('navigation.settings', 'Settings')}</span>
                          </button>
                          
                                                     <button 
                             onClick={() => go('/profile')}
                             className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 group ${isDark ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
                           >
                             <div className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isDark ? 'bg-white/5 group-hover:bg-blue-500/20' : 'bg-slate-100 group-hover:bg-blue-100'}`}>
                              <User className="h-4 w-4" />
                            </div>
                            <span className="font-medium">{t('navigation.profile', 'Profile')}</span>
                          </button>
                        </div>

                        {/* Divider */}
                                                 <div className="px-2">
                           <hr className={`${isDark ? 'border-white/10' : 'border-slate-200'}`} />
                         </div>

                        {/* Logout Button */}
                        <div className="p-2">
                                                     <button 
                             onClick={handleLogout}
                             className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 group ${isDark ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' : 'text-red-600 hover:bg-red-50 hover:text-red-700'}`}
                           >
                             <div className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isDark ? 'bg-red-500/10 group-hover:bg-red-500/20' : 'bg-red-100 group-hover:bg-red-200'}`}>
                              <LogOut className="h-4 w-4" />
                            </div>
                            <span className="font-medium">{t('navigation.logout', 'Logout')}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button
                    onClick={() => go('/login')}
                    className="group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 shadow-md hover:scale-105 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 hover:from-yellow-400 hover:via-orange-400 hover:to-red-700 text-white shadow-yellow-500/20 hover:shadow-yellow-500/30 relative overflow-hidden"
                  >
                    {/* Subtle shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -skew-x-12 -translate-x-full group-hover:translate-x-full" />
                    
                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-600/10 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    <span className="relative z-10 drop-shadow-sm">{t('navigation.getWallet', 'Get Wallet')}</span>
                    <ArrowRight className="h-4 w-4 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110 relative z-10 drop-shadow-sm" />
                  </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced styles for perf & aesthetics */}
             <style>{`
         nav { 
           --scroll-progress: 0; /* 0..1 */
           will-change: backdrop-filter, border-bottom-color, opacity, filter;
           backdrop-filter: blur(calc(var(--scroll-progress) * 20px));
           border-bottom: 1px solid ${isDark ? 'rgba(255,255,255, calc(var(--scroll-progress) * 0.18))' : 'rgba(15,23,42, calc(var(--scroll-progress) * 0.1))'};
           /* Dùng drop-shadow nhẹ cho hiệu suất tốt hơn box-shadow per-frame */
           filter: drop-shadow(0 12px 24px rgba(0,0,0, calc(var(--scroll-progress) * 0.15)));
         }
        nav > * {
          position: relative;
          z-index: 10; /* Ensure content is above pseudo elements */
        }
        nav::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(15,23,42,0.20) 0%,
            rgba(30,41,59,0.15) 40%,
            rgba(51,65,85,0.10) 100%
          );
          pointer-events: none;
          opacity: calc(var(--scroll-progress) * 1.0);
          z-index: 1;
        }

        nav::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(15,23,42,0.30);
          pointer-events: none;
          opacity: calc(var(--scroll-progress) * 0.6);
          z-index: 2;
        }

        /* Wallet button active state - matching navigation style */
        .wallet-button-active {
          background: linear-gradient(to right, rgba(239,68,68,0.25), rgba(251,191,36,0.25)) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          box-shadow: 0 4px 18px rgba(0,0,0,0.25) !important;
          backdrop-filter: blur(8px) !important;
        }
      `}</style>
    </>
  );
};

export default Header;
