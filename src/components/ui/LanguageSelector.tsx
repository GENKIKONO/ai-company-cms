'use client';

import { useState, useRef, useEffect } from 'react';
import { useI18n, type Locale } from '@/components/layout/I18nProvider';
import { Globe2, ChevronDown } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' }
];

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'button';
  showFlag?: boolean;
  showNativeName?: boolean;
  className?: string;
}

export function LanguageSelector({
  variant = 'dropdown',
  showFlag = true,
  showNativeName = true,
  className = ''
}: LanguageSelectorProps) {
  const { locale, setLocale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === locale) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (languageCode: string) => {
    setLocale(languageCode as Locale);
    setIsOpen(false);
    
    // URL更新（SEO用）
    const url = new URL(window.location.href);
    url.searchParams.set('lang', languageCode);
    window.history.replaceState(null, '', url.toString());
  };

  if (variant === 'button') {
    return (
      <div className={`inline-flex gap-1 ${className}`}>
        {SUPPORTED_LANGUAGES.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`
              px-2 py-1 text-sm rounded-md transition-colors
              ${locale === language.code 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }
            `}
            aria-label={`${t('ui.language.switchTo')} ${language.nativeName}`}
          >
            {showFlag && <span className="mr-1">{language.flag}</span>}
            {language.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 px-3 py-2 text-sm
          bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
          rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-colors
        "
        aria-label={t('ui.language.selector')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        {showFlag && <span>{currentLanguage.flag}</span>}
        <span className="text-gray-700 dark:text-gray-300">
          {showNativeName ? currentLanguage.nativeName : currentLanguage.code.toUpperCase()}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="
          absolute right-0 mt-1 w-48 z-50
          bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
          rounded-md shadow-lg ring-1 ring-black ring-opacity-5
          focus:outline-none
        ">
          <div className="py-1" role="listbox">
            {SUPPORTED_LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2 text-sm text-left
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  ${locale === language.code 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'text-gray-700 dark:text-gray-300'
                  }
                `}
                role="option"
                aria-selected={locale === language.code}
              >
                <span className="text-lg">{language.flag}</span>
                <div>
                  <div className="font-medium">{language.nativeName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{language.name}</div>
                </div>
                {locale === language.code && (
                  <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function MobileLanguageSelector({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('ui.language.label')}
      </label>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="
          w-full px-3 py-2 text-sm
          bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
          rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        "
        aria-label={t('ui.language.selector')}
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.flag} {language.nativeName} ({language.name})
          </option>
        ))}
      </select>
    </div>
  );
}

export type { Language };
export { SUPPORTED_LANGUAGES };