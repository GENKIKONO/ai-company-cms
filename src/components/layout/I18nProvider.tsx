'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { I18nManager } from '@/lib/utils/i18n';

export type Locale = 'ja' | 'en' | 'zh' | 'ko';
type SupportedLocale = Locale;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [i18nManager] = useState(() => new I18nManager());
  const [locale, setLocaleState] = useState<Locale>(() => {
    // サーバーサイドでは初期値を使用
    if (typeof window === 'undefined') {
      return initialLocale || 'ja';
    }

    // クライアントサイドでは複数のソースから言語を検出
    return detectInitialLocale() || initialLocale || 'ja';
  });

  // ロケール変更時の処理（日本語専用 - no-op）
  const setLocale = (newLocale: Locale) => {
    // 日本語専用運用のため、lang属性の動的変更は無効化
    // setLocaleState(newLocale); // 削除
    // i18nManager.setLocale(newLocale); // 削除
    // document.documentElement.lang は変更しない
    console.log('setLocale called but ignored (Japanese-only mode):', newLocale);
  };

  useEffect(() => {
    // 初期化時にi18nManagerのロケールを設定（日本語固定）
    i18nManager.setLocale('ja');
    
    // 日本語専用運用のため、lang属性とdir属性は固定
    if (typeof window !== 'undefined') {
      document.documentElement.lang = 'ja';
      document.documentElement.dir = 'ltr';
    }
  }, [i18nManager]);

  const contextValue: I18nContextType = {
    locale,
    setLocale,
    t: (key: string, params?: Record<string, string | number>) => i18nManager.t(key, params),
    formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => 
      i18nManager.formatDate(typeof date === 'string' ? new Date(date) : date),
    formatNumber: (number: number, options?: Intl.NumberFormatOptions) => 
      i18nManager.formatNumber(number),
    formatCurrency: (amount: number, currency?: string) => 
      i18nManager.formatCurrency(amount),
    isRTL: getRTLLanguages().includes(locale)
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// ユーティリティ関数

function detectInitialLocale(): Locale | null {
  if (typeof window === 'undefined') return null;

  // 1. URLパラメータから検出
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang') as Locale;
  if (urlLang && isValidLocale(urlLang)) {
    return urlLang;
  }

  // 2. ローカルストレージから検出
  const storedLocale = localStorage.getItem('preferred-locale') as Locale;
  if (storedLocale && isValidLocale(storedLocale)) {
    return storedLocale;
  }

  // 3. ブラウザの言語設定から検出
  const browserLanguages = navigator.languages || [navigator.language];
  for (const lang of browserLanguages) {
    const locale = lang.split('-')[0] as Locale;
    if (isValidLocale(locale)) {
      return locale;
    }
  }

  return null;
}

function isValidLocale(locale: string): locale is Locale {
  return ['ja', 'en', 'zh', 'ko'].includes(locale);
}

function getRTLLanguages(): Locale[] {
  // 現在サポートしている言語にRTL言語はないが、将来のアラビア語対応などのため
  return [];
}

// HOC for pages that need i18n
export function withI18n<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallbackLocale?: Locale;
    requiredKeys?: string[];
  }
) {
  return function I18nWrappedComponent(props: P) {
    return (
      <I18nProvider initialLocale={options?.fallbackLocale}>
        <Component {...props} />
      </I18nProvider>
    );
  };
}

// Server-side locale detection
export function getServerSideLocale(request?: Request): Locale {
  if (!request) return 'ja';

  // Accept-Languageヘッダーから検出
  const acceptLanguage = request.headers.get('Accept-Language');
  if (acceptLanguage) {
    const languages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].split('-')[0])
      .filter(lang => isValidLocale(lang));
    
    if (languages.length > 0) {
      return languages[0] as Locale;
    }
  }

  return 'ja'; // デフォルト
}