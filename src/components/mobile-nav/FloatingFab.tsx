// src/components/mobile-nav/FloatingFab.tsx
'use client';
import { useEffect, useState } from 'react';
import { useMobileNav } from './useMobileNav';

function BurgerIcon({ open }: { open: boolean }) {
  // アイコンは className だけで制御（style直指定は使わない）
  return (
    <span aria-hidden className="block relative w-5 h-5">
      <span className={`absolute left-0 w-5 h-[2px] bg-white transition-transform ${open ? 'top-2.5 rotate-45' : 'top-1'}`}/>
      <span className={`absolute left-0 w-5 h-[2px] bg-white transition-opacity ${open ? 'opacity-0' : 'top-2.5 opacity-100'}`}/>
      <span className={`absolute left-0 w-5 h-[2px] bg-white transition-transform ${open ? 'top-2.5 -rotate-45' : 'top-4'}`}/>
    </span>
  );
}

export default function FloatingFab() {
  const { isOpen, toggle } = useMobileNav();
  const [show, setShow] = useState(false);

  // モバイルのみ表示（初期マウント時に判定）
  useEffect(() => {
    const onResize = () => setShow(window.innerWidth < 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
      aria-expanded={isOpen}
      className="
        fixed z-[60]
        rounded-full bg-[#1677FF] text-white shadow-xl
        w-14 h-14
        right-[calc(env(safe-area-inset-right,0)+16px)]
        bottom-[calc(env(safe-area-inset-bottom,0)+20px)]
        translate-x-[-6px]  /* 右端から少し左へ＝押しやすく */
        flex items-center justify-center
        active:scale-95 transition
      "
    >
      <BurgerIcon open={isOpen} />
    </button>
  );
}