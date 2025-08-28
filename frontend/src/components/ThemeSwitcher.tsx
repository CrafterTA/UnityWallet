import React, { useEffect, useRef } from 'react';
import { useThemeStore } from '@/store/theme';
import { Moon, Sun, Monitor } from 'lucide-react';
import { gsap } from 'gsap';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme, isDark } = useThemeStore();
  const switcherRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  const themes = [
    { key: 'light', icon: Sun, label: 'Light' },
    { key: 'dark', icon: Moon, label: 'Dark' },
    { key: 'system', icon: Monitor, label: 'System' },
  ] as const;

  useEffect(() => {
    // Animate the indicator position based on current theme
    const currentIndex = themes.findIndex(t => t.key === theme);
    const indicator = indicatorRef.current;
    
    if (indicator && currentIndex !== -1) {
      gsap.to(indicator, {
        xPercent: currentIndex * 100,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  }, [theme]);

  useEffect(() => {
    // Initial animation
    const switcher = switcherRef.current;
    if (switcher) {
      gsap.fromTo(switcher,
        { opacity: 0, scale: 0.8, y: -20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" }
      );
    }
  }, []);

  const handleThemeChange = (newTheme: typeof theme) => {
    if (newTheme === theme) return; // Don't animate if same theme
    
    setTheme(newTheme);
    
    // Add a subtle bounce animation
    const switcher = switcherRef.current;
    if (switcher) {
      gsap.to(switcher, {
        scale: 1.05,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      });
    }
    
    // Animate the indicator smoothly
    const currentIndex = themes.findIndex(t => t.key === newTheme);
    const indicator = indicatorRef.current;
    
    if (indicator && currentIndex !== -1) {
      gsap.to(indicator, {
        xPercent: currentIndex * 100,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  };

  return (
    <div ref={switcherRef} className={`relative flex h-10 items-center rounded-xl border p-1 backdrop-blur-sm shadow-lg ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100/80'}`}>
      {/* Sliding indicator */}
      <div
        ref={indicatorRef}
        className="absolute left-1 top-1 h-[calc(100%-8px)] w-[calc((100%-8px)/3)] rounded-lg bg-gradient-to-r from-red-500/20 to-yellow-500/20 ring-1 ring-inset ring-white/20 shadow-sm backdrop-blur-sm"
        style={{ transform: `translateX(${themes.findIndex(t => t.key === theme) * 100}%)` }}
      />
      
      {themes.map((themeOption) => (
        <button
          key={themeOption.key}
          onClick={() => handleThemeChange(themeOption.key)}
          title={themeOption.label}
          className={`relative z-10 flex h-8 w-[calc((100%-8px)/3)] items-center justify-center rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 ${
            theme === themeOption.key
              ? `${isDark ? 'text-white' : 'text-slate-900'}`
              : `${isDark ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`
          }`}
        >
          <themeOption.icon className="h-4 w-4 transition-transform duration-200" />
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;
