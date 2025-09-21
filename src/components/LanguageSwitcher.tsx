'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDownIcon, LanguageIcon } from '@heroicons/react/24/outline';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n';

interface LanguageSwitcherProps {
  currentLocale: Locale;
  className?: string;
}

export default function LanguageSwitcher({ 
  currentLocale, 
  className = '' 
}: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLanguage = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    startTransition(() => {
      // Remove the current locale from the pathname if it exists
      const segments = pathname.split('/');
      if (segments[1] && locales.includes(segments[1] as Locale)) {
        segments[1] = newLocale;
      } else {
        segments.splice(1, 0, newLocale);
      }
      
      const newPath = segments.join('/');
      router.push(newPath);
    });
  };

  const detectUserLanguage = (): Locale => {
    if (typeof window === 'undefined') return 'ja';
    
    const browserLanguage = navigator.language.split('-')[0];
    return locales.includes(browserLanguage as Locale) 
      ? (browserLanguage as Locale) 
      : 'ja';
  };

  const handleAutoDetect = () => {
    const detectedLocale = detectUserLanguage();
    if (detectedLocale !== currentLocale) {
      switchLanguage(detectedLocale);
    }
  };

  return (
    <Menu as="div" className={`relative inline-block text-left ${className}`}>
      <div>
        <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors duration-200">
          <span className="flex items-center">
            <span className="mr-2 text-lg">
              {localeFlags[currentLocale]}
            </span>
            <span className="hidden sm:inline">
              {localeNames[currentLocale]}
            </span>
            <span className="sm:hidden">
              {currentLocale.toUpperCase()}
            </span>
          </span>
          <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {/* Auto-detect option */}
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleAutoDetect}
                  className={`${
                    active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors duration-150`}
                  disabled={isPending}
                >
                  <LanguageIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                  自動検出 / Auto-detect
                </button>
              )}
            </Menu.Item>
          </div>

          {/* Language options */}
          <div className="px-1 py-1">
            {locales.map((locale) => (
              <Menu.Item key={locale}>
                {({ active }) => (
                  <button
                    onClick={() => switchLanguage(locale)}
                    className={`${
                      active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                    } ${
                      currentLocale === locale ? 'bg-indigo-50 font-semibold' : ''
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors duration-150`}
                    disabled={isPending || currentLocale === locale}
                  >
                    <span className="mr-3 text-lg">{localeFlags[locale]}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{localeNames[locale]}</div>
                      <div className="text-xs text-gray-500 uppercase">
                        {locale}
                      </div>
                    </div>
                    {currentLocale === locale && (
                      <div className="ml-2 h-2 w-2 rounded-full bg-indigo-600" />
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>

      {/* Loading indicator */}
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 rounded-md">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      )}
    </Menu>
  );
}

// Hook for getting current locale from pathname
export function useCurrentLocale(): Locale {
  const pathname = usePathname();
  const segments = pathname.split('/');
  
  if (segments[1] && locales.includes(segments[1] as Locale)) {
    return segments[1] as Locale;
  }
  
  return 'ja'; // Default locale
}

// Hook for locale-aware navigation
export function useLocaleRouter() {
  const router = useRouter();
  const currentLocale = useCurrentLocale();
  
  const push = (href: string) => {
    const localizedHref = `/${currentLocale}${href.startsWith('/') ? href : `/${href}`}`;
    router.push(localizedHref);
  };
  
  const replace = (href: string) => {
    const localizedHref = `/${currentLocale}${href.startsWith('/') ? href : `/${href}`}`;
    router.replace(localizedHref);
  };
  
  return { push, replace, locale: currentLocale };
}