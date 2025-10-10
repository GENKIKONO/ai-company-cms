'use client';

import { useMenu } from './MenuProvider';

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
        sm:hidden
        fixed z-[60] 
        h-14 w-14 
        rounded-full 
        right-[clamp(12px,3vw,20px)] 
        bottom-[calc(env(safe-area-inset-bottom)+16px)]
        bg-gradient-to-r from-indigo-500 to-fuchsia-500 
        text-white 
        shadow-lg shadow-indigo-500/25
        hover:shadow-xl hover:shadow-indigo-500/40
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
      "
      style={{
        // Ensure proper touch target size
        minHeight: '44px',
        minWidth: '44px'
      }}
    >
      <span className="sr-only">
        {open ? "メニューを閉じる" : "メニューを開く"}
      </span>
      
      {/* SVGでアイコンを厳密センタリング */}
      {open ? (
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  );
}