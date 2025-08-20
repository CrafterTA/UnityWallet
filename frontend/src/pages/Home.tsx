import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
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

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    gsap.fromTo(
      card,
      { 
        opacity: 0, 
        y: 50, 
        scale: 0.8,
        rotationY: -15
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotationY: 0,
        duration: 0.8,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: card,
          start: "top bottom-=100",
          end: "bottom top+=100",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Hover animation
    const handleMouseEnter = () => {
      gsap.to(card, {
        y: -10,
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        y: 0,
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    card.addEventListener("mouseenter", handleMouseEnter);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mouseenter", handleMouseEnter);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] ring-1 ring-inset ring-white/5 group"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-red-500/30 to-yellow-400/30 text-red-200">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-white/70">{label}</p>
          <p className="mt-0.5 text-xl font-semibold tracking-tight text-white">{value}</p>
        </div>
      </div>
      {sub && <p className="mt-3 text-xs text-white/60">{sub}</p>}
      
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-yellow-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
};

const Feature = ({ icon: Icon, title, desc }: any) => {
  const featureRef = useRef<HTMLDivElement>(null);

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

    // Hover animation
    const handleMouseEnter = () => {
      gsap.to(feature, {
        y: -8,
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(feature, {
        y: 0,
        scale: 1,
        duration: 0.3,
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
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all hover:bg-white/7.5"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-red-500/30 to-yellow-400/30 text-red-200">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <p className="text-sm leading-6 text-white/70">{desc}</p>
      <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 -translate-y-8 translate-x-6 rounded-full bg-gradient-to-tr from-white/10 to-transparent blur-xl transition-opacity group-hover:opacity-100 opacity-0"></div>
    </div>
  );
};

const TokenRow = ({ name, symbol, price, change, mcap }: any) => (
  <div className="grid grid-cols-12 items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/5 transition-colors duration-200">
    <div className="col-span-5 flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-white/10" />
      <div>
        <p className="text-sm font-medium text-white">{name}</p>
        <p className="text-xs text-white/60">{symbol}</p>
      </div>
    </div>
    <div className="col-span-2 text-sm text-white">${price}</div>
    <div className={`col-span-2 text-sm ${change.startsWith("-") ? "text-red-400" : "text-emerald-400"}`}>{change}</div>
    <div className="col-span-3 text-right text-sm text-white/80">${mcap}</div>
  </div>
);



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
        this.color = `hsl(${Math.random() * 60 + 15}, 70%, 60%)`;
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
      style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)' }}
    />
  );
};

export default function Web3ModernLayout() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

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
      <AnimatedBackground />
      
      {/* HERO */}
      <section ref={heroRef} className="relative mx-auto max-w-7xl px-4 pb-26 pt-20 sm:pt-24 z-10">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 text-reveal">
              <Sparkles className="h-3.5 w-3.5" />
              Powering the digital future
            </div>
            <h1 ref={titleRef} className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Your unified <span className="bg-gradient-to-r from-red-300 via-yellow-300 to-red-300 bg-clip-text text-transparent">digital wallet</span> experience
            </h1>
            <p ref={subtitleRef} className="mt-4 max-w-xl text-base leading-7 text-white/70">
              Send, receive, swap, and manage your digital assets across multiple networks with real‑time insights, secure transactions, and seamless user experience.
            </p>
            <div ref={ctaRef} className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate('/pay')}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-red-500 to-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all duration-300 hover:shadow-red-500/40 hover:scale-105"
              >
                <span className="relative z-10">Start Trading</span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
              <button
                onClick={() => navigate('/activity')}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10 transition-all duration-300 hover:scale-105"
              >
                View Activity
              </button>
            </div>
            <div className="mt-6 flex items-center gap-4 text-xs text-white/60 text-reveal">
              <div className="flex items-center gap-1"><Shield className="h-3.5 w-3.5"/> Bank Grade Security</div>
              <div className="flex items-center gap-1"><Lock className="h-3.5 w-3.5"/> Multi-Sig Protection</div>
              <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5"/> 50k+ users</div>
            </div>
          </div>
                      <div ref={dashboardRef} className="relative">
              {/* dashboard preview card */}
              <div className="dashboard-card relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] ring-1 ring-inset ring-white/5 mt-24 transition-all duration-300 hover:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] hover:border-white/20 group">
                                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 mb-4 border border-white/10 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/10 group-hover:border-white/20">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <LayoutDashboard className="h-4 w-4 text-red-400 group-hover:text-red-300 transition-colors duration-300"/> Portfolio Overview
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-emerald-300 animate-pulse group-hover:bg-emerald-400/25 transition-colors duration-300">Net +12.8%</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 group-hover:bg-white/15 transition-colors duration-300">30d</span>
                  </div>
                </div>
              <div className="grid gap-4 p-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex items-center justify-between text-sm text-white/70">
                      <span>Total Balance</span>
                      <span className="flex items-center gap-1 text-emerald-300"><TrendingUp className="h-4 w-4"/> +8.2%</span>
                    </div>
                    <p className="text-3xl font-bold tracking-tight text-white">$24,856.42</p>
                    {/* Animated sparkline */}
                    <svg viewBox="0 0 200 60" className="mt-4 h-16 w-full">
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
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="grid grid-cols-12 px-3 pb-2 pt-1 text-xs text-white/50">
                      <div className="col-span-5">Asset</div>
                      <div className="col-span-2">Price</div>
                      <div className="col-span-2">24h</div>
                      <div className="col-span-3 text-right">Holdings</div>
                    </div>
                    <TokenRow name="Bitcoin" symbol="BTC" price="64,230" change="+1.8%" mcap="0.25 BTC" />
                    <TokenRow name="Ethereum" symbol="ETH" price="3,210" change="+0.7%" mcap="2.5 ETH" />
                    <TokenRow name="USDC" symbol="USDC" price="1.00" change="+0.1%" mcap="5,420 USDC" />
                  </div>
                </div>
                <div className="grid gap-4">
                  <StatCard icon={Coins} label="Rewards" value="$342" sub="Earned this month" />
                  <StatCard icon={Shield} label="Security" value="Active" sub="Multi-sig protection" />
                  <StatCard icon={LineChart} label="Growth" value="12.8%" sub="Portfolio performance" />
                </div>
              </div>
            </div>

            {/* Enhanced glow effect */}
            <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[2rem] bg-gradient-to-tr from-red-500/20 via-yellow-500/20 to-red-500/20 blur-2xl animate-pulse" />
          </div>
        </div>
      </section>

      {/* STATS BELT */}
      <section className="stats-section mx-auto max-w-7xl px-4 pb-6 z-10 relative">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="stat-card">
            <StatCard icon={Users} label="Active Users" value="50,384" sub="Growing monthly" />
          </div>
          <div className="stat-card">
            <StatCard icon={Rocket} label="Networks" value="8" sub="Multi-chain support" />
          </div>
          <div className="stat-card">
            <StatCard icon={Lock} label="Security Score" value="A+" sub="Bank-grade protection" />
          </div>
          <div className="stat-card">
            <StatCard icon={TrendingUp} label="Volume" value="$12.4M" sub="Monthly transactions" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="products" className="features-section mx-auto max-w-7xl px-4 py-10 z-10 relative">
        <div>
          <div className="mb-6 flex items-center gap-2 text-reveal">
            <div className="h-1.5 w-6 rounded-full bg-gradient-to-r from-red-400 to-yellow-400" />
            <h2 className="text-xl font-bold tracking-tight">What you can do</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="feature-card">
              <Feature
                icon={Coins}
                title="Send & Receive"
                desc="Transfer digital assets instantly across multiple networks with low fees and real-time confirmations."
              />
            </div>
            <div className="feature-card">
              <Feature
                icon={LineChart}
                title="Swap & Trade"
                desc="Exchange cryptocurrencies at the best rates with our integrated DEX aggregator and liquidity pools."
              />
            </div>
            <div className="feature-card">
              <Feature
                icon={Shield}
                title="Secure Storage"
                desc="Bank-grade security with multi-signature protection, biometric authentication, and encrypted key management."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ENHANCED CTA */}
      <section id="app" className="relative mx-auto max-w-7xl px-4 py-12 z-10">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-xl text-reveal">
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Ready to start your digital journey?</h3>
              <p className="mt-2 text-sm text-white/70">
                Join thousands of users managing their digital assets with UnityWallet. Secure, fast, and user-friendly.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button 
                  onClick={() => navigate('/pay')}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-red-500 to-yellow-500 px-4 py-2 text-sm font-semibold shadow-lg shadow-red-500/20 transition-all duration-300 hover:shadow-red-500/40 hover:scale-105"
                >
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
                <button 
                  onClick={() => navigate('/activity')}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10 transition-all duration-300 hover:scale-105"
                >
                  Learn More
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="grid grid-cols-3 gap-3">
                {["Wallet", "DeFi", "Staking", "NFTs", "Swap", "Bridge", "Security", "Analytics", "Mobile"].map((t, index) => (
                  <div 
                    key={t} 
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs text-white/80 hover:bg-white/10 transition-all duration-300 hover:scale-105 cursor-pointer"
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
      <section className="relative mx-auto max-w-7xl px-4 py-20 z-10">
        <div className="text-center space-y-12">
          <div className="text-reveal">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose <span className="bg-gradient-to-r from-red-400 to-yellow-400 bg-clip-text text-transparent">UnityWallet?</span>
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Experience the next generation of digital finance with cutting-edge security and seamless user experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: "Bank-Grade Security", desc: "Multi-signature protection and cold storage" },
              { icon: Zap, title: "Lightning Fast", desc: "Instant transactions across multiple networks" },
              { icon: Lock, title: "Full Control", desc: "Your keys, your crypto, your choice" },
              { icon: Users, title: "24/7 Support", desc: "Expert help whenever you need it" }
            ].map((feature, index) => (
              <div
                key={index}
                className="feature-card bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group"
              >
                <feature.icon className="w-12 h-12 text-red-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-reveal pt-8">
            <button 
              onClick={() => navigate('/pay')}
              className="group relative overflow-hidden bg-gradient-to-r from-red-500 to-yellow-400 hover:from-red-600 hover:to-yellow-500 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span className="relative z-10">Start Your Journey Today</span>
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>
        </div>
      </section>

      {/* ENHANCED FOOTER */}
      <footer className="mx-auto max-w-7xl px-4 pb-20 md:pb-12 pt-8 z-10 relative">
        <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-4 text-reveal">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3 flex items-center gap-2 text-white/80">
              <Wallet className="h-4 w-4" /> UnityWallet
            </div>
            <p className="text-sm text-white/60">Secure, fast, and delightful digital wallet experience.</p>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-white/80">Features</p>
            <ul className="space-y-1 text-sm text-white/60">
              <li><button onClick={() => navigate('/pay')} className="hover:text-white transition-colors">Send & Receive</button></li>
              <li><button onClick={() => navigate('/swap')} className="hover:text-white transition-colors">Swap Assets</button></li>
              <li><button onClick={() => navigate('/activity')} className="hover:text-white transition-colors">Transaction History</button></li>
              <li><button onClick={() => navigate('/insights')} className="hover:text-white transition-colors">Analytics</button></li>
            </ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-white/80">Security</p>
            <ul className="space-y-1 text-sm text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">Multi-Sig</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Encryption</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Audit Reports</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-white/80">Support</p>
            <ul className="space-y-1 text-sm text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-white/10 pt-4 text-xs text-white/50 gap-2">
          <span>© {new Date().getFullYear()} UnityWallet Labs</span>
          <div className="flex items-center gap-3">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
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
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
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

        /* Sparkline drawing animation */
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }

        /* Dashboard card floating animation */
        .dashboard-card {
          animation: dashboard-float 4s ease-in-out infinite;
        }

        @keyframes dashboard-float {
          0%, 100% { transform: translateY(0px) rotateX(0deg); }
          50% { transform: translateY(-10px) rotateX(2deg); }
        }
      `}</style>
    </div>
  );
}
