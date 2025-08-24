import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/theme';
import { Globe, ChevronDown, Check } from 'lucide-react';

const languages = [
  { code: 'en', name: 'EN', flag: '🇺🇸' },
  { code: 'vi', name: 'VN', flag: '🇻🇳' },
  { code: 'zh', name: '中', flag: '🇨🇳' },
  { code: 'ja', name: '日', flag: '🇯🇵' },
  { code: 'ko', name: '한', flag: '🇰🇷' },
];

interface LanguageSwitcherProps {
  compact?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false }) => {
  const { i18n, t } = useTranslation();
  const { isDark } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl border bg-white/5 text-white/80 hover:bg-white/10 transition-all duration-200 group ${
          compact ? 'p-2' : 'px-3 py-2'
        } ${
          isDark ? 'border-white/10' : 'border-gray-200/20'
        }`}
      >
        <Globe className="h-4 w-4 group-hover:text-red-400 transition-colors duration-200" />
        <span className="text-sm font-medium">{currentLanguage.flag}</span>
        {!compact && (
          <>
            <span className="text-sm font-medium">{currentLanguage.name}</span>
            <ChevronDown 
              className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg ring-1 ring-inset ring-white/5 z-50">
          <div className="p-2">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:bg-white/10 ${
                  i18n.language === language.code
                    ? 'bg-red-500/20 text-red-300'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="flex-1 text-left font-medium">{language.name}</span>
                {i18n.language === language.code && (
                  <Check className="h-4 w-4 text-red-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
