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
      className={clsx(
        'overflow-x-auto sm:overflow-visible',
        'motion-reduce:scroll-auto scroll-smooth snap-x snap-mandatory',
        '[-webkit-overflow-scrolling:touch]',
        'px-4 -mx-4 sm:mx-0 sm:px-0',
        className
      )}
      ref={ref}
      aria-label={ariaLabel || '横スクロールリスト'}
      role="region"
    >
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {children}
      </div>
    </div>
  );
}