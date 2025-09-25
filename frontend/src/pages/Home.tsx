import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from '@tanstack/react-query'
import { useThemeStore } from "@/store/theme";
import { useAuthStore } from "@/store/session";
import { walletApi } from '@/api/wallet'
import { analyticsApi } from '@/api/analytics'
import { formatAssetAmount, formatAssetAmountWithPrecision, formatUSDValue, getUSDValue, fetchLiveRates, ExchangeRate, DEFAULT_RATES } from '@/lib/currency'
import { chainApi } from '@/api/chain'
import LightModeBackground from "@/components/LightModeBackground";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { Buffer } from 'buffer';

// Polyfills
if (!(window as any).Buffer) (window as any).Buffer = Buffer;
if (!(window as any).global) (window as any).global = window;
if (!(window as any).process) (window as any).process = { env: {} } as any;

import {
  Wallet,
  LineChart,
  Shield,
  Sparkles,
  Rocket,
  Lock,
  TrendingUp,
  LayoutDashboard,
  Coins,
  Users,
  Send,
  Repeat,
  Activity,
  ArrowRight,
  Zap,
  Globe,
  Smartphone,
} from "lucide-react";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

const StatCard = ({ icon: Icon, label, value, sub }: any) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { isDark } = useThemeStore();

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    gsap.fromTo(
      card,
      { 
        opacity: 0, 
        x: -50,
        rotationY: -20
      },
      {
        opacity: 1,
        x: 0,
        rotationY: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: card,
          start: "top bottom-=50",
          end: "bottom top+=50",
          toggleActions: "play none none reverse"
        }
      }
    );


  }, []);

  return (
         <div
       ref={cardRef}
       className={`group relative overflow-hidden rounded-2xl border p-5 sm:p-6 backdrop-blur-xl transition-all ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/7.5 hover:border-white/20' : 'border-slate-200 bg-slate-100/80 hover:bg-slate-200/80 hover:border-slate-300'}`}
   >
     <div className="flex items-start gap-3">
       <div className="flex-shrink-0">
         <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-400/20 text-primary-600 group-hover:from-primary-500/30 group-hover:to-accent-400/30 transition-all duration-300">
           <Icon className="h-5 w-5 flex-shrink-0" />
         </div>
       </div>
       
       <div className="flex-1 min-w-0">
         <p className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-slate-600'}`}>{label}</p>
       </div>
     </div>
     
     <div className="mt-2">
       <p className={`text-base sm:text-lg font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
       {sub && <p className={`mt-1.5 text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>{sub}</p>}
     </div>
    
    {/* Enhanced glow effect */}
    <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 -translate-y-8 translate-x-6 rounded-full bg-gradient-to-tr from-primary-300/10 via-accent-300/15 to-transparent blur-xl transition-opacity group-hover:opacity-100 opacity-0"></div>
    
    {/* Subtle shine effect */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
    </div>
  );
};

const Feature = ({ icon: Icon, title, desc }: any) => {
  const featureRef = useRef<HTMLDivElement>(null);
  const { isDark } = useThemeStore();

  useEffect(() => {
    const feature = featureRef.current;
    if (!feature) return;

    gsap.fromTo(
      feature,
      { 
        opacity: 0, 
        x: -50,
        rotationY: -20
      },
      {
        opacity: 1,
        x: 0,
        rotationY: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: feature,
          start: "top bottom-=50",
          end: "bottom top+=50",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Enhanced hover animation
    const handleMouseEnter = () => {
      gsap.to(feature, {
        y: -10,
        scale: 1.03,
        duration: 0.4,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(feature, {
        y: 0,
        scale: 1,
        duration: 0.4,
        ease: "power2.out"
      });
    };

    feature.addEventListener("mouseenter", handleMouseEnter);
    feature.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      feature.removeEventListener("mouseenter", handleMouseEnter);
      feature.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
         <div
       ref={featureRef}
       className={`group relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl transition-all ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/7.5 hover:border-white/20' : 'border-slate-200 bg-slate-100/80 hover:bg-slate-200/80 hover:border-slate-300'}`}
   >
     <div className="mb-3 flex items-center gap-3">
       <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-400/20 text-primary-600 group-hover:from-primary-500/30 group-hover:to-accent-400/30 group-hover:scale-110 transition-all duration-300">
         <Icon className="h-5 w-5" />
       </div>
       <h3 className={`text-lg font-semibold transition-colors duration-300 ${isDark ? 'text-white group-hover:text-primary-600' : 'text-slate-900 group-hover:text-primary-600'}`}>{title}</h3>
     </div>
     <p className={`text-sm leading-6 transition-colors duration-300 ${isDark ? 'text-white/70 group-hover:text-white/80' : 'text-slate-600 group-hover:text-slate-700'}`}>{desc}</p>
    
    {/* Enhanced glow effect */}
    <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 -translate-y-8 translate-x-6 rounded-full bg-gradient-to-tr from-primary-300/10 via-accent-300/15 to-transparent blur-xl transition-opacity group-hover:opacity-100 opacity-0"></div>
    
    {/* Subtle shine effect */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
    </div>
);
};

// Token icon URLs mapping - using local images from public folder
const TOKEN_ICON_URLS: Record<string, string> = {
  SOL: "/images/coin.png", // Solana SOL logo
  USDC: "/images/usd-coin-usdc-logo.png", // Local USDC logo
  USDT: "/images/usdt.png", // Tether USDT logo
};

const DEFAULT_ICON_URL = "/images/logo.png"; // Using SoviPay logo as fallback

type TokenIconProps = {
  symbol: string;
  size?: number;
  className?: string;
  srcOverride?: string;
};

const TokenIcon: React.FC<TokenIconProps> = ({ symbol, size = 32, className = "", srcOverride }) => {
  const initial = srcOverride || TOKEN_ICON_URLS[symbol?.toUpperCase()] || DEFAULT_ICON_URL;
  const [src, setSrc] = React.useState(initial);

  return (
    <img
      src={src}
      alt={symbol || "token"}
      width={size}
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setSrc(DEFAULT_ICON_URL)}
      className={`h-8 w-8 rounded-lg object-contain ${className}`}
    />
);
};

const TokenRow = ({ name, symbol, balance, value }: any) => {
  const { isDark } = useThemeStore();
  

  return (
  <div className={`grid grid-cols-12 items-center gap-3 rounded-xl px-3 py-2 transition-colors duration-200 ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100/80'}`}>
    <div className="col-span-5 flex items-center gap-3">
      <TokenIcon symbol={symbol} />
      <div>
        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{name}</p>
        <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-600'}`}>{symbol}</p>
      </div>
    </div>
    <div className={`col-span-3 text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{balance}</div>
    <div className={`col-span-4 text-right text-sm ${isDark ? 'text-white/80' : 'text-slate-600'}`}>{formatUSDValue(value)}</div>
  </div>
  );
};



// Animated Background Component
const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Particle system
    const particles: any[] = [];
    const particleCount = 50;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;

      constructor() {
        this.x = Math.random() * (canvas?.width || 0);
        this.y = Math.random() * (canvas?.height || 0);
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 3 + 1;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.color = `hsl(${Math.random() * 60 + 15}, 70%, 60%)`; // Warm colors for dark mode
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > (canvas?.width || 0)) this.vx *= -1;
        if (this.y < 0 || this.y > (canvas?.height || 0)) this.vy *= -1;

        this.opacity += (Math.random() - 0.5) * 0.01;
        this.opacity = Math.max(0.1, Math.min(0.8, this.opacity));
      }

      draw() {
        ctx!.save();
        ctx!.globalAlpha = this.opacity;
        ctx!.fillStyle = this.color;
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
      );
      
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.1)');
      gradient.addColorStop(0.5, 'rgba(234, 179, 8, 0.05)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connections
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.save();
            ctx.globalAlpha = (100 - distance) / 100 * 0.3;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
            ctx.restore();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ 
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
      }}
    />
  );
};

export default function Web3ModernLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isDark } = useThemeStore();
  const { isAuthenticated } = useAuthStore();

  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Fetch real data from APIs - only when authenticated
  const { data: balances, isLoading: balancesLoading, error: balancesError } = useQuery({
    queryKey: ['wallet-balances'],
    queryFn: walletApi.getBalances,
    enabled: isAuthenticated,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const { data: spendingData, isLoading: spendingLoading, error: spendingError } = useQuery({
    queryKey: ['home-spending'],
    queryFn: analyticsApi.getSpendingAnalytics,
    enabled: isAuthenticated,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const { data: creditScore, isLoading: creditLoading, error: creditError } = useQuery({
    queryKey: ['home-credit'],
    queryFn: analyticsApi.getInsights,
    enabled: isAuthenticated,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  // Fetch live exchange rates like Wallet
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate>(DEFAULT_RATES);
  
  const { data: liveRates, isLoading: ratesLoading } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => fetchLiveRates(chainApi),
    enabled: isAuthenticated,
    retry: 1,
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: false,
  });

  // Update exchange rates when live rates are fetched
  useEffect(() => {
    if (liveRates) {
      setExchangeRates(liveRates);
    }
  }, [liveRates]);

  // Calculate total balance and assets - use real data if authenticated, demo data if not
  // Calculate total balance with USD conversion like Wallet
  const totalBalance = isAuthenticated 
    ? (balances?.reduce((sum, balance) => {
        return sum + getUSDValue(balance.symbol, balance.balance_ui, exchangeRates);
      }, 0) || 0)
    : 15500.00; // Demo balance for unauthenticated users (SOL + USDC + USDT)

  // Process balance data for display with USD conversion
  const assets = isAuthenticated 
    ? (balances?.map((balance, index) => {
        const usdValue = getUSDValue(balance.symbol, balance.balance_ui, exchangeRates);
        return {
          id: index + 1,
          name: balance.symbol === 'SOL' ? 'Solana' : 
                balance.symbol === 'USDC' ? 'USD Coin' :
                balance.symbol === 'USDT' ? 'Tether' : balance.symbol,
          symbol: balance.symbol,
          balance: formatAssetAmountWithPrecision(balance.balance_ui || '0', balance.symbol, 6),
          value: usdValue, // Real USD value with live conversion rates
        };
      }) || [])
    : [
        {
          id: 1,
          name: 'Solana',
          symbol: 'SOL',
          balance: '2.500',
          value: 500.00 // USD value
        },
        {
          id: 2,
          name: 'USD Coin',
          symbol: 'USDC',
          balance: '5,000.000',
          value: 5000.00 // USD value
        },
        {
          id: 3,
          name: 'Tether',
          symbol: 'USDT',
          balance: '10,000.000',
          value: 10000.00 // USD value
        }
      ];

  // Check for any errors - only when authenticated
  const hasError = isAuthenticated && (balancesError || spendingError || creditError);
  const isLoading = isAuthenticated && (balancesLoading || spendingLoading || creditLoading);

  useEffect(() => {
    // Hero section animations
    const tl = gsap.timeline();

    tl.fromTo(titleRef.current, 
      { opacity: 0, y: 100, scale: 0.8 },
      { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: "back.out(1.7)" }
    )
    .fromTo(subtitleRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
      "-=0.6"
    )
    .fromTo(ctaRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
      "-=0.4"
    )
    .fromTo(dashboardRef.current,
      { opacity: 0, x: 100, rotationY: 20 },
      { opacity: 1, x: 0, rotationY: 0, duration: 1, ease: "power2.out" },
      "-=0.8"
    );

    // Floating animation for dashboard
    gsap.to(dashboardRef.current, {
      y: -20,
      duration: 3,
      ease: "power1.inOut",
      yoyo: true,
      repeat: -1
    });

    // Parallax effect for hero section
    gsap.to(heroRef.current, {
      yPercent: -50,
      ease: "none",
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });

    // Text reveal animations
    gsap.utils.toArray('.text-reveal').forEach((element: any) => {
      gsap.fromTo(element,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top bottom-=100",
            end: "bottom top+=100",
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    // Stagger animation for stats
    gsap.fromTo('.stat-card',
      { opacity: 0, y: 50, scale: 0.8 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: '.stats-section',
          start: "top bottom-=100",
          end: "bottom top+=100",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Features stagger animation
    gsap.fromTo('.feature-card',
      { opacity: 0, x: -50 },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: '.features-section',
          start: "top bottom-=100",
          end: "bottom top+=100",
          toggleActions: "play none none reverse"
        }
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Rendering */}
      {isDark ? <AnimatedBackground /> : <LightModeBackground />}
      
      {/* HERO */}
      <section ref={heroRef} className="relative mx-auto max-w-7xl px-4 pb-8 sm:pb-12 pt-16 sm:pt-20 lg:pt-24 z-10">
        <div className="grid grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-2">
          <div className="text-center lg:text-left">
                         <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-reveal ${isDark ? 'border-white/10 bg-white/5 text-white/70' : 'border-slate-200 bg-slate-100/80 text-slate-600'}`}>
              <Sparkles className="h-3.5 w-3.5" />
              {t('home.hero.badge')}
            </div>
            <h1 ref={titleRef} className="mt-4 text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl xl:text-6xl">
              {t('home.hero.title').split('digital wallet').map((part, index) => (
                <React.Fragment key={index}>
                  {part}
                  {index === 0 && (
                    <span className="relative inline-block">
                      <span className="bg-gradient-to-r from-red-500 via-red-400 to-red-600 bg-clip-text text-transparent font-black tracking-wider drop-shadow-lg">
                        digital wallet
                      </span>
                      {/* Glow effect */}
                      <span className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-red-400/20 to-red-600/20 blur-xl -z-10 animate-pulse"></span>
                      {/* Text shadow for depth */}
                      <span className="absolute inset-0 bg-gradient-to-r from-red-500 via-red-400 to-red-600 bg-clip-text text-transparent font-black tracking-wider opacity-30 blur-sm -z-20"></span>
                    </span>
                  )}
                </React.Fragment>
              ))}
            </h1>
                         <p ref={subtitleRef} className={`mt-4 max-w-xl mx-auto lg:mx-0 text-sm sm:text-base leading-7 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
              {t('home.hero.subtitle')}
            </p>
            <div ref={ctaRef} className="mt-6 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <button
                onClick={() => isAuthenticated ? navigate('/pay') : navigate('/login')}
                className={`w-full sm:w-auto rounded-xl px-6 py-3 text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-105 ${
                  isDark 
                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/20 hover:shadow-red-500/40' 
                    : 'bg-yellow-500 text-slate-900 hover:bg-yellow-600 shadow-yellow-500/20 hover:shadow-yellow-500/40'
                }`}
              >
                {isAuthenticated ? t('home.hero.startTrading', 'Start Trading') : t('home.hero.getStarted', 'Get Started')}
              </button>
              <button
                onClick={() => isAuthenticated ? navigate('/activity') : navigate('/login')}
                className={`w-full sm:w-auto rounded-xl border px-6 py-3 text-sm font-medium transition-all duration-300 hover:scale-105 ${isDark ? 'border-white/10 bg-white/5 text-white/90 hover:bg-white/10' : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:border-slate-400'}`}
              >
                {isAuthenticated ? t('home.hero.viewActivity', 'View Activity') : t('home.hero.learnMore', 'Learn More')}
              </button>
            </div>
                         <div className={`mt-6 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-4 text-xs text-reveal ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
              <div className="flex items-center gap-1"><Shield className="h-3.5 w-3.5"/> Bank Grade Security</div>
              <div className="flex items-center gap-1"><Lock className="h-3.5 w-3.5"/> Multi-Sig Protection</div>
              <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5"/> 50k+ users</div>
            </div>
          </div>
                      <div ref={dashboardRef} className="relative mt-20 sm:mt-32 lg:mt-36">
            {/* dashboard preview card */}
                             <div className={`dashboard-card relative overflow-hidden rounded-2xl sm:rounded-3xl border p-3 sm:p-4 backdrop-blur-xl ring-1 ring-inset transition-all duration-500 group ${
                               isDark 
                                 ? 'border-white/10 bg-white/5 ring-white/5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)] hover:shadow-[0_35px_80px_-12px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.1)] hover:border-white/20 hover:scale-[1.02]' 
                                 : 'border-slate-200 bg-white/90 ring-slate-200/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] hover:shadow-[0_35px_80px_-12px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-slate-300 hover:scale-[1.02]'
                             }`}>
              
              {/* Error States - only show when authenticated and there are actual errors */}
              {isAuthenticated && hasError && (
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 mb-3 sm:mb-4 border backdrop-blur-sm transition-all duration-300 gap-2 ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                  <div className={`flex items-center gap-2 text-xs sm:text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    <LayoutDashboard className="h-3 w-3 sm:h-4 sm:w-4" />
                    {t('common.dataLoadError', 'Unable to load data')}
                  </div>
                </div>
              )}
              
              {/* Loading State - only show when authenticated and loading */}
              {isAuthenticated && isLoading && (
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 mb-3 sm:mb-4 border backdrop-blur-sm transition-all duration-300 gap-2 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100/80 border-slate-200'}`}>
                  <div className={`flex items-center gap-2 text-xs sm:text-sm ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {t('common.loading', 'Loading wallet data...')}
                  </div>
                </div>
              )}
              
              {/* Demo Data Banner for unauthenticated users */}
              {!isAuthenticated && (
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 mb-3 sm:mb-4 border backdrop-blur-sm transition-all duration-300 gap-2 ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
                  <div className={`flex items-center gap-2 text-xs sm:text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    <LayoutDashboard className="h-3 w-3 sm:h-4 sm:w-4" />
                    {t('common.demoMode', 'Demo Mode - Sign in to view your real wallet')}
                  </div>
                  <button 
                    onClick={() => navigate('/login')}
                    className={`text-xs px-3 py-1 rounded-lg transition-colors ${isDark ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                  >
                    {t('common.signIn', 'Sign In')}
                  </button>
                </div>
              )}
              
              {/* Normal Header */}
              {!isLoading && !hasError && (
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 mb-3 sm:mb-4 border backdrop-blur-sm transition-all duration-300 gap-2 ${isDark ? 'bg-white/5 border-white/10 group-hover:bg-white/10 group-hover:border-white/20' : 'bg-slate-100/80 border-slate-200 group-hover:bg-slate-200/80 group-hover:border-slate-300'}`}>
                  <div className={`flex items-center gap-2 text-xs sm:text-sm ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                    <LayoutDashboard className="h-3 w-3 sm:h-4 sm:w-4 text-red-400 group-hover:text-red-300 transition-colors duration-300"/>
                    {isAuthenticated 
                      ? (balances?.length ? 'Portfolio Overview' : 'Wallet Ready')
                      : 'Demo Portfolio'
                    }
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                    {isAuthenticated && creditScore && (
                      <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-emerald-300 animate-pulse group-hover:bg-emerald-400/25 transition-colors duration-300">
                        Score: {Math.round(creditScore?.credit_score?.score || 0)}
                      </span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 transition-colors duration-300 ${isDark ? 'bg-white/10 group-hover:bg-white/15' : 'bg-slate-200 group-hover:bg-slate-300'}`}>
                      {isAuthenticated ? 'Live' : 'Demo'}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="grid gap-3 sm:gap-4 p-3 sm:p-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <div className={`rounded-xl sm:rounded-2xl border p-3 sm:p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100/80'}`}>
                    <div className={`mb-3 flex items-center justify-between text-xs sm:text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                      <span>Total Balance</span>
                      {isAuthenticated && spendingData && (
                        <span className="flex items-center gap-1 text-emerald-300">
                          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4"/>
                          {t('common.thisMonth', 'This Month')}
                        </span>
                      )}
                      {!isAuthenticated && (
                        <span className="flex items-center gap-1 text-blue-400">
                          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4"/>
                          Demo Data
                        </span>
                      )}
                    </div>
                    <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      ${totalBalance.toLocaleString()}
                    </p>
                    {isAuthenticated && spendingData && (
                      <p className={`text-sm mt-1 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                        Spent: ${spendingData.total_spent}
                      </p>
                    )}
                    {!isAuthenticated && (
                      <p className={`text-sm mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        Sample portfolio with demo assets
                      </p>
                    )}
                    
                    {/* Animated sparkline */}
                    <svg viewBox="0 0 200 60" className="mt-3 sm:mt-4 h-12 sm:h-16 w-full">
                      <polyline 
                        fill="none" 
                        stroke="url(#gradient)" 
                        strokeWidth="2" 
                        points="0,40 20,30 40,35 60,28 80,32 100,22 120,26 140,18 160,22 180,14 200,20"
                        className="animate-pulse"
                        strokeDasharray="200"
                        strokeDashoffset="200"
                        style={{
                          animation: 'draw 2s ease-in-out forwards, pulse 3s ease-in-out infinite'
                        }}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="50%" stopColor="#eab308" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  
                  <div className={`mt-3 sm:mt-4 rounded-xl sm:rounded-2xl border p-2 sm:p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100/80'}`}>
                    <div className={`hidden sm:grid grid-cols-12 px-3 pb-2 pt-1 text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                      <div className="col-span-5">Asset</div>
                      <div className="col-span-3">Amount</div>
                      <div className="col-span-4 text-right">Value</div>
                    </div>
                    
                    {/* Mobile Asset List */}
                    <div className="space-y-2 sm:hidden">
                      {assets.length > 0 ? assets.map((asset) => (
                        <div key={asset.id} className={`flex items-center justify-between p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-slate-100/80'}`}>
                          <div className="flex items-center gap-2">
                            <TokenIcon symbol={asset.symbol} size={24} className="h-6 w-6" />
                            <div>
                              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{asset.name}</p>
                              <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-600'}`}>{asset.symbol}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{asset.balance}</p>
                            <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-600'}`}>{formatUSDValue(asset.value)}</p>
                          </div>
                        </div>
                      )) : (
                        <div className={`text-center py-4 text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                          {isAuthenticated && balancesError 
                            ? t('common.failedToLoad', 'Failed to load balances') 
                            : !isAuthenticated 
                              ? t('wallet.signInToSeeAssets', 'Sign in to see your assets')
                              : t('wallet.noAssets', 'No assets found')
                          }
                        </div>
                      )}
                    </div>
                    
                    {/* Desktop Asset List */}
                    <div className="hidden sm:block">
                      {assets.length > 0 ? assets.map((asset) => (
                        <TokenRow 
                          key={asset.id}
                          name={asset.name} 
                          symbol={asset.symbol} 
                          balance={asset.balance} 
                          value={asset.value}
                        />
                      )) : (
                        <div className={`text-center py-4 text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                          {isAuthenticated && balancesError 
                            ? t('common.failedToLoad', 'Failed to load balances') 
                            : !isAuthenticated 
                              ? t('wallet.signInToSeeAssets', 'Sign in to see your assets')
                              : t('wallet.noAssets', 'No assets found')
                          }
                        </div>
                      )}
                    </div>
                </div>
                </div>
                
                <div className="grid gap-3 sm:gap-4">
                  <StatCard 
                    icon={Coins} 
                    label={t('dashboard.balance', 'Total Balance')} 
                    value={formatUSDValue(totalBalance)} 
                    sub={isAuthenticated ? t('dashboard.realTimeData', 'Real-time data') : 'Demo data'} 
                  />
                  <StatCard 
                    icon={Shield} 
                    label={t('dashboard.security', 'Security')} 
                    value={isAuthenticated ? (creditScore?.credit_score ? `${Math.round(creditScore.credit_score.score || 0)} - ${creditScore.credit_score.grade}` : 'Good') : '85 - Excellent'} 
                    sub={isAuthenticated ? (creditScore?.credit_score ? 'Credit Score' : t('dashboard.checkingSecurity', 'Checking...')) : 'Demo security score'} 
                  />
                  <StatCard 
                    icon={LineChart} 
                    label={t('dashboard.spending', 'Monthly Spending')} 
                    value={isAuthenticated ? (spendingData ? formatUSDValue(spendingData.total_spent) : 'N/A') : '$2,847.00'} 
                    sub={isAuthenticated ? (spendingData ? t('dashboard.thisMonth', 'This month') : t('dashboard.loadingSpending', 'Loading...')) : 'Demo spending'} 
                  />
                </div>
              </div>
            </div>

            {/* Removed glow effect - no more yellowish border */}
          </div>
        </div>
      </section>

      {/* STATS BELT */}
      <section className="stats-section mx-auto max-w-7xl px-4 pb-4 z-10 relative">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="stat-card">
          <StatCard icon={Users} label={t('home.stats.activeUsers', 'Active Users')} value="50,384" sub={t('home.stats.growingMonthly', 'Growing monthly')} />
          </div>
          <div className="stat-card">
          <StatCard icon={Rocket} label={t('home.stats.networks', 'Networks')} value="8" sub={t('home.stats.multiChainSupport', 'Multi-chain support')} />
          </div>
          <div className="stat-card">
          <StatCard icon={Lock} label={t('home.stats.securityScore', 'Security Score')} value="A+" sub={t('home.stats.bankGradeProtection', 'Bank-grade protection')} />
          </div>
          <div className="stat-card">
          <StatCard icon={TrendingUp} label={t('home.stats.volume', 'Volume')} value="$12.4M" sub={t('home.stats.monthlyTransactions', 'Monthly transactions')} />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="products" className="features-section mx-auto max-w-7xl px-4 py-8 sm:py-10 z-10 relative">
        <div>
          <div className="mb-4 sm:mb-6 flex items-center gap-2 text-reveal">
            <div className="h-1.5 w-6 rounded-full bg-gradient-to-r from-red-400 to-yellow-400" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">{t('home.features.title', 'What you can do')}</h2>
          </div>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            <div className={`feature-card backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border transition-all duration-300 group hover:-translate-y-2 ${isDark ? 'bg-white/5 border-white/10 hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]' : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)]'}`}>
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-9 w-9 sm:h-11 sm:w-11 place-items-center rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500/60 to-yellow-400/60 text-white group-hover:scale-110 transition-transform duration-300">
                  <Coins className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className={`text-base sm:text-lg font-semibold transition-colors duration-300 ${isDark ? 'text-white group-hover:text-red-300' : 'text-slate-900 group-hover:text-red-600'}`}>{t('home.features.sendReceive.title', 'Send & Receive')}</h3>
              </div>
              <p className={`text-xs sm:text-sm leading-5 sm:leading-6 transition-colors duration-300 ${isDark ? 'text-white/70 group-hover:text-white/80' : 'text-slate-600 group-hover:text-slate-700'}`}>{t('home.features.sendReceive.description', 'Transfer digital assets instantly across multiple networks with low fees and real-time confirmations.')}</p>
              <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 sm:h-28 sm:w-28 -translate-y-6 sm:-translate-y-8 translate-x-4 sm:translate-x-6 rounded-full bg-gradient-to-tr from-white/10 to-transparent blur-xl transition-opacity group-hover:opacity-100 opacity-0"></div>
            </div>
            <div className={`feature-card backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border transition-all duration-300 group hover:-translate-y-2 ${isDark ? 'bg-white/5 border-white/10 hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]' : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)]'}`}>
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-9 w-9 sm:h-11 sm:w-11 place-items-center rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500/60 to-yellow-400/60 text-white group-hover:scale-110 transition-transform duration-300">
                  <LineChart className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className={`text-base sm:text-lg font-semibold transition-colors duration-300 ${isDark ? 'text-white group-hover:text-red-300' : 'text-slate-900 group-hover:text-red-600'}`}>{t('home.features.swapTrade.title', 'Swap & Trade')}</h3>
              </div>
              <p className={`text-xs sm:text-sm leading-5 sm:leading-6 transition-colors duration-300 ${isDark ? 'text-white/70 group-hover:text-white/80' : 'text-slate-600 group-hover:text-slate-700'}`}>{t('home.features.swapTrade.description', 'Exchange cryptocurrencies at the best rates with our integrated DEX aggregator and liquidity pools.')}</p>
              <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 sm:h-28 sm:w-28 -translate-y-6 sm:-translate-y-8 translate-x-4 sm:translate-x-6 rounded-full bg-gradient-to-tr from-white/10 to-transparent blur-xl transition-opacity group-hover:opacity-100 opacity-0"></div>
            </div>
            <div className={`feature-card backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border transition-all duration-300 group hover:-translate-y-2 ${isDark ? 'bg-white/5 border-white/10 hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]' : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)]'}`}>
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-9 w-9 sm:h-11 sm:w-11 place-items-center rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500/60 to-yellow-400/60 text-white group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className={`text-base sm:text-lg font-semibold transition-colors duration-300 ${isDark ? 'text-white group-hover:text-red-300' : 'text-slate-900 group-hover:text-red-600'}`}>{t('home.features.secureStorage.title', 'Secure Storage')}</h3>
              </div>
              <p className={`text-xs sm:text-sm leading-5 sm:leading-6 transition-colors duration-300 ${isDark ? 'text-white/70 group-hover:text-white/80' : 'text-slate-600 group-hover:text-slate-700'}`}>{t('home.features.secureStorage.description', 'Bank-grade security with multi-signature protection, biometric authentication, and encrypted key management.')}</p>
              <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 sm:h-28 sm:w-28 -translate-y-6 sm:-translate-y-8 translate-x-4 sm:translate-x-6 rounded-full bg-gradient-to-tr from-white/10 to-transparent blur-xl transition-opacity group-hover:opacity-100 opacity-0"></div>
            </div>
          </div>
          </div>
      </section>

      {/* ENHANCED CTA */}
      <section id="app" className="relative mx-auto max-w-7xl px-4 py-8 sm:py-12 z-10">
        <div className={`overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-6 backdrop-blur-xl text-reveal ${isDark ? 'border-white/10 bg-gradient-to-br from-white/10 to-white/5' : 'border-slate-200 bg-gradient-to-br from-slate-100/80 to-slate-50/80'}`}>
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div className="text-center md:text-left">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{t('home.cta.title', 'Ready to start your digital journey?')}</h3>
              <p className={`mt-2 text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                {t('home.cta.subtitle', 'Join thousands of users managing their digital assets with SoviPay. Secure, fast, and user-friendly.')}
              </p>
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
                <button 
                  onClick={() => navigate('/pay')}
                  className={`w-full sm:w-auto rounded-xl px-6 py-3 text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-105 ${
                    isDark 
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20 hover:shadow-red-500/40' 
                      : 'bg-yellow-500 text-slate-900 hover:bg-yellow-600 shadow-yellow-500/20 hover:shadow-yellow-500/40'
                  }`}
                >
                  {t('home.cta.getStarted', 'Get Started')}
                </button>
                <button 
                  onClick={() => navigate('/activity')}
                  className={`w-full sm:w-auto rounded-xl border px-6 py-3 text-sm font-medium transition-all duration-300 hover:scale-105 ${isDark ? 'border-white/10 bg-white/5 text-white/90 hover:bg-white/10' : 'border-slate-200 bg-slate-100/80 text-slate-700 hover:bg-slate-200/80'}`}
                >
                  {t('home.cta.learnMore', 'Learn More')}
                </button>
              </div>
            </div>
            <div className={`rounded-xl sm:rounded-2xl border p-3 sm:p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100/80'}`}>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {["Wallet", "DeFi", "Staking", "NFTs", "Swap", "Bridge", "Security", "Analytics", "Mobile"].map((t, index) => (
                  <div 
                    key={t} 
                    className={`rounded-lg sm:rounded-xl border px-2 sm:px-3 py-2 text-center text-xs transition-all duration-300 hover:scale-105 cursor-pointer ${isDark ? 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10' : 'border-slate-200 bg-slate-100/80 text-slate-700 hover:bg-slate-200/80'}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ENHANCED FEATURES SECTION */}
      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:py-20 z-10">
        <div className="text-center space-y-8 sm:space-y-12">
          <div className="text-reveal">
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('home.whyChoose.title', 'Why Choose')} <span className="bg-gradient-to-r from-red-400 to-yellow-400 bg-clip-text text-transparent">SoviPay?</span>
            </h2>
            <p className={`text-base sm:text-lg max-w-2xl mx-auto px-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
              {t('home.whyChoose.subtitle', 'Experience the next generation of digital finance with cutting-edge security and seamless user experience.')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Shield, title: t('home.whyChoose.bankGradeSecurity.title', 'Bank-Grade Security'), desc: t('home.whyChoose.bankGradeSecurity.description', 'Multi-signature protection and cold storage') },
              { icon: Zap, title: t('home.whyChoose.lightningFast.title', 'Lightning Fast'), desc: t('home.whyChoose.lightningFast.description', 'Instant transactions across multiple networks') },
              { icon: Lock, title: t('home.whyChoose.fullControl.title', 'Full Control'), desc: t('home.whyChoose.fullControl.description', 'Your keys, your crypto, your choice') },
              { icon: Users, title: t('home.whyChoose.support.title', '24/7 Support'), desc: t('home.whyChoose.support.description', 'Expert help whenever you need it') }
            ].map((feature, index) => (
                             <div
                 key={index}
                 className={`feature-card backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 group hover:-translate-y-2 ${isDark ? 'bg-white/5 border-white/10 hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]' : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)]'}`}
               >
                 <feature.icon className="w-12 h-12 text-red-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                 <h3 className={`font-semibold mb-2 transition-colors duration-300 ${isDark ? 'text-white group-hover:text-red-300' : 'text-slate-900 group-hover:text-red-600'}`}>{feature.title}</h3>
                 <p className={`text-sm transition-colors duration-300 ${isDark ? 'text-white/60 group-hover:text-white/80' : 'text-slate-600 group-hover:text-slate-700'}`}>{feature.desc}</p>
               </div>
            ))}
          </div>

          <div className="text-reveal pt-8">
            <button 
              onClick={() => navigate('/pay')}
              className={`font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg ${
                isDark 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-yellow-500 hover:bg-yellow-600 text-slate-900'
              }`}
            >
              Start Your Journey Today
            </button>
          </div>
        </div>
      </section>

      {/* ENHANCED FOOTER */}
      <footer className="mx-auto max-w-7xl px-4 pb-16 sm:pb-20 md:pb-12 pt-8 z-10 relative">
        <div className="grid gap-6 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 text-reveal">
                     <div className="col-span-1 sm:col-span-2 md:col-span-1 text-center sm:text-left">
             <div className={`mb-3 flex items-center justify-center sm:justify-start gap-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
               <img src="/images/logo.png" alt="SoviPay" className="h-4 w-4 rounded-sm" /> SoviPay
             </div>
             <p className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-500'}`}>{t('home.footer.description', 'Secure, fast, and delightful digital wallet experience.')}</p>
           </div>
                     <div className="text-center sm:text-left">
             <p className={`mb-2 text-sm font-semibold ${isDark ? 'text-white/80' : 'text-slate-700'}`}>{t('home.footer.features', 'Features')}</p>
             <ul className={`space-y-1 text-sm ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
               <li><button onClick={() => navigate('/pay')} className={`hover:transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-700'}`}>{t('home.footer.sendReceive', 'Send & Receive')}</button></li>
               <li><button onClick={() => navigate('/swap')} className={`hover:transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-700'}`}>{t('home.footer.swapAssets', 'Swap Assets')}</button></li>
               <li><button onClick={() => navigate('/activity')} className={`hover:transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-700'}`}>{t('home.footer.transactionHistory', 'Transaction History')}</button></li>
               <li><button onClick={() => navigate('/insights')} className={`hover:transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-700'}`}>{t('home.footer.analytics', 'Analytics')}</button></li>
             </ul>
           </div>
                     <div className="text-center sm:text-left">
             <p className={`mb-2 text-sm font-semibold ${isDark ? 'text-white/80' : 'text-slate-700'}`}>{t('home.footer.security', 'Security')}</p>
             <ul className={`space-y-1 text-sm ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
               <li><a href="#" className={`hover:transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-700'}`}>{t('home.footer.multiSig', 'Multi-Sig')}</a></li>
               <li><a href="#" className={`hover:transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-700'}`}>{t('home.footer.encryption', 'Encryption')}</a></li>
               <li><a href="#" className={`hover:transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-700'}`}>{t('home.footer.auditReports', 'Audit Reports')}</a></li>
             </ul>
           </div>
           <div className="text-center sm:text-left">
             <p className={`mb-2 text-sm font-semibold ${isDark ? 'text-white/80' : 'text-slate-700'}`}>{t('home.footer.support', 'Support')}</p>
             <ul className={`space-y-1 text-sm ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
               <li><a href="#" className={`hover:transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-700'}`}>{t('home.footer.helpCenter', 'Help Center')}</a></li>
               <li><a href="#" className={`hover:transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-700'}`}>{t('home.footer.contactUs', 'Contact Us')}</a></li>
               <li><a href="#" className={`hover:transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-700'}`}>{t('home.footer.community', 'Community')}</a></li>
             </ul>
           </div>
        </div>
                 <div className={`mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t pt-4 text-xs gap-2 text-center sm:text-left ${isDark ? 'border-white/10 text-white/50' : 'border-slate-200 text-slate-500'}`}>
           <span>© {new Date().getFullYear()} SoviPay Labs</span>
           <div className="flex items-center justify-center sm:justify-start gap-3">
             <a href="#" className={`hover:transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-700'}`}>{t('home.footer.privacy', 'Privacy')}</a>
             <a href="#" className={`hover:transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-700'}`}>{t('home.footer.terms', 'Terms')}</a>
           </div>
         </div>
      </footer>

      {/* Enhanced styles for animations and effects */}
      <style>{`
        @supports not (backdrop-filter: blur(12px)) {
          .backdrop-blur-xl { background-color: rgba(255,255,255,0.06); }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }

        .text-reveal {
          opacity: 0;
          transform: translateY(30px);
        }

        .feature-card {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.5s;
        }

        .feature-card:hover::before {
          left: 100%;
        }

        .stat-card {
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px) scale(1.02);
        }

        /* Gradient text animation */
        .gradient-text {
          background: linear-gradient(45deg, #ef4444, #eab308, #ef4444);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 3s ease-in-out infinite;
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* Floating animation for dashboard */
        .floating {
          animation: floating 3s ease-in-out infinite;
        }

        @keyframes floating {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        /* Glow effect */
        .glow {
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
        }

        .glow:hover {
          box-shadow: 0 0 30px rgba(239, 68, 68, 0.5);
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .dashboard-card {
            animation: none;
          }
          
          .feature-card:hover {
            transform: translateY(-4px);
          }
          
          .stat-card:hover {
            transform: translateY(-3px) scale(1.01);
          }
        }

        /* Touch device optimizations */
        @media (hover: none) {
          .feature-card:hover {
            transform: none;
          }
          
          .stat-card:hover {
            transform: none;
          }
        }

        /* Sparkline drawing animation */
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }

        /* Dashboard card floating animation */
        .dashboard-card {
          animation: dashboard-float 6s ease-in-out infinite;
          transform-style: preserve-3d;
        }

        @keyframes dashboard-float {
          0%, 100% { 
            transform: translateY(0px) rotateX(0deg) rotateY(0deg); 
          }
          25% { 
            transform: translateY(-8px) rotateX(1deg) rotateY(0.5deg); 
          }
          50% { 
            transform: translateY(-12px) rotateX(2deg) rotateY(0deg); 
          }
          75% { 
            transform: translateY(-8px) rotateX(1deg) rotateY(-0.5deg); 
          }
        }

        .dashboard-card:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
