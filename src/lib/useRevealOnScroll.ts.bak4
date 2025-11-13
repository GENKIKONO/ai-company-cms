/**
 * スクロール連動で要素を段階的に表示するフック (最適化版)
 * SSR対応・軽量・アクセシビリティ配慮・debounce処理追加
 */
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseRevealOnScrollOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  debounceMs?: number;
}

// グローバルObserver管理で性能向上
const globalObserverMap = new Map<string, IntersectionObserver>();

export function useRevealOnScroll({
  threshold = 0.1,
  rootMargin = '0px 0px -50px 0px',
  triggerOnce = true,
  debounceMs = 100
}: UseRevealOnScrollOptions = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedSetVisible = useCallback((visible: boolean) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(visible);
    }, debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    // SSRガード
    if (typeof window === 'undefined') return;

    const element = ref.current;
    if (!element) return;

    // ユーザーがreduced motionを設定している場合は即座に表示
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    // IntersectionObserver対応チェック
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    // Observer設定のキー生成
    const observerKey = `${threshold}-${rootMargin}-${triggerOnce}`;
    
    let observer = globalObserverMap.get(observerKey);
    
    if (!observer) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const target = entry.target as HTMLElement & {
              _revealCallback?: (visible: boolean) => void;
            };
            
            if (target._revealCallback) {
              if (entry.isIntersecting) {
                target._revealCallback(true);
                if (triggerOnce) {
                  observer!.unobserve(target);
                }
              } else if (!triggerOnce) {
                target._revealCallback(false);
              }
            }
          });
        },
        {
          threshold,
          rootMargin
        }
      );
      
      globalObserverMap.set(observerKey, observer);
    }

    // コールバック設定
    (element as any)._revealCallback = debouncedSetVisible;
    
    observer.observe(element);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      const currentObserver = globalObserverMap.get(observerKey);
      if (currentObserver && element) {
        currentObserver.unobserve(element);
        delete (element as any)._revealCallback;
      }
    };
  }, [threshold, rootMargin, triggerOnce, debouncedSetVisible]);

  return { ref, isVisible };
}