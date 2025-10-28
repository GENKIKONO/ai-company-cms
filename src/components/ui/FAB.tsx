'use client';

import { useMenu } from './MenuProvider';
import { usePathname } from 'next/navigation';

// Icon components for the toggle
function MenuIcon() {
  return (
    <svg
      className="h-6 w-6 transition-transform duration-200"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="h-6 w-6 transition-transform duration-200 rotate-180"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function FAB() {
  const { open, toggle } = useMenu();
  const pathname = usePathname();
  
  // Hide FAB on admin pages
  if (pathname?.startsWith('/management-console')) {
    return null;
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <button
      type="button"
      aria-label={open ? "メニューを閉じる" : "メニューを開く"}
      aria-expanded={open}
      role="button"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={handleKeyDown}
      className="
        fixed z-[9999]
        bottom-4 right-4 md:bottom-6 md:right-6
        w-12 h-12 md:w-14 md:h-14
        text-white bg-[var(--bg-primary)] hover:bg-[var(--bg-primary-hover)] 
        shadow-xl hover:shadow-2xl border-2 border-white
        rounded-full
        active:scale-95
        grid place-items-center 
        will-change-transform
        transition-all duration-200
        focus:outline-none 
        focus:ring-2 focus:ring-blue-300 focus:ring-offset-2
        leading-none
        select-none
        lg:hidden
        transform-gpu
      "
    >
      <span className="sr-only">
        {open ? "メニューを閉じる" : "メニューを開く"}
      </span>
      
      {/* SVGでアイコンを厳密センタリング */}
      {open ? (
        <svg className="block" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg className="block" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  );
}