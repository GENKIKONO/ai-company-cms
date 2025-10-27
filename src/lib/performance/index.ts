/**
 * Performance Optimization Utilities
 * 要件定義準拠: パフォーマンス最適化、Core Web Vitals改善
 */

import React from 'react';
import { logger } from '@/lib/utils/logger';

// Web Vitals Monitoring Types
export interface WebVitalsData {
  name: string;
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

// Performance Observer for Custom Metrics
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Monitor Long Tasks
  observeLongTasks(callback: (entries: PerformanceEntry[]) => void) {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      callback(list.getEntries());
    });

    try {
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (e) {
      logger.warn('Long task observation not supported');
    }
  }

  // Monitor Layout Shifts
  observeLayoutShifts(callback: (entries: PerformanceEntry[]) => void) {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      callback(list.getEntries());
    });

    try {
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (e) {
      logger.warn('Layout shift observation not supported');
    }
  }

  // Monitor Resource Loading
  observeResources(callback: (entries: PerformanceEntry[]) => void) {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      callback(list.getEntries());
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (e) {
      logger.warn('Resource observation not supported');
    }
  }

  // Clean up observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Debounce Hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle Hook
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastRan = React.useRef<number>(Date.now());

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

// Intersection Observer Hook for Lazy Loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLElement>, boolean] {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [options]);

  return [ref, isIntersecting];
}

// Virtual Scrolling Hook
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
}

// Image Optimization Utilities
export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  sizes?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const createOptimizedImageUrl = (
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  } = {}
): string => {
  if (!src.startsWith('/')) return src;

  const params = new URLSearchParams();
  
  if (options.width) params.set('w', options.width.toString());
  if (options.height) params.set('h', options.height.toString());
  if (options.quality) params.set('q', options.quality.toString());
  if (options.format) params.set('f', options.format);

  return `/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`;
};

// Bundle Analysis Utilities
export const measureBundleSize = () => {
  if (typeof window === 'undefined') return;

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  const jsResources = resources.filter(resource => 
    resource.name.includes('.js') && !resource.name.includes('hot-update')
  );

  const totalJSSize = jsResources.reduce((total, resource) => {
    return total + (resource.transferSize || 0);
  }, 0);

  return {
    navigationTiming: navigation,
    jsResources,
    totalJSSize: Math.round(totalJSSize / 1024), // KB
    pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
  };
};

// Code Splitting Utilities
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(importFunc);
  
  const LazyWrapper = React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {
    return React.createElement(React.Suspense, {
      fallback: fallback ? React.createElement(fallback) : React.createElement('div', null, 'Loading...')
    }, React.createElement(LazyComponent as any, { ...props, ref }));
  });
  
  LazyWrapper.displayName = 'LazyWrapper';
  
  return LazyWrapper;
};

// Memory Management
export const useMemoryOptimization = () => {
  const cleanup = React.useCallback(() => {
    // Clear unused objects
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
    }
  }, []);

  React.useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { cleanup };
};

// Performance Timing Hook
export const usePerformanceTiming = (name: string) => {
  React.useEffect(() => {
    performance.mark(`${name}-start`);

    return () => {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    };
  }, [name]);
};