// src/components/mobile-nav/SideOverlay.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { resolveMenu } from './menu.config';
import { useBodyScrollLock, useMobileNav } from './useMobileNav';

export default function SideOverlay() {
  const pathname = usePathname();
  const menu = resolveMenu(pathname);
  const { isOpen, close } = useMobileNav();

  useBodyScrollLock(isOpen);

  // 背景クリックで閉じる
  return (
    <>
      {/* 背景 */}
      <div
        aria-hidden
        onClick={close}
        className={`fixed inset-0 z-[55] bg-black/40 transition-opacity ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      {/* パネル */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="サイドナビゲーション"
        className={`
          fixed z-[56] top-0 right-0 h-svh w-[84vw] max-w-[360px]
          bg-white shadow-2xl
          transition-transform duration-200
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}
      >
        <nav className="flex-1 overflow-y-auto pt-14 pb-8">
          <ul className="space-y-2">
            {menu.map((m) => {
              const active = pathname === m.href;
              return (
                <li key={m.href}>
                  <Link
                    href={m.href}
                    onClick={close}
                    className={`block px-6 py-4 text-lg ${active ? 'font-semibold text-gray-900' : 'text-gray-700 hover:text-gray-900'}`}
                  >
                    {m.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t px-6 py-4 text-xs text-gray-500">
          © {new Date().getFullYear()} AIO Hub
        </div>
      </aside>
    </>
  );
}