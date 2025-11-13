/**
 * Internationalization hook - minimal implementation for build compatibility
 */

interface UseI18nReturn {
  t: (key: string) => string;
  formatNumber: (num: number) => string;
}

export function useI18n(): UseI18nReturn {
  // Minimal safe implementation
  const t = (key: string): string => {
    // Simple key-to-text mapping for common keys
    const translations: Record<string, string> = {
      'pages.home.title': 'AIO Hub - AI企業CMS',
      'pages.home.description': 'AI技術を活用した企業情報の統合管理プラットフォーム'
    };
    
    return translations[key] || key;
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ja-JP').format(num);
  };

  return { t, formatNumber };
}