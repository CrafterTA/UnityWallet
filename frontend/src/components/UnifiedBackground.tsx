import React, { useEffect, useRef } from 'react';
import { useThemeStore } from '../store/theme';

const UnifiedBackground: React.FC = () => {
  const { isDark } = useThemeStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ModernBackground - Canvas animation
  useEffect(() => {
    if (isDark || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f8fafc'); // slate-50
    gradient.addColorStop(0.3, '#e2e8f0'); // slate-200
    gradient.addColorStop(0.7, '#cbd5e1'); // slate-300
    gradient.addColorStop(1, '#94a3b8'); // slate-400

    // Animated circles
    const circles: Array<{
      x: number;
      y: number;
      radius: number;
      dx: number;
      dy: number;
      opacity: number;
      color: string;
    }> = [];

    // Create floating circles
    for (let i = 0; i < 15; i++) {
      circles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 100 + 50,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.1 + 0.05,
        color: `hsl(${200 + Math.random() * 60}, 70%, 80%)`
      });
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      // Clear canvas
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw and animate circles
      circles.forEach(circle => {
        // Update position
        circle.x += circle.dx;
        circle.y += circle.dy;

        // Bounce off edges
        if (circle.x < 0 || circle.x > canvas.width) circle.dx *= -1;
        if (circle.y < 0 || circle.y > canvas.height) circle.dy *= -1;

        // Draw circle
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fillStyle = circle.color;
        ctx.globalAlpha = circle.opacity;
        ctx.fill();
      });

      // Reset global alpha
      ctx.globalAlpha = 1;

      // Draw subtle grid pattern
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
      ctx.lineWidth = 1;
      const gridSize = 60;

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw floating particles
      for (let i = 0; i < 50; i++) {
        const x = (Date.now() * 0.001 + i * 100) % canvas.width;
        const y = (Date.now() * 0.0005 + i * 50) % canvas.height;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148, 163, 184, ${0.3 + Math.sin(Date.now() * 0.001 + i) * 0.2})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [isDark]);

  // MorphingBackground - Morphing blobs
  useEffect(() => {
    if (isDark || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Morphing blob parameters
    const blobs: Array<{
      x: number;
      y: number;
      radius: number;
      angle: number;
      speed: number;
      points: number;
      color: string;
    }> = [];

    // Create morphing blobs
    for (let i = 0; i < 3; i++) {
      blobs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 150 + 100,
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.01,
        points: Math.floor(Math.random() * 8) + 6,
        color: `hsla(${200 + i * 60}, 70%, 80%, 0.1)`
      });
    }

    // Animation loop for morphing
    let morphingId: number;
    const animateMorphing = () => {
      // Draw and animate morphing blobs
      blobs.forEach((blob, index) => {
        // Update angle
        blob.angle += blob.speed;

        // Create morphing shape
        ctx.beginPath();
        for (let i = 0; i < blob.points; i++) {
          const angle = (i / blob.points) * Math.PI * 2 + blob.angle;
          const radius = blob.radius + Math.sin(blob.angle * 3 + i) * 20;
          const x = blob.x + Math.cos(angle) * radius;
          const y = blob.y + Math.sin(angle) * radius;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        
        // Fill blob
        ctx.fillStyle = blob.color;
        ctx.fill();
        
        // Add subtle stroke
        ctx.strokeStyle = `hsla(${200 + index * 60}, 70%, 70%, 0.2)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw floating elements
      for (let i = 0; i < 8; i++) {
        const time = Date.now() * 0.001;
        const x = (Math.sin(time + i) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(time * 0.7 + i) * 0.5 + 0.5) * canvas.height;
        const size = Math.sin(time + i) * 3 + 4;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${0.3 + Math.sin(time + i) * 0.2})`;
        ctx.fill();
      }

      morphingId = requestAnimationFrame(animateMorphing);
    };

    animateMorphing();

    return () => {
      cancelAnimationFrame(morphingId);
    };
  }, [isDark]);

  // GlassmorphismBackground - Mouse tracking
  useEffect(() => {
    if (isDark || !containerRef.current) return;

    const container = containerRef.current;
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { width, height } = container.getBoundingClientRect();
      
      const x = (clientX / width) * 100;
      const y = (clientY / height) * 100;
      
      container.style.setProperty('--mouse-x', `${x}%`);
      container.style.setProperty('--mouse-y', `${y}%`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isDark]);

  if (isDark) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{
        '--mouse-x': '50%',
        '--mouse-y': '50%'
      } as React.CSSProperties}
    >
      {/* Canvas for ModernBackground and MorphingBackground */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      
      {/* LightModeBackground - Base gradients and shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50" />
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/30 via-transparent to-indigo-50/30" />
      <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-slate-100/20 to-transparent" />
      
      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-20 w-40 h-40 rounded-full bg-gradient-to-br from-blue-200/40 to-indigo-200/30 blur-3xl animate-pulse" />
      <div className="absolute top-40 right-20 w-32 h-32 rounded-full bg-gradient-to-br from-slate-200/50 to-blue-200/40 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-40 left-1/4 w-28 h-28 rounded-full bg-gradient-to-br from-indigo-200/40 to-slate-200/20 blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:80px_80px]" />
      
      {/* Additional subtle effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.08),transparent_50%)]" />
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(25)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-1.5 h-1.5 bg-blue-300/50 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* GlassmorphismBackground - Animated gradient overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-indigo-100/20 transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(59, 130, 246, 0.15) 0%, transparent 50%)`
        }}
      />
      
      {/* Glassmorphism orbs */}
      <div className="absolute top-1/4 left-1/3 w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 shadow-lg" />
      <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 shadow-lg" />
      <div className="absolute bottom-1/4 left-1/2 w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 shadow-lg" />
      
      {/* Subtle wave effect */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-50/20 to-transparent" />
      
      {/* ModernEffects - Animated gradient borders */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-pulse" />
      <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-indigo-400/30 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-400/30 to-transparent animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-blue-400/30 to-transparent animate-pulse" style={{ animationDelay: '3s' }} />
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-100/20 via-transparent to-transparent" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-100/20 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-100/20 via-transparent to-transparent" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-blue-100/20 via-transparent to-transparent" />
      
      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20200%20200%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cfilter%20id%3D%22noise%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.65%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22/%3E%3C/filter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noise)%22/%3E%3C/svg%3E')]" />

      {/* Stellar Logo Effects - Multiple rotating logos */}
      
      {/* Top left - Large rotating logo */}
      <div className="absolute top-20 left-20 w-32 h-32 animate-spin-slow opacity-20">
        <div className="w-full h-full relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/60 to-indigo-500/60 transform rotate-45 rounded-sm"></div>
              <div className="absolute top-0 left-1/2 w-2 h-8 bg-gradient-to-b from-blue-400/80 to-transparent transform -translate-x-1/2"></div>
              <div className="absolute bottom-0 left-1/2 w-2 h-8 bg-gradient-to-t from-indigo-500/80 to-transparent transform -translate-x-1/2"></div>
              <div className="absolute left-0 top-1/2 w-8 h-2 bg-gradient-to-r from-blue-400/80 to-transparent transform -translate-y-1/2"></div>
              <div className="absolute right-0 top-1/2 w-8 h-2 bg-gradient-to-l from-indigo-500/80 to-transparent transform -translate-y-1/2"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Top right - Medium rotating logo */}
      <div className="absolute top-32 right-32 w-24 h-24 animate-spin-reverse opacity-15">
        <div className="w-full h-full relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/50 to-purple-500/50 transform rotate-45 rounded-sm"></div>
              <div className="absolute top-0 left-1/2 w-1.5 h-6 bg-gradient-to-b from-indigo-400/70 to-transparent transform -translate-x-1/2"></div>
              <div className="absolute bottom-0 left-1/2 w-1.5 h-6 bg-gradient-to-t from-purple-500/70 to-transparent transform -translate-x-1/2"></div>
              <div className="absolute left-0 top-1/2 w-6 h-1.5 bg-gradient-to-r from-indigo-400/70 to-transparent transform -translate-y-1/2"></div>
              <div className="absolute right-0 top-1/2 w-6 h-1.5 bg-gradient-to-l from-purple-500/70 to-transparent transform -translate-y-1/2"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom left - Small rotating logo */}
      <div className="absolute bottom-32 left-32 w-20 h-20 animate-spin-slow opacity-25">
        <div className="w-full h-full relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-400/60 to-blue-500/60 transform rotate-45 rounded-sm"></div>
              <div className="absolute top-0 left-1/2 w-1 h-5 bg-gradient-to-b from-slate-400/70 to-transparent transform -translate-x-1/2"></div>
              <div className="absolute bottom-0 left-1/2 w-1 h-5 bg-gradient-to-t from-blue-500/70 to-transparent transform -translate-x-1/2"></div>
              <div className="absolute left-0 top-1/2 w-5 h-1 bg-gradient-to-r from-slate-400/70 to-transparent transform -translate-y-1/2"></div>
              <div className="absolute right-0 top-1/2 w-5 h-1 bg-gradient-to-l from-blue-500/70 to-transparent transform -translate-y-1/2"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Center right - Floating logo with glow */}
      <div className="absolute top-1/2 right-20 w-28 h-28 animate-float-slow animate-glow-pulse opacity-30">
        <div className="w-full h-full relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/70 to-indigo-600/70 transform rotate-45 rounded-sm"></div>
              <div className="absolute top-0 left-1/2 w-2 h-7 bg-gradient-to-b from-blue-500/80 to-transparent transform -translate-x-1/2"></div>
              <div className="absolute bottom-0 left-1/2 w-2 h-7 bg-gradient-to-t from-indigo-600/80 to-transparent transform -translate-x-1/2"></div>
              <div className="absolute left-0 top-1/2 w-7 h-2 bg-gradient-to-r from-blue-500/80 to-transparent transform -translate-y-1/2"></div>
              <div className="absolute right-0 top-1/2 w-7 h-2 bg-gradient-to-l from-indigo-600/80 to-transparent transform -translate-x-1/2"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Center left - Pulsing logo */}
      <div className="absolute top-1/3 left-16 w-20 h-20 animate-pulse opacity-20">
        <div className="w-full h-full relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/60 to-purple-600/60 transform rotate-45 rounded-sm"></div>
              <div className="absolute top-0 left-1/2 w-1.5 h-6 bg-gradient-to-b from-indigo-500/70 to-transparent transform -translate-x-1/2"></div>
              <div className="absolute bottom-0 left-1/2 w-1.5 h-6 bg-gradient-to-t from-purple-600/70 to-transparent transform -translate-x-1/2"></div>
              <div className="absolute left-0 top-1/2 w-6 h-1.5 bg-gradient-to-r from-indigo-500/70 to-transparent transform -translate-y-1/2"></div>
              <div className="absolute right-0 top-1/2 w-6 h-1.5 bg-gradient-to-l from-purple-600/70 to-transparent transform -translate-y-1/2"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom right - Slow rotating logo */}
      <div className="absolute bottom-20 right-20 w-36 h-36 animate-spin-very-slow opacity-15">
        <div className="w-full h-full relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-18 h-18 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/50 to-blue-600/50 transform rotate-45 rounded-sm"></div>
              <div className="absolute top-0 left-1/2 w-2.5 h-9 bg-gradient-to-b from-slate-500/70 to-transparent transform -translate-x-1/2"></div>
              <div className="absolute bottom-0 left-1/2 w-2.5 h-9 bg-gradient-to-t from-blue-600/70 to-transparent transform -translate-x-1/2"></div>
              <div className="absolute left-0 top-1/2 w-9 h-2.5 bg-gradient-to-r from-slate-500/70 to-transparent transform -translate-y-1/2"></div>
              <div className="absolute right-0 top-1/2 w-9 h-2.5 bg-gradient-to-l from-blue-600/70 to-transparent transform -translate-y-1/2"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating particles that look like small stars */}
      {[...Array(12)].map((_, i) => (
        <div 
          key={i}
          className="absolute w-2 h-2 bg-gradient-to-br from-blue-400/60 to-indigo-500/60 rounded-full animate-float-star"
          style={{
            left: `${20 + (i * 6) % 60}%`,
            top: `${15 + (i * 8) % 70}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${4 + (i % 3) * 2}s`
          }}
        />
      ))}

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.5; }
          50% { transform: translateY(-25px) rotate(180deg); opacity: 1; }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        @keyframes spin-very-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(180deg); }
        }
        
        @keyframes float-star {
          0%, 100% { 
            transform: translateY(0px) scale(1); 
            opacity: 0.6;
          }
          50% { 
            transform: translateY(-20px) scale(1.2); 
            opacity: 1;
          }
        }
        
        @keyframes glow-pulse {
          0%, 100% { 
            filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.3));
          }
          50% { 
            filter: drop-shadow(0 0 15px rgba(99, 102, 241, 0.6));
          }
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 25s linear infinite;
        }
        
        .animate-spin-very-slow {
          animation: spin-very-slow 40s linear infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        
        .animate-float-star {
          animation: float-star 6s ease-in-out infinite;
        }
        
        .animate-glow-pulse {
          animation: glow-pulse 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default UnifiedBackground;
