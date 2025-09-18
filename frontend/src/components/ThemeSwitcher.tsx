import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/store/theme';

interface ThemeSwitcherProps {
  compact?: boolean;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ compact = false }) => {
  const { isDark, setTheme } = useThemeStore();

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        group relative flex items-center justify-center rounded-xl border transition-all duration-300 hover:scale-105
        ${isDark 
          ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20' 
          : 'bg-slate-100/80 hover:bg-slate-200/80 border-slate-200 hover:border-slate-300'
        }
        ${compact ? 'p-2' : 'p-2.5'}
      `}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Background glow effect */}
      <div className={`
        absolute inset-0 rounded-xl transition-all duration-300
        ${isDark 
          ? 'bg-gradient-to-r from-yellow-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100' 
          : 'bg-gradient-to-r from-slate-400/20 to-slate-600/20 opacity-0 group-hover:opacity-100'
        }
      `} />
      
      {/* Icon with smooth rotation */}
      <div className="relative z-10 transition-transform duration-500 group-hover:rotate-12">
        {isDark ? (
          <Sun className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-yellow-400 transition-colors duration-300 group-hover:text-yellow-300`} />
        ) : (
          <Moon className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-slate-600 transition-colors duration-300 group-hover:text-slate-800`} />
        )}
      </div>
      
      {/* Subtle shine effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 -translate-x-full group-hover:translate-x-full" />
    </button>
  );
};

export default ThemeSwitcher;
