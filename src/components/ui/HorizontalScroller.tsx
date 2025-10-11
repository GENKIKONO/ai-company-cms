'use client';

import { PropsWithChildren, useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export default function HorizontalScroller({
  children, 
  className, 
  ariaLabel,
  showDots = true,
  showArrowsOnMobile = true,
  showHintOnce = true,
  scrollPaddingInlineStart = '24px',
  scrollPaddingInlineEnd = '24px',
}: PropsWithChildren<{
  className?: string; 
  ariaLabel?: string;
  showDots?: boolean;
  showArrowsOnMobile?: boolean;
  showHintOnce?: boolean;
  scrollPaddingInlineStart?: string;
  scrollPaddingInlineEnd?: string;
}>) {
  const ref = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [childrenCount, setChildrenCount] = useState(0);
  
  // Initialize children count and hint display
  useEffect(() => {
    if (ref.current) {
      const children = Array.from(ref.current.querySelector('.flex')?.children || []);
      setChildrenCount(children.length);
      
      // Show hint only on mobile and if not shown before
      if (showHintOnce && window.innerWidth < 640) {
        const hintKey = ariaLabel === 'ヒアリング代行の流れ' ? 'hs-flow-hint' : 'hs-hint';
        const hasSeenHint = localStorage.getItem(hintKey);
        if (!hasSeenHint) {
          setShowHint(true);
        }
      }
    }
  }, [children, showHintOnce, ariaLabel]);

  // Intersection Observer for scroll position tracking
  useEffect(() => {
    if (!ref.current || childrenCount === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setCurrentIndex(index);
          }
        });
      },
      {
        root: ref.current,
        threshold: 0.5,
        rootMargin: '0px'
      }
    );

    const childElements = ref.current.querySelectorAll('[data-index]');
    childElements.forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [childrenCount]);

  // Handle hint dismissal
  const dismissHint = () => {
    setShowHint(false);
    const hintKey = ariaLabel === 'ヒアリング代行の流れ' ? 'hs-flow-hint' : 'hs-hint';
    localStorage.setItem(hintKey, 'seen');
  };

  // Navigation functions
  const scrollToIndex = (index: number) => {
    if (!ref.current) return;
    const child = ref.current.querySelector(`[data-index="${index}"]`) as HTMLElement;
    if (child) {
      child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const goToPrevious = () => {
    const newIndex = Math.max(0, currentIndex - 1);
    scrollToIndex(newIndex);
  };

  const goToNext = () => {
    const newIndex = Math.min(childrenCount - 1, currentIndex + 1);
    scrollToIndex(newIndex);
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        aria-label={ariaLabel || '横スクロールリスト'}
        role="region"
        className={clsx(
          'carousel-inline no-inline-overflow scroll-smooth snap-x snap-mandatory',
          'overflow-y-visible sm:overflow-visible',
          '[-webkit-overflow-scrolling:touch]',
          'px-6 -mx-6 sm:mx-0 sm:px-0',
          'pb-4 sm:pb-0 pt-6', // Add top padding for badge space
          'scrollbar-hide',
          'isolate', // Create stacking context for z-index
          className
        )}
        style={{
          // Ensure natural snap behavior
          scrollSnapStop: 'normal',
          // Better mobile scroll momentum
          WebkitOverflowScrolling: 'touch',
          // Custom scroll padding for cleaner edges
          scrollPaddingInlineStart,
          scrollPaddingInlineEnd,
        }}
      >
      <div className={clsx(
        'flex sm:grid gap-4 sm:gap-6 items-stretch',
        'min-h-fit',
        // Dynamic grid based on className prop with centering for 2-column layouts
        className?.includes('lg:grid-cols-2') 
          ? 'sm:grid-cols-1 lg:grid-cols-2 justify-center sm:justify-center'
          : className?.includes('md:grid-cols-4') 
            ? 'sm:grid-cols-2 md:grid-cols-4 justify-start sm:justify-normal'
            : 'sm:grid-cols-2 lg:grid-cols-3 justify-start sm:justify-normal',
        // Ensure equal height cards
        'auto-rows-fr'
      )}>
        {Array.isArray(children) 
          ? children.map((child, index) => (
              <div key={index} data-index={index} className="contents">
                {child}
              </div>
            ))
          : <div data-index={0} className="contents">{children}</div>
        }
      </div>

      {/* Mobile-only swipe affordance */}
      <div className="sm:hidden">
        {/* Navigation arrows */}
        {showArrowsOnMobile && childrenCount > 1 && (
          <>
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              aria-label="前のページ"
              className={clsx(
                'absolute left-2 top-1/2 -translate-y-1/2 z-10',
                'w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-lg',
                'flex items-center justify-center',
                'transition-all duration-300',
                currentIndex === 0
                  ? 'opacity-30 cursor-not-allowed'
                  : 'opacity-70 hover:opacity-100 active:scale-95'
              )}
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            
            <button
              onClick={goToNext}
              disabled={currentIndex === childrenCount - 1}
              aria-label="次のページ"
              className={clsx(
                'absolute right-2 top-1/2 -translate-y-1/2 z-10',
                'w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-lg',
                'flex items-center justify-center',
                'transition-all duration-300',
                currentIndex === childrenCount - 1
                  ? 'opacity-30 cursor-not-allowed'
                  : 'opacity-70 hover:opacity-100 active:scale-95'
              )}
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}

        {/* First-time hint */}
        {showHint && (
          <div className="absolute inset-x-0 bottom-4 z-20 px-4">
            <div className="bg-blue-600 text-white rounded-lg p-3 shadow-lg animate-fade-in">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  <span className="text-sm font-medium">横にスワイプして他の項目も見れます</span>
                </div>
                <button
                  onClick={dismissHint}
                  aria-label="ヒントを閉じる"
                  className="text-white/80 hover:text-white p-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
      
      {/* Dots indicator - always positioned outside scroller */}
      {showDots && childrenCount > 1 && (
        <div className="sm:hidden absolute left-1/2 -translate-x-1/2 bottom-4 z-[900] flex gap-2" role="tablist" aria-label="ページインジケーター">
          {Array.from({ length: childrenCount }).map((_, index) => (
            <button
              key={index}
              role="tab"
              aria-selected={currentIndex === index}
              aria-label={`${index + 1}ページ目`}
              onClick={() => scrollToIndex(index)}
              className={clsx(
                'w-2 h-2 rounded-full transition-all duration-300',
                'opacity-60 hover:opacity-100', // Persistent fade effect
                currentIndex === index
                  ? 'bg-blue-600 w-6 opacity-100'
                  : 'bg-gray-300 hover:bg-gray-400'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}