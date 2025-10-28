'use client';

import { useMenu } from './MenuProvider';
import { usePathname } from 'next/navigation';

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
        transform-gpu
      "
      style={{
        // ユーザー指定の位置: 右下より少し左上
        right: `calc(16px + env(safe-area-inset-right))`,
        bottom: `calc(24px + env(safe-area-inset-bottom))`,
        width: 64, 
        height: 64,
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