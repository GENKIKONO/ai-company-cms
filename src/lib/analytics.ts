// Plausible Analytics 統合
import { AnalyticsPageView, AnalyticsEvent, TrackingData } from '@/types';

declare global {
  interface Window {
    plausible?: (event: string, options?: {
      props?: Record<string, string | number>;
      callback?: () => void;
    }) => void;
  }
}

export interface PageViewEvent extends AnalyticsPageView {
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  userAgent?: string;
}

// Plausible トラッキング初期化
export function initPlausible(domain: string) {
  if (typeof window === 'undefined') return;

  // Plausible スクリプトタグが存在しない場合は動的に追加
  if (!document.querySelector('script[data-domain]')) {
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.setAttribute('data-domain', domain);
    script.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(script);
  }
}

// ページビュー追跡
export function trackPageView(data: PageViewEvent) {
  if (typeof window === 'undefined' || !window.plausible) return;

  const deviceType = getDeviceType();
  
  window.plausible('pageview', {
    props: {
      url: data.url,
      referrer: data.referrer || document.referrer,
      device_type: deviceType,
      ...(data.userAgent && { user_agent: data.userAgent })
    }
  });
}

// カスタムイベント追跡
export function trackEvent(event: AnalyticsEvent) {
  if (typeof window === 'undefined' || !window.plausible) return;

  window.plausible(event.name, {
    props: event.properties
  });
}

// 企業ページアクセス追跡
export function trackOrganizationView(organizationSlug: string, organizationName: string) {
  trackEvent({
    name: 'Organization View',
    properties: {
      organization_slug: organizationSlug,
      organization_name: organizationName,
      timestamp: Date.now().toString()
    }
  });
}

// 企業情報アクション追跡
export function trackOrganizationAction(action: string, organizationSlug: string, metadata?: Record<string, string | number>) {
  trackEvent({
    name: 'Organization Action',
    properties: {
      action,
      organization_slug: organizationSlug,
      ...metadata
    }
  });
}

// パフォーマンス指標の追跡
export function trackPerformanceMetrics() {
  if (typeof window === 'undefined' || !window.plausible) return;

  // Web Vitals の追跡は layout.tsx で実装済み
  // 追加のカスタムメトリクス
  
  // ページロード時間
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    if (loadTime > 0) {
      trackEvent({
        name: 'Page Load Time',
        properties: {
          load_time: Math.round(loadTime),
          page: window.location.pathname
        }
      });
    }
  });
}

// 検索・フィルタリング追跡
export function trackSearch(query: string, results: number, filters?: Record<string, string>) {
  trackEvent({
    name: 'Search',
    properties: {
      query,
      results_count: results,
      ...filters
    }
  });
}

// フォーム送信追跡
export function trackFormSubmission(formType: string, success: boolean, errorMessage?: string) {
  trackEvent({
    name: 'Form Submission',
    properties: {
      form_type: formType,
      success: success ? 1 : 0,
      ...(errorMessage && { error_message: errorMessage })
    }
  });
}

// ダウンロード追跡
export function trackDownload(fileType: string, fileName: string, organizationSlug?: string) {
  trackEvent({
    name: 'Download',
    properties: {
      file_type: fileType,
      file_name: fileName,
      ...(organizationSlug && { organization_slug: organizationSlug })
    }
  });
}

// 外部リンククリック追跡
export function trackExternalLink(url: string, organizationSlug?: string) {
  trackEvent({
    name: 'External Link Click',
    properties: {
      url,
      ...(organizationSlug && { organization_slug: organizationSlug })
    }
  });
}

// デバイスタイプ判定
function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';

  const userAgent = navigator.userAgent;
  
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    return 'mobile';
  }
  
  return 'desktop';
}

// エラー追跡
export function trackError(error: Error, context?: string) {
  trackEvent({
    name: 'Error',
    properties: {
      error_message: error.message,
      error_stack: error.stack?.substring(0, 500) || '',
      context: context || 'unknown',
      page: typeof window !== 'undefined' ? window.location.pathname : ''
    }
  });
}

// A/Bテスト追跡
export function trackABTest(testName: string, variant: string, organizationSlug?: string) {
  trackEvent({
    name: 'AB Test',
    properties: {
      test_name: testName,
      variant,
      ...(organizationSlug && { organization_slug: organizationSlug })
    }
  });
}

// コンバージョン追跡
export function trackConversion(type: string, value?: number, organizationSlug?: string) {
  trackEvent({
    name: 'Conversion',
    properties: {
      conversion_type: type,
      ...(value && { value }),
      ...(organizationSlug && { organization_slug: organizationSlug })
    }
  });
}

// セッション情報の追跡
export function trackSessionInfo() {
  if (typeof window === 'undefined') return;

  const sessionData = {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    screen_resolution: `${screen.width}x${screen.height}`,
    viewport_size: `${window.innerWidth}x${window.innerHeight}`,
    device_type: getDeviceType()
  };

  trackEvent({
    name: 'Session Info',
    properties: sessionData
  });
}

// Plausible Analytics の設定
export const PLAUSIBLE_CONFIG = {
  domain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'luxucare.example.com',
  apiHost: process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST || 'https://plausible.io',
  enabled: process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
};

// Analytics の初期化（アプリケーション起動時に呼び出し）
export function initializeAnalytics() {
  if (!PLAUSIBLE_CONFIG.enabled) {
    console.log('Analytics disabled in development mode');
    return;
  }

  initPlausible(PLAUSIBLE_CONFIG.domain);
  trackSessionInfo();
  trackPerformanceMetrics();

  // エラーハンドリング
  window.addEventListener('error', (event) => {
    trackError(new Error(event.message), 'window_error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    trackError(new Error(event.reason), 'unhandled_promise_rejection');
  });
}