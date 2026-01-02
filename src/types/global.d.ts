/**
 * グローバル型宣言
 * ブラウザ非標準API・外部スクリプトの型定義
 */

// Chrome非標準 performance.memory API
interface PerformanceMemory {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}

// Plausible Analytics
interface PlausibleEventOptions {
  props?: Record<string, string | number | boolean | null>;
  callback?: () => void;
  revenue?: { amount: number; currency: string };
}

type PlausibleFunction = (
  event: string,
  options?: PlausibleEventOptions
) => void;

declare global {
  interface Performance {
    memory?: PerformanceMemory;
  }

  interface Window {
    plausible?: PlausibleFunction;
    // Google Tag Manager dataLayer
    dataLayer?: Record<string, unknown>[];
  }
}

export {};
