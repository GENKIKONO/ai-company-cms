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
  scrollPaddingInlineStart = '24px',
  scrollPaddingInlineEnd = '24px',
  showHintOnce = false,
}: PropsWithChildren<{
  className?: string; 
  ariaLabel?: string;
  showDots?: boolean;
  showArrowsOnMobile?: boolean;
  scrollPaddingInlineStart?: string;
  scrollPaddingInlineEnd?: string;
  showHintOnce?: boolean;
}>) {
  const ref = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [childrenCount, setChildrenCount] = useState(0);
  
  // Initialize children count
  useEffect(() => {
    if (ref.current) {
      const children = Array.from(ref.current.querySelector('.flex')?.children || []);
      setChildrenCount(children.length);
    }
  }, [children]);

  // Intersection Observer for scroll position tracking
  useEffect(() => {
    if (!ref.current || childrenCount === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let maxIntersectionRatio = 0;
        let activeIndex = 0;
        
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxIntersectionRatio) {
            maxIntersectionRatio = entry.intersectionRatio;
            activeIndex = parseInt(entry.target.getAttribute('data-index') || '0');
          }
        });
        
        if (maxIntersectionRatio > 0) {
          console.log('[HorizontalScroller] Setting index:', activeIndex, 'ratio:', maxIntersectionRatio);
          setCurrentIndex(activeIndex);
        }
      },
      {
        root: ref.current,
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        rootMargin: '0px -10% 0px -10%'
      }
    );

    const children = ref.current.querySelectorAll('[data-index]');
    children.forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [childrenCount]);

  // Scroll event fallback for better tracking
  useEffect(() => {
    const scrollContainer = ref.current;
    if (!scrollContainer || childrenCount === 0) return;

    const handleScroll = () => {
      const containerRect = scrollContainer.getBoundingClientRect();
      const containerCenterX = containerRect.left + containerRect.width / 2;
      
      let closestIndex = 0;
      let closestDistance = Infinity;
      
      scrollContainer.querySelectorAll('[data-index]').forEach((element, index) => {
        const elementRect = element.getBoundingClientRect();
        const elementCenterX = elementRect.left + elementRect.width / 2;
        const distance = Math.abs(containerCenterX - elementCenterX);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      
      console.log('[HorizontalScroller] Scroll fallback setting index:', closestIndex);
      setCurrentIndex(closestIndex);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [childrenCount]);

  const scrollToIndex = (index: number) => {
    if (!ref.current) return;
    
    const targetElement = ref.current.querySelector(`[data-index="${index}"]`) as HTMLElement;
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
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
    <div className="carousel-container relative">
      <div
        ref={ref}
        className={clsx(
          className,
          'carousel-wrapper scroll-smooth snap-x snap-mandatory overflow-y-visible sm:overflow-visible [-webkit-overflow-scrolling:touch] px-6 -mx-6 sm:mx-0 sm:px-0 pb-4 sm:pb-0 pt-6 scrollbar-hide isolate'
        )}
        style={{
          scrollSnapStop: 'normal',
          WebkitOverflowScrolling: 'touch',
          scrollPaddingInlineStart,
          scrollPaddingInlineEnd,
        }}
        aria-label={ariaLabel}
        role="region"
      >
      <div className="carousel-content flex sm:grid gap-4 sm:gap-6 items-stretch min-h-fit sm:grid-cols-2 lg:grid-cols-3 justify-start sm:justify-normal auto-rows-fr">
        {Array.isArray(children) 
          ? children.map((child, index) => (
              <div key={index} data-index={index} className="carousel-item snap-card">
                {child}
              </div>
            ))
          : <div data-index={0} className="carousel-item snap-card">{children}</div>
        }
      </div>

      {/* Mobile-only navigation */}
      <div className="sm:hidden">
        {/* Navigation arrows */}
        {showArrowsOnMobile && childrenCount > 1 && (
          <>
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              aria-label="前のページ"
              className={clsx(
                'carousel-nav carousel-nav-prev hit-44',
                'absolute left-2 top-1/2 -translate-y-1/2 z-10',
                'w-11 h-11 rounded-full bg-white shadow-lg border border-gray-200',
                'flex items-center justify-center',
                'transition-all duration-300',
                currentIndex === 0
                  ? 'opacity-30 cursor-not-allowed'
                  : 'opacity-80 hover:opacity-100 active:scale-95 hover:shadow-xl'
              )}
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            
            <button
              onClick={goToNext}
              disabled={currentIndex === childrenCount - 1}
              aria-label="次のページ"
              className={clsx(
                'carousel-nav carousel-nav-next hit-44',
                'absolute right-2 top-1/2 -translate-y-1/2 z-10',
                'w-11 h-11 rounded-full bg-white shadow-lg border border-gray-200',
                'flex items-center justify-center',
                'transition-all duration-300',
                currentIndex === childrenCount - 1
                  ? 'opacity-30 cursor-not-allowed'
                  : 'opacity-80 hover:opacity-100 active:scale-95 hover:shadow-xl'
              )}
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}
      </div>
      </div>
      
      {/* Dots indicator - positioned at bottom center */}
      {showDots && childrenCount > 1 && (
        <div className="carousel-dots sm:hidden flex justify-center mt-6 gap-2" role="tablist" aria-label="ページインジケーター">
          {Array.from({ length: childrenCount }).map((_, index) => (
            <button
              key={index}
              role="tab"
              aria-selected={currentIndex === index}
              aria-label={`${index + 1}ページ目`}
              onClick={() => scrollToIndex(index)}
              className={clsx(
                'carousel-dot hit-44 rounded-full transition-all duration-300',
                'w-2.5 h-2.5 flex items-center justify-center',
                currentIndex === index
                  ? 'bg-blue-600 scale-125'
                  : 'bg-gray-300 hover:bg-gray-400'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}