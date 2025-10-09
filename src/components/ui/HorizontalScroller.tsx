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
        'overflow-x-auto sm:overflow-visible scroll-smooth snap-x snap-mandatory',
        '[-webkit-overflow-scrolling:touch]',
        'px-6 -mx-6 sm:mx-0 sm:px-0',
        'pb-2 sm:pb-0',
        className
      )}
    >
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 justify-start sm:justify-normal items-stretch auto-rows-fr">
        {children}
      </div>
    </div>
  );
}