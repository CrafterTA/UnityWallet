// Header.tsx — Enhanced Neon Glass header matching UnityWallet style
// - Center segmented nav with sliding indicator (desktop only)
// - Glass/gradient background that intensifies on scroll
// - SPA navigation with useNavigate (requires <BrowserRouter>)
// - Mobile drawer with blurred radial gradient
// - Enhanced wallet button and notifications

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Wallet,
  Send,
  Repeat,
  Activity,
  Bell,
  Menu,
  X,
  BarChart3,
  Home,
  Settings,
  User,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/session';
import { useThemeStore } from '@/store/theme';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';

// Register plugin once (safe in CSR)
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface HeaderProps { variant?: 'landing' | 'app' }

const Header: React.FC<HeaderProps> = ({ variant = 'landing' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { isDark } = useThemeStore();

  const navRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const walletButtonRef = useRef<HTMLButtonElement>(null);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3); // Mock notification count
  const userMenuRef = useRef<HTMLDivElement>(null);

  const links = useMemo(() => ([
    { path: '/', label: t('navigation.home', 'Home'), icon: Home },
    { path: '/pay', label: t('navigation.pay', 'Pay'), icon: Send },
    { path: '/swap', label: t('navigation.swap', 'Swap'), icon: Repeat },
    { path: '/activity', label: t('navigation.activity', 'Activity'), icon: Activity },
    { path: '/insights', label: t('navigation.insights', 'Insights'), icon: BarChart3 },
  ]), [t]);

  const activeIndex = useMemo(() => {
    const idx = links.findIndex(l => {
      if (l.path === '/') {
        // Only match exact '/' for home, not '/wallet' or other paths
        return location.pathname === '/';
      }
      return location.pathname.startsWith(l.path);
    });
    return idx === -1 ? 0 : idx;
  }, [location.pathname, links]);

  // Enhanced scroll background intensity
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    // Kill existing ScrollTriggers to avoid conflicts
    ScrollTrigger.getAll().forEach(trigger => {
      if (trigger.vars.trigger === document.body) {
        trigger.kill();
      }
    });

    // Create new scroll trigger
    const scrollTrigger = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: '300px',
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        nav.style.setProperty('--scroll-progress', progress.toString());
        
        // Apply background changes directly
        const bgOpacity = progress * 0.25;
        const shadowOpacity = progress * 0.25;
        const blurAmount = progress * 20;
        const borderOpacity = progress * 0.18;
        
        nav.style.background = `linear-gradient(135deg, rgba(239,68,68,${bgOpacity}) 0%, rgba(245,158,11,${bgOpacity * 0.9}) 40%, rgba(251,191,36,${bgOpacity * 0.7}) 100%)`;
        nav.style.boxShadow = `0 12px 48px rgba(239,68,68,${shadowOpacity})`;
        nav.style.backdropFilter = `blur(${blurAmount}px)`;
        nav.style.borderBottomColor = `rgba(255,255,255,${borderOpacity})`;
      }
    });

    // Fallback scroll listener for immediate response
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const progress = Math.min(scrollY / 300, 1);
      
      if (nav) {
        nav.style.setProperty('--scroll-progress', progress.toString());
        
        const bgOpacity = progress * 0.25;
        const shadowOpacity = progress * 0.25;
        const blurAmount = progress * 20;
        const borderOpacity = progress * 0.18;
        
        nav.style.background = `linear-gradient(135deg, rgba(239,68,68,${bgOpacity}) 0%, rgba(245,158,11,${bgOpacity * 0.9}) 40%, rgba(251,191,36,${bgOpacity * 0.7}) 100%)`;
        nav.style.boxShadow = `0 12px 48px rgba(239,68,68,${shadowOpacity})`;
        nav.style.backdropFilter = `blur(${blurAmount}px)`;
        nav.style.borderBottomColor = `rgba(255,255,255,${borderOpacity})`;
      }
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial call
    handleScroll();

    return () => {
      scrollTrigger.kill();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]); // Re-run when route changes

  // Enhanced sliding indicator with bounce effect
  const placeIndicator = () => {
    const list = listRef.current;
    const pill = pillRef.current;
    if (!list || !pill) return;
    const items = Array.from(list.querySelectorAll<HTMLButtonElement>('[data-nav-item]'));
    const target = items[activeIndex];
    if (!target) return;
    const listBox = list.getBoundingClientRect();
    const box = target.getBoundingClientRect();
    const x = box.left - listBox.left;
    const w = box.width;
    gsap.to(pill, { 
      x, 
      width: w, 
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
    navigate('/login');
    setShowUserMenu(false);
  };

  return (
    <>
      <nav ref={navRef} className="fixed inset-x-0 top-0 z-[100] border-b border-transparent" style={{willChange:'backdrop-filter, background'}}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* Enhanced Logo and Mobile Language Switcher */}
            <div className="flex items-center gap-2">
              <button onClick={() => go('/')} className="flex items-center gap-2 group">
                <div className="relative">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-red-500 to-yellow-500 shadow-lg">
                    <Wallet className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-red-400/60 blur-lg opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-500/20 to-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <span className="hidden sm:block text-white font-bold text-lg group-hover:text-red-200 transition-colors">UnityWallet</span>
                <span className="hidden sm:inline-block ml-2 rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/70 bg-white/5 backdrop-blur-sm">beta</span>
              </button>

              {/* Mobile Language Switcher - Right next to logo */}
              <div className="lg:hidden">
                <LanguageSwitcher compact={true} />
              </div>
            </div>

            {/* Enhanced Center segmented nav - Desktop only */}
            <div className="hidden md:flex items-center">
              <div ref={listRef} className="relative flex items-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-1 shadow-lg">
                {/* Enhanced sliding indicator */}
                <div ref={pillRef} className="absolute left-0 top-1/2 -translate-y-1/2 h-[34px] rounded-xl bg-gradient-to-r from-red-500/25 to-yellow-400/25 ring-1 ring-inset ring-white/10 shadow-[0_4px_18px_rgba(0,0,0,.25)] backdrop-blur-sm" style={{width:0}} />
                {links.map((l, i) => (
              <button 
                    key={l.path}
                    data-nav-item
                    onClick={() => go(l.path)}
                    className={`relative z-10 flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-all duration-200 ${
                      i===activeIndex 
                        ? 'text-white font-medium' 
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <l.icon className={`h-4 w-4 transition-all duration-200 ${
                      i===activeIndex ? 'opacity-100 scale-110' : 'opacity-80'
                    }`} />
                    <span>{l.label}</span>
              </button>
                ))}
              </div>
            </div>

            {/* Enhanced Right utilities */}
            <div className="flex items-center gap-3">
              {/* Theme Switcher */}
              <ThemeSwitcher />
              
              {/* Language Switcher - Desktop only */}
              <div className="hidden lg:block">
                <LanguageSwitcher />
              </div>
              
              {/* Enhanced Wallet Button */}
                <button 
                ref={walletButtonRef}
                onClick={() => go('/wallet')} 
                className={`flex items-center gap-2 rounded-xl border bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition-all duration-200 group ${
                  isDark ? 'border-white/10 hover:border-white/20' : 'border-gray-200/20 hover:border-gray-300/30'
                } ${location.pathname === '/wallet' ? 'wallet-button-active' : ''}`}
              >
                <Wallet className={`h-4 w-4 transition-colors duration-200 wallet-icon ${
                  location.pathname === '/wallet' 
                    ? 'text-white' 
                    : 'text-white/70 group-hover:text-red-400'
                }`} />
                <span className={`hidden sm:block transition-colors duration-200 wallet-text ${
                  location.pathname === '/wallet' 
                    ? 'text-white' 
                    : 'text-white group-hover:text-red-200'
                }`}>{t('navigation.wallet','Wallet')}</span>
                </button>

              {/* Enhanced Notifications */}
              <button className={`relative p-2 rounded-xl border bg-white/5 hover:bg-white/10 transition-all duration-200 group ${
                isDark ? 'border-white/10 hover:border-white/20' : 'border-gray-200/20 hover:border-gray-300/30'
              }`}>
                <Bell className="h-4 w-4 text-white/70 group-hover:text-yellow-400 transition-colors duration-200" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-900 animate-pulse" />
                )}
              </button>

                              {/* Enhanced User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center p-1 rounded-xl border bg-white/5 hover:bg-white/10 transition-all duration-200 group ${
                      isDark ? 'border-white/10 hover:border-white/20' : 'border-gray-200/20 hover:border-gray-300/30'
                    }`}
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10" />
                    ) : (
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-red-500 to-yellow-500 text-white text-sm font-semibold shadow-lg">
                        {(user?.name?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                  </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-3 w-64 rounded-2xl border border-white/20 bg-slate-900/95 backdrop-blur-2xl shadow-2xl z-50" style={{minWidth: '256px', maxWidth: '256px', width: '256px'}}>
                    {/* User Info Header */}
                    <div className="p-4 border-b border-white/10 bg-gradient-to-r from-red-500/10 to-yellow-500/10">
                      <div className="flex items-center gap-3">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={user.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-white/20 flex-shrink-0" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-yellow-500 text-white text-lg font-semibold shadow-lg flex items-center justify-center flex-shrink-0">
                            {(user?.name?.[0] || 'U').toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{user?.name || 'User'}</p>
                          <p className="text-white/60 text-xs truncate">{user?.email || 'user@example.com'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <button 
                        onClick={() => go('/settings')}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200 group"
                      >
                        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-red-500/20 transition-colors flex-shrink-0">
                          <Settings className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{t('navigation.settings', 'Settings')}</span>
                      </button>
                      
                      <button 
                        onClick={() => go('/profile')}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200 group"
                      >
                        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-blue-500/20 transition-colors flex-shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{t('navigation.profile', 'Profile')}</span>
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="px-2">
                      <hr className="border-white/10" />
                    </div>

                    {/* Logout Button */}
                    <div className="p-2">
                      <button 
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 group"
                      >
                        <div className="p-1.5 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors flex-shrink-0">
                          <LogOut className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{t('navigation.logout', 'Logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced styles for perf & aesthetics */}
      <style>{`
        nav { 
          transition: none; /* Remove transition to avoid conflicts with scroll effects */
          will-change: background, backdrop-filter, box-shadow, border-bottom-color;
        }
        nav > * {
          position: relative;
          z-index: 10; /* Ensure content is above pseudo elements */
        }
        nav::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(239,68,68,0.05) 0%, rgba(245,158,11,0.03) 40%, rgba(251,191,36,0.02) 100%);
          pointer-events: none;
          opacity: calc(var(--scroll-progress, 0) * 1.2);
          z-index: 1;
        }
        nav::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(15,23,42,0.3);
          pointer-events: none;
          opacity: calc(var(--scroll-progress, 0) * 0.8);
          z-index: 2;
        }
      `}</style>
    </>
  );
};

export default Header;
