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
        ui-fab
        fixed z-[1000] 
        w-14 h-14 
        rounded-full 
        bg-gradient-to-r from-indigo-500 to-fuchsia-500 
        text-white 
        active:scale-95
        grid place-items-center 
        will-change-transform
        transition-all duration-200
        focus:outline-none 
        focus:ring-2 
        focus:ring-indigo-400 
        focus:ring-opacity-75
        focus:ring-offset-2
        focus:ring-offset-white
        leading-none
        select-none
      "
      style={{
        right: 'clamp(16px, 3vw, 24px)',
        bottom: 'calc(env(safe-area-inset-bottom) + 20px)',
        minHeight: '56px',
        minWidth: '56px'
      }}
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