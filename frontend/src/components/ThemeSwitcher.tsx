import React, { useEffect, useRef } from 'react';
import { useThemeStore } from '@/store/theme';
import { Sun, Moon, Monitor } from 'lucide-react';
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
        x: currentIndex * 32, 
        duration: 0.3,
        ease: "power2.out"
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
  };

  return (
    <div 
      ref={switcherRef}
      className="relative inline-flex items-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-0.5 shadow-lg"
    >
      {/* Animated indicator */}
      <div
        ref={indicatorRef}
        className="absolute h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500/80 to-accent-400/80 transition-all duration-300 ease-out shadow-lg"
        style={{
          boxShadow: isDark 
            ? '0 4px 20px rgba(239, 30, 36, 0.3)' 
            : '0 4px 20px rgba(239, 30, 36, 0.15)',
        }}
      />
      
      {/* Theme buttons */}
      {themes.map((themeOption, index) => {
        const Icon = themeOption.icon;
        const isActive = theme === themeOption.key;
        
        return (
          <button
            key={themeOption.key}
            onClick={() => handleThemeChange(themeOption.key)}
            className={`
              relative z-10 flex h-8 w-8 items-center justify-center rounded-lg 
              transition-all duration-300 ease-out
              ${isActive 
                ? 'text-white' 
                : isDark 
                  ? 'text-white/60 hover:text-white/80' 
                  : 'text-gray-600 hover:text-gray-800'
              }
              hover:scale-110 active:scale-95
            `}
            title={`Switch to ${themeOption.label} mode`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSwitcher;
