import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface FloatingElementProps {
  delay?: number;
  duration?: number;
  className?: string;
  children?: React.ReactNode;
}

const FloatingElement: React.FC<FloatingElementProps> = ({ 
  delay = 0, 
  duration = 4, 
  className = '',
  children 
}) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Initial animation
    gsap.fromTo(element, 
      { 
        opacity: 0, 
        scale: 0.5,
        y: 100 
      },
      { 
        opacity: 1, 
        scale: 1,
        y: 0,
        duration: 1.5,
        delay,
        ease: "back.out(1.7)"
      }
    );

    // Floating animation
    gsap.to(element, {
      y: "random(-20, 20)",
      x: "random(-15, 15)",
      rotation: "random(-5, 5)",
      duration,
      ease: "power1.inOut",
      yoyo: true,
      repeat: -1,
      delay
    });

    // Hover interaction
    const handleMouseEnter = () => {
      gsap.to(element, {
        scale: 1.1,
        rotation: "random(-10, 10)",
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, {
        scale: 1,
        rotation: 0,
        duration: 0.5,
        ease: "power2.out"
      });
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [delay, duration]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
};

const LightModeBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    updateCanvasSize();

    // Particle system for light mode
    const particles: any[] = [];
    const particleCount = 25;

    class LightParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
      hue: number;

      constructor() {
        this.x = Math.random() * (canvas?.width || window.innerWidth);
        this.y = Math.random() * (canvas?.height || window.innerHeight);
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.3 + 0.1;
        this.hue = Math.random() * 60 + 15; // Warm colors (15-75 degrees)
        this.color = `hsla(${this.hue}, 65%, 60%, ${this.opacity})`;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Boundary collision
        const width = canvas?.width || window.innerWidth;
        const height = canvas?.height || window.innerHeight;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Gentle opacity oscillation
        this.opacity += (Math.random() - 0.5) * 0.005;
        this.opacity = Math.max(0.05, Math.min(0.4, this.opacity));
        
        // Update color with new opacity
        this.color = `hsla(${this.hue}, 65%, 60%, ${this.opacity})`;
      }

      draw() {
        if (!ctx) return;
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        // Create gradient for particle
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size * 2
        );
        gradient.addColorStop(0, `hsl(${this.hue}, 65%, 60%)`);
        gradient.addColorStop(1, `hsla(${this.hue}, 65%, 60%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new LightParticle());
    }

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw subtle gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bgGradient.addColorStop(0, 'rgba(239, 30, 36, 0.02)');
      bgGradient.addColorStop(0.3, 'rgba(255, 193, 7, 0.015)');
      bgGradient.addColorStop(0.7, 'rgba(255, 179, 0, 0.02)');
      bgGradient.addColorStop(1, 'rgba(239, 30, 36, 0.015)');
      
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw subtle connections
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.save();
            ctx.globalAlpha = (120 - distance) / 120 * 0.1;
            ctx.strokeStyle = `hsl(${(particle.hue + otherParticle.hue) / 2}, 50%, 50%)`;
            ctx.lineWidth = 0.5;
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
      updateCanvasSize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Animated Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          background: `linear-gradient(135deg, 
            #FEFEFE 0%, 
            #F8FAFC 25%, 
            #FFFFFF 50%, 
            #F9FAFB 75%, 
            #FEFEFE 100%)`
        }}
      />

      {/* Floating Geometric Elements */}
      <div className="absolute inset-0">
        {/* Large decorative circles */}
        <FloatingElement delay={0} duration={6} className="absolute top-1/4 left-1/4 w-32 h-32 opacity-30">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-100 to-accent-100 blur-sm" />
        </FloatingElement>

        <FloatingElement delay={1} duration={8} className="absolute top-3/4 right-1/4 w-24 h-24 opacity-25">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-accent-200 to-primary-200 blur-sm" />
        </FloatingElement>

        <FloatingElement delay={2} duration={5} className="absolute top-1/2 right-1/3 w-20 h-20 opacity-20">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-300 to-accent-300 blur-sm" />
        </FloatingElement>

        {/* Small floating shapes */}
        <FloatingElement delay={0.5} duration={4} className="absolute top-1/6 right-1/6 w-8 h-8 opacity-40">
          <div className="w-full h-full rounded bg-gradient-to-br from-primary-200 to-accent-200 transform rotate-45" />
        </FloatingElement>

        <FloatingElement delay={1.5} duration={7} className="absolute bottom-1/4 left-1/6 w-6 h-6 opacity-35">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-accent-300 to-primary-300" />
        </FloatingElement>

        <FloatingElement delay={2.5} duration={6} className="absolute top-1/3 left-2/3 w-4 h-4 opacity-45">
          <div className="w-full h-full bg-gradient-to-br from-primary-400 to-accent-400 transform rotate-12" />
        </FloatingElement>

        {/* Subtle gradient overlays */}
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-primary-50 to-transparent opacity-30 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-accent-50 to-transparent opacity-25 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-gradient-radial from-white to-transparent opacity-40 blur-2xl" />
      </div>

      {/* Animated light rays */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute -inset-x-full -inset-y-full"
          style={{
            background: `conic-gradient(from 45deg at 50% 50%, 
              rgba(239, 30, 36, 0.05) 0deg, 
              transparent 60deg, 
              transparent 120deg, 
              rgba(255, 193, 7, 0.05) 180deg, 
              transparent 240deg, 
              transparent 300deg, 
              rgba(239, 30, 36, 0.05) 360deg)`,
            animation: 'rotate 60s linear infinite'
          }}
        />
      </div>

      {/* Additional Styles */}
      <style>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
};

export default LightModeBackground;
