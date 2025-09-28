'use client';

/**
 * Web Vitals パフォーマンス監視コンポーネント
 * 要件定義準拠: LCP < 2.5秒、CLS < 0.1、FID < 100ms の監視
 */

import { useEffect } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

interface VitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  id: string;
  delta: number;
}

interface VitalThresholds {
  good: number;
  needsImprovement: number;
}

// Web Vitals しきい値（Google推奨値）
const VITALS_THRESHOLDS: Record<string, VitalThresholds> = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  INP: { good: 200, needsImprovement: 500 },   // Interaction to Next Paint (replaces FID)
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }  // Time to First Byte
};

/**
 * メトリクスの評価を取得
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = VITALS_THRESHOLDS[name];
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * メトリクスを外部サービスに送信
 */
async function sendToAnalytics(metric: VitalMetric) {
  try {
    // 本番環境では Google Analytics 4, Datadog, New Relic などに送信
    if (process.env.NODE_ENV === 'production') {
      await fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          id: metric.id,
          delta: metric.delta,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        }),
      });
    } else {
      // 開発環境ではコンソールに出力
      console.log(`🔍 Web Vital: ${metric.name}`, {
        value: `${metric.value}ms`,
        rating: metric.rating,
        threshold: VITALS_THRESHOLDS[metric.name],
        url: window.location.pathname
      });
    }
  } catch (error) {
    console.error('Failed to send web vitals data:', error);
  }
}

/**
 * パフォーマンス警告の表示
 */
function showPerformanceWarning(metric: VitalMetric) {
  if (metric.rating === 'poor' && process.env.NODE_ENV === 'development') {
    const warningMessage = getWarningMessage(metric);
    console.warn(`⚠️ Performance Warning: ${metric.name}`, warningMessage);
  }
}

/**
 * メトリクス別の改善提案メッセージ
 */
function getWarningMessage(metric: VitalMetric): string {
  switch (metric.name) {
    case 'LCP':
      return `LCP is ${metric.value}ms (target: <2500ms). Consider optimizing images, removing unused JavaScript, or implementing lazy loading.`;
    case 'INP':
      return `INP is ${metric.value}ms (target: <200ms). Consider optimizing JavaScript interactions, reducing main thread blocking, or using event delegation.`;
    case 'CLS':
      return `CLS is ${metric.value} (target: <0.1). Consider setting dimensions for images/videos, avoiding injecting content above existing content, or using transform animations.`;
    case 'FCP':
      return `FCP is ${metric.value}ms (target: <1800ms). Consider optimizing fonts, eliminating render-blocking resources, or improving server response times.`;
    case 'TTFB':
      return `TTFB is ${metric.value}ms (target: <800ms). Consider optimizing server performance, using a CDN, or implementing caching strategies.`;
    default:
      return `Performance metric ${metric.name} needs improvement.`;
  }
}

/**
 * Web Vitals レポーターコンポーネント
 */
export default function WebVitalsReporter() {
  useEffect(() => {
    // メトリクス収集関数
    const handleMetric = (metric: any) => {
      const vitalMetric: VitalMetric = {
        name: metric.name,
        value: metric.value,
        rating: getRating(metric.name, metric.value),
        id: metric.id,
        delta: metric.delta
      };
      
      // 分析サービスに送信
      sendToAnalytics(vitalMetric);
      
      // 開発環境でのパフォーマンス警告
      showPerformanceWarning(vitalMetric);
    };

    // Core Web Vitals の監視を開始
    onCLS(handleMetric);
    onINP(handleMetric);
    onLCP(handleMetric);
    
    // その他の有用なメトリクス
    onFCP(handleMetric);
    onTTFB(handleMetric);

    // ページアンロード時の最終レポート
    const handleBeforeUnload = () => {
      // ナビゲーション情報の記録
      if ('navigator' in window && 'sendBeacon' in navigator) {
        const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigationTiming) {
          const timingData = {
            url: window.location.href,
            loadTime: navigationTiming.loadEventEnd - navigationTiming.loadEventStart,
            domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart,
            timeToInteractive: navigationTiming.loadEventEnd - navigationTiming.fetchStart,
            timestamp: Date.now()
          };
          
          navigator.sendBeacon('/api/analytics/page-timing', JSON.stringify(timingData));
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // このコンポーネントは何もレンダリングしない
  return null;
}

/**
 * パフォーマンス監視フック
 */
export function usePerformanceMonitoring() {
  useEffect(() => {
    // Resource Timing API を使用してリソースの読み込み時間を監視
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // 遅いリソースの警告
          if (resourceEntry.duration > 1000) {
            console.warn(`🐌 Slow resource: ${resourceEntry.name} (${resourceEntry.duration.toFixed(2)}ms)`);
          }
          
          // 大きなリソースの警告
          if (resourceEntry.transferSize && resourceEntry.transferSize > 1024 * 1024) { // 1MB
            console.warn(`📦 Large resource: ${resourceEntry.name} (${(resourceEntry.transferSize / 1024 / 1024).toFixed(2)}MB)`);
          }
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => {
      observer.disconnect();
    };
  }, []);
}

/**
 * パフォーマンス最適化のヒント表示（開発環境用）
 */
export function PerformanceHints() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const hints = [
      '💡 Performance Tip: Use next/image for automatic image optimization',
      '💡 Performance Tip: Implement lazy loading for components below the fold',
      '💡 Performance Tip: Use dynamic imports for code splitting',
      '💡 Performance Tip: Optimize fonts by preloading critical font files',
      '💡 Performance Tip: Use ISR (Incremental Static Regeneration) for dynamic but cacheable content'
    ];

    const randomHint = hints[Math.floor(Math.random() * hints.length)];
    console.log(randomHint);
  }, []);

  return null;
}

/**
 * リアルタイムパフォーマンス統計
 */
export class PerformanceStats {
  private static metrics: VitalMetric[] = [];
  
  static addMetric(metric: VitalMetric) {
    this.metrics.push(metric);
    
    // 最新100件のみ保持
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }
  
  static getStats() {
    const stats: Record<string, any> = {};
    
    ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'].forEach(metric => {
      const values = this.metrics
        .filter(m => m.name === metric)
        .map(m => m.value);
      
      if (values.length > 0) {
        stats[metric] = {
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
          latest: values[values.length - 1]
        };
      }
    });
    
    return stats;
  }
  
  static reset() {
    this.metrics = [];
  }
}