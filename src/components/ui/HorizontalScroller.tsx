'use client';

import { PropsWithChildren, useRef } from 'react';
import clsx from 'clsx';

export default function HorizontalScroller({
  children, 
  className, 
  ariaLabel,
}: PropsWithChildren<{
  className?: string; 
  ariaLabel?: string;
}>) {
  const ref = useRef<HTMLDivElement>(null);
  
  return (
    <div
      ref={ref}
      aria-label={ariaLabel || '横スクロールリスト'}
      role="region"
      className={clsx(
        'overflow-x-auto overflow-y-visible sm:overflow-visible scroll-smooth snap-x snap-mandatory',
        '[-webkit-overflow-scrolling:touch]',
        'px-6 -mx-6 sm:mx-0 sm:px-0',
        'pb-4 sm:pb-0 pt-6', // Add top padding for badge space
        // Enhanced mobile scroll behavior
        'overscroll-x-contain',
        'scrollbar-hide',
        'isolate', // Create stacking context for z-index
        className
      )}
      style={{
        // Ensure natural snap behavior
        scrollSnapStop: 'normal',
        // Better mobile scroll momentum
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div className={clsx(
        'flex sm:grid gap-4 sm:gap-6 justify-start sm:justify-normal items-stretch',
        'min-h-fit',
        // Dynamic grid based on className prop
        className?.includes('md:grid-cols-4') ? 'sm:grid-cols-2 md:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3',
        // Ensure equal height cards
        'auto-rows-fr'
      )}>
        {children}
      </div>
    </div>
  );
}