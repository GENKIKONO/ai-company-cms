/**
 * React Monitoring Hooks
 * 要件定義準拠: フロントエンド監視、エラーバウンダリ、パフォーマンス計測
 */

import React from 'react';
import { logger, errorMonitor, performanceMonitor, ErrorCategory, LogLevel } from './index';

// エラーバウンダリ Hook
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const captureError = React.useCallback((error: Error, category: ErrorCategory = ErrorCategory.SYSTEM) => {
    setError(error);
    errorMonitor.captureError(error, category);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  // コンポーネントエラーをキャッチ
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError, hasError: !!error };
}

// パフォーマンス計測 Hook
export function usePerformanceTracking(name: string) {
  const startTimeRef = React.useRef<number>();

  React.useEffect(() => {
    startTimeRef.current = performance.now();
    
    return () => {
      if (startTimeRef.current) {
        const duration = performance.now() - startTimeRef.current;
        logger.info(`Performance: ${name}`, {
          name,
          duration: Math.round(duration),
          timestamp: new Date().toISOString(),
        });
      }
    };
  }, [name]);

  const mark = React.useCallback((markName: string) => {
    if (startTimeRef.current) {
      const duration = performance.now() - startTimeRef.current;
      logger.debug(`Performance mark: ${name} - ${markName}`, {
        name,
        markName,
        duration: Math.round(duration),
      });
    }
  }, [name]);

  return { mark };
}

// API呼び出し監視 Hook
export function useApiMonitoring() {
  const trackApiCall = React.useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string,
    options: {
      category?: ErrorCategory;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      logger.debug(`API call started: ${endpoint}`, { endpoint });
      
      const result = await apiCall();
      
      const duration = performance.now() - startTime;
      logger.info(`API call succeeded: ${endpoint}`, {
        endpoint,
        duration: Math.round(duration),
        ...options.metadata,
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      errorMonitor.captureError(
        error instanceof Error ? error : new Error(String(error)),
        options.category || ErrorCategory.EXTERNAL_API,
        {
          endpoint,
          duration: Math.round(duration),
          ...options.metadata,
        }
      );
      
      throw error;
    }
  }, []);

  return { trackApiCall };
}

// ユーザー行動追跡 Hook
export function useUserTracking() {
  const trackEvent = React.useCallback((
    eventName: string,
    properties?: Record<string, any>
  ) => {
    logger.info(`User event: ${eventName}`, {
      event: eventName,
      properties,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    });
  }, []);

  const trackPageView = React.useCallback((
    pageName?: string,
    properties?: Record<string, any>
  ) => {
    const page = pageName || (typeof window !== 'undefined' ? window.location.pathname : 'unknown');
    
    // ページビュー数を増加
    if (typeof window !== 'undefined') {
      const currentViews = parseInt(sessionStorage.getItem('pageViews') || '0', 10);
      sessionStorage.setItem('pageViews', String(currentViews + 1));
    }
    
    logger.info(`Page view: ${page}`, {
      page,
      properties,
      timestamp: new Date().toISOString(),
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    });
  }, []);

  return { trackEvent, trackPageView };
}

// フォーム監視 Hook
export function useFormMonitoring(formName: string) {
  const { trackEvent } = useUserTracking();
  const { captureError } = useErrorBoundary();
  
  const trackFormStart = React.useCallback(() => {
    trackEvent('form_started', { formName });
  }, [formName, trackEvent]);

  const trackFormSubmit = React.useCallback((success: boolean, errors?: string[]) => {
    trackEvent('form_submitted', {
      formName,
      success,
      errors,
      errorCount: errors?.length || 0,
    });
  }, [formName, trackEvent]);

  const trackFormError = React.useCallback((error: Error, fieldName?: string) => {
    captureError(error, ErrorCategory.USER_INPUT);
    trackEvent('form_error', {
      formName,
      fieldName,
      errorMessage: error.message,
    });
  }, [formName, trackEvent, captureError]);

  const trackFieldFocus = React.useCallback((fieldName: string) => {
    trackEvent('form_field_focus', { formName, fieldName });
  }, [formName, trackEvent]);

  return {
    trackFormStart,
    trackFormSubmit,
    trackFormError,
    trackFieldFocus,
  };
}

// レンダリング監視 Hook
export function useRenderTracking(componentName: string) {
  const renderCountRef = React.useRef(0);
  const lastRenderTimeRef = React.useRef<number>();

  React.useEffect(() => {
    renderCountRef.current += 1;
    const currentTime = performance.now();
    
    if (lastRenderTimeRef.current) {
      const timeSinceLastRender = currentTime - lastRenderTimeRef.current;
      
      // 過度な再レンダリングを検出
      if (timeSinceLastRender < 16) { // 60fps以上の再レンダリング
        logger.warn(`High frequency re-render detected: ${componentName}`, {
          componentName,
          renderCount: renderCountRef.current,
          timeSinceLastRender: Math.round(timeSinceLastRender),
        });
      }
    }
    
    lastRenderTimeRef.current = currentTime;
    
    // 開発環境でのデバッグ情報
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Component render: ${componentName}`, {
        componentName,
        renderCount: renderCountRef.current,
      });
    }
  });

  return {
    renderCount: renderCountRef.current,
  };
}

// Web Vitals 監視 Hook
export function useWebVitalsTracking() {
  React.useEffect(() => {
    // Lazy load web-vitals
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      const handleVitals = (metric: any) => {
        performanceMonitor.recordWebVitals({
          name: metric.name,
          value: metric.value,
          delta: metric.delta,
          id: metric.id,
          rating: metric.rating,
        });
      };

      onCLS(handleVitals);
      onINP(handleVitals);
      onFCP(handleVitals);
      onLCP(handleVitals);
      onTTFB(handleVitals);
    }).catch((error) => {
      logger.warn('Failed to load web-vitals', { error: error.message });
    });
  }, []);
}

// 監視用 React Context
interface MonitoringContextType {
  isMonitoringEnabled: boolean;
  logLevel: LogLevel;
  setLogLevel: (level: LogLevel) => void;
}

const MonitoringContext = React.createContext<MonitoringContextType | null>(null);

interface MonitoringProviderProps {
  children: React.ReactNode;
  initialLogLevel?: LogLevel;
}

export function MonitoringProvider({ 
  children, 
  initialLogLevel = LogLevel.INFO 
}: MonitoringProviderProps) {
  const [logLevel, setLogLevel] = React.useState(initialLogLevel);
  const [isMonitoringEnabled] = React.useState(
    process.env.NODE_ENV === 'production' || process.env.ENABLE_MONITORING === 'true'
  );

  // Web Vitals追跡を有効化
  useWebVitalsTracking();

  const contextValue: MonitoringContextType = {
    isMonitoringEnabled,
    logLevel,
    setLogLevel,
  };

  return React.createElement(
    MonitoringContext.Provider,
    { value: contextValue },
    children
  );
}

export function useMonitoring() {
  const context = React.useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoring must be used within MonitoringProvider');
  }
  return context;
}