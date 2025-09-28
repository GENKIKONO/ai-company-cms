/**
 * パフォーマンス監視ユーティリティ (I2)
 * Web Vitals、リソース読み込み、ユーザー体験の測定
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  
  // その他の重要メトリクス
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // カスタムメトリクス
  domReady?: number;
  loadComplete?: number;
  
  // リソースメトリクス
  resourceCount?: number;
  resourceSize?: number;
  
  // ユーザー体験
  pageLoadTime?: number;
  timeToInteractive?: number;
}

export interface ResourceTiming {
  name: string;
  size: number;
  duration: number;
  type: string;
  startTime: number;
  endTime: number;
}

/**
 * Core Web Vitals測定
 */
export class WebVitalsMonitor {
  private metrics: PerformanceMetrics = {};
  private callbacks: Array<(metrics: PerformanceMetrics) => void> = [];

  constructor() {
    this.initializeWebVitals();
  }

  private initializeWebVitals() {
    if (typeof window === 'undefined') return;

    // LCP (Largest Contentful Paint)
    this.observeLCP();
    
    // FID (First Input Delay)
    this.observeFID();
    
    // CLS (Cumulative Layout Shift)
    this.observeCLS();
    
    // FCP (First Contentful Paint)
    this.observeFCP();
    
    // TTFB (Time to First Byte)
    this.observeTTFB();

    // その他のメトリクス
    this.observeOtherMetrics();
  }

  private observeLCP() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
        renderTime?: number;
        loadTime?: number;
      };

      if (lastEntry) {
        this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime;
        this.notifyCallbacks();
      }
    });

    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      console.warn('LCP observation failed:', error);
    }
  }

  private observeFID() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-input') {
          const fidEntry = entry as PerformanceEntry & { processingStart: number };
          this.metrics.fid = fidEntry.processingStart - entry.startTime;
          this.notifyCallbacks();
        }
      });
    });

    try {
      observer.observe({ type: 'first-input', buffered: true });
    } catch (error) {
      console.warn('FID observation failed:', error);
    }
  }

  private observeCLS() {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: any[] = [];

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          const firstSessionEntry = sessionEntries[0];
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

          if (sessionValue && 
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000) {
            sessionValue += entry.value;
            sessionEntries.push(entry);
          } else {
            sessionValue = entry.value;
            sessionEntries = [entry];
          }

          if (sessionValue > clsValue) {
            clsValue = sessionValue;
            this.metrics.cls = clsValue;
            this.notifyCallbacks();
          }
        }
      });
    });

    try {
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      console.warn('CLS observation failed:', error);
    }
  }

  private observeFCP() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime;
          this.notifyCallbacks();
        }
      });
    });

    try {
      observer.observe({ type: 'paint', buffered: true });
    } catch (error) {
      console.warn('FCP observation failed:', error);
    }
  }

  private observeTTFB() {
    if (!window.performance || !window.performance.timing) return;

    const timing = window.performance.timing;
    this.metrics.ttfb = timing.responseStart - timing.requestStart;
    this.notifyCallbacks();
  }

  private observeOtherMetrics() {
    if (typeof window === 'undefined') return;

    // DOM Ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.metrics.domReady = performance.now();
        this.notifyCallbacks();
      });
    } else {
      this.metrics.domReady = 0;
    }

    // Load Complete
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        this.metrics.loadComplete = performance.now();
        this.notifyCallbacks();
      });
    } else {
      this.metrics.loadComplete = 0;
    }

    // Page Load Time
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
        this.notifyCallbacks();
      }
    });
  }

  private notifyCallbacks() {
    this.callbacks.forEach(callback => {
      try {
        callback(this.metrics);
      } catch (error) {
        console.error('Performance callback error:', error);
      }
    });
  }

  public onMetric(callback: (metrics: PerformanceMetrics) => void) {
    this.callbacks.push(callback);
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getWebVitalsScore(): { score: number; rating: 'good' | 'needs-improvement' | 'poor' } {
    const { lcp, fid, cls } = this.metrics;
    
    let score = 0;
    let count = 0;

    // LCP scoring (0-2500ms = good, 2500-4000ms = needs improvement, >4000ms = poor)
    if (lcp !== undefined) {
      if (lcp <= 2500) score += 100;
      else if (lcp <= 4000) score += 50;
      else score += 0;
      count++;
    }

    // FID scoring (0-100ms = good, 100-300ms = needs improvement, >300ms = poor)
    if (fid !== undefined) {
      if (fid <= 100) score += 100;
      else if (fid <= 300) score += 50;
      else score += 0;
      count++;
    }

    // CLS scoring (0-0.1 = good, 0.1-0.25 = needs improvement, >0.25 = poor)
    if (cls !== undefined) {
      if (cls <= 0.1) score += 100;
      else if (cls <= 0.25) score += 50;
      else score += 0;
      count++;
    }

    const finalScore = count > 0 ? score / count : 0;
    
    let rating: 'good' | 'needs-improvement' | 'poor';
    if (finalScore >= 75) rating = 'good';
    else if (finalScore >= 50) rating = 'needs-improvement';
    else rating = 'poor';

    return { score: finalScore, rating };
  }
}

/**
 * リソース読み込み監視
 */
export class ResourceMonitor {
  private resources: ResourceTiming[] = [];

  constructor() {
    this.initializeResourceObserver();
  }

  private initializeResourceObserver() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          this.resources.push({
            name: resource.name,
            size: resource.transferSize || 0,
            duration: resource.duration,
            type: this.getResourceType(resource.name),
            startTime: resource.startTime,
            endTime: resource.responseEnd
          });
        }
      });
    });

    try {
      observer.observe({ type: 'resource', buffered: true });
    } catch (error) {
      console.warn('Resource observation failed:', error);
    }
  }

  private getResourceType(url: string): string {
    if (/\.(css)$/i.test(url)) return 'stylesheet';
    if (/\.(js|mjs)$/i.test(url)) return 'script';
    if (/\.(png|jpg|jpeg|gif|webp|avif|svg)$/i.test(url)) return 'image';
    if (/\.(woff|woff2|ttf|otf)$/i.test(url)) return 'font';
    if (/\.(mp4|webm|ogg)$/i.test(url)) return 'video';
    return 'other';
  }

  public getResourceStats(): {
    totalCount: number;
    totalSize: number;
    totalDuration: number;
    byType: Record<string, { count: number; size: number; duration: number }>;
    slowestResources: ResourceTiming[];
  } {
    const byType: Record<string, { count: number; size: number; duration: number }> = {};
    let totalSize = 0;
    let totalDuration = 0;

    this.resources.forEach(resource => {
      totalSize += resource.size;
      totalDuration += resource.duration;

      if (!byType[resource.type]) {
        byType[resource.type] = { count: 0, size: 0, duration: 0 };
      }

      byType[resource.type].count++;
      byType[resource.type].size += resource.size;
      byType[resource.type].duration += resource.duration;
    });

    const slowestResources = [...this.resources]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      totalCount: this.resources.length,
      totalSize,
      totalDuration,
      byType,
      slowestResources
    };
  }
}

/**
 * ユーザー操作監視
 */
export class UserInteractionMonitor {
  private interactions: Array<{
    type: string;
    timestamp: number;
    target: string;
    duration?: number;
  }> = [];

  constructor() {
    this.initializeInteractionObserver();
  }

  private initializeInteractionObserver() {
    if (typeof window === 'undefined') return;

    // クリック監視
    document.addEventListener('click', (event) => {
      this.recordInteraction('click', event.target as Element);
    });

    // フォーム送信監視
    document.addEventListener('submit', (event) => {
      this.recordInteraction('submit', event.target as Element);
    });

    // ページ遷移監視
    window.addEventListener('beforeunload', () => {
      this.recordInteraction('navigation', document.body);
    });
  }

  private recordInteraction(type: string, target: Element) {
    const selector = this.getElementSelector(target);
    this.interactions.push({
      type,
      timestamp: Date.now(),
      target: selector
    });
  }

  private getElementSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  public getInteractionStats(): {
    totalInteractions: number;
    mostInteracted: Array<{ target: string; count: number }>;
    interactionTimeline: Array<{ type: string; timestamp: number; target: string }>;
  } {
    const targetCounts: Record<string, number> = {};

    this.interactions.forEach(interaction => {
      targetCounts[interaction.target] = (targetCounts[interaction.target] || 0) + 1;
    });

    const mostInteracted = Object.entries(targetCounts)
      .map(([target, count]) => ({ target, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalInteractions: this.interactions.length,
      mostInteracted,
      interactionTimeline: [...this.interactions]
    };
  }
}

/**
 * メモリ使用量監視
 */
export class MemoryMonitor {
  public getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
  } | null {
    if (typeof window === 'undefined' || !('performance' in window)) return null;

    const memory = (performance as any).memory;
    if (!memory) return null;

    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
    };
  }

  public startMemoryMonitoring(interval = 30000): () => void {
    const intervalId = setInterval(() => {
      const usage = this.getMemoryUsage();
      if (usage && usage.percentage > 80) {
        console.warn('High memory usage detected:', usage);
      }
    }, interval);

    return () => clearInterval(intervalId);
  }
}

/**
 * 統合パフォーマンス監視クラス
 */
export class PerformanceMonitor {
  private webVitals: WebVitalsMonitor;
  private resources: ResourceMonitor;
  private interactions: UserInteractionMonitor;
  private memory: MemoryMonitor;

  constructor() {
    this.webVitals = new WebVitalsMonitor();
    this.resources = new ResourceMonitor();
    this.interactions = new UserInteractionMonitor();
    this.memory = new MemoryMonitor();
  }

  public getFullReport(): {
    webVitals: PerformanceMetrics;
    webVitalsScore: ReturnType<WebVitalsMonitor['getWebVitalsScore']>;
    resources: ReturnType<ResourceMonitor['getResourceStats']>;
    interactions: ReturnType<UserInteractionMonitor['getInteractionStats']>;
    memory: ReturnType<MemoryMonitor['getMemoryUsage']>;
    timestamp: number;
  } {
    return {
      webVitals: this.webVitals.getMetrics(),
      webVitalsScore: this.webVitals.getWebVitalsScore(),
      resources: this.resources.getResourceStats(),
      interactions: this.interactions.getInteractionStats(),
      memory: this.memory.getMemoryUsage(),
      timestamp: Date.now()
    };
  }

  public onMetricUpdate(callback: (report: ReturnType<PerformanceMonitor['getFullReport']>) => void) {
    this.webVitals.onMetric(() => {
      callback(this.getFullReport());
    });
  }

  public sendToAnalytics(report?: ReturnType<PerformanceMonitor['getFullReport']>) {
    const data = report || this.getFullReport();
    
    // Plausible Analytics に送信
    if (typeof window !== 'undefined' && (window as any).plausible) {
      try {
        (window as any).plausible('Performance', {
          props: {
            lcp: data.webVitals.lcp,
            fid: data.webVitals.fid,
            cls: data.webVitals.cls,
            score: data.webVitalsScore.score,
            rating: data.webVitalsScore.rating
          }
        });
      } catch (error) {
        console.error('Failed to send performance data to Plausible:', error);
      }
    }

    // カスタムAPIエンドポイントに送信
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(() => {
        // エラーは無視（分析データのため）
      });
    }
  }
}

// グローバルインスタンス
export const performanceMonitor = new PerformanceMonitor();