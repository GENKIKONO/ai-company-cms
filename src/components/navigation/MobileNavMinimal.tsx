"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

/** ラッパー：モバイル判定＆早期returnのみ。ここでHooksは useState/useEffect の2つだけ。 */
export default function MobileNavMinimal() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  if (isMobile === null) return null; // 初回は描画しない（呼ぶHook数は常に2個で一定）
  if (!isMobile) return null;         // PCはDOM自体を出さない

  return <MobileNavMinimalInner />;
}

/** 本体：Hooksは常に同じ順序。早期returnはしない。 */
function MobileNavMinimalInner() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // 背景スクロールロック（open時のみ）※Hookは常に存在
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (open) {
      const prev = root.style.overflow;
      root.style.overflow = "hidden";
      return () => { root.style.overflow = prev; };
    }
  }, [open, mounted]);

  // Escで閉じる（Hookは常に存在）
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const Fab = (
    <button
      type="button"
      aria-label={open ? "メニューを閉じる" : "メニューを開く"}
      aria-expanded={open}
      aria-controls="mobile-drawer"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v); }}
      className="fixed bottom-4 right-4 z-60 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--aio-primary)] text-white shadow-lg hover:bg-[var(--aio-primary-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--aio-info)]"
    >
      {open ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  );

  const Overlay = (
    <div
      className={`fixed inset-0 z-40 transition-opacity ${open ? "opacity-100 pointer-events-auto bg-black/40" : "opacity-0 pointer-events-none"}`}
      aria-hidden="true"
      onClick={() => setOpen(false)}
    />
  );

  const Drawer = (
    <nav
      id="mobile-drawer"
      role="navigation"
      aria-label="モバイルメニュー"
      className={`fixed top-0 right-0 z-50 h-screen w-72 max-w-[85vw] bg-white shadow-xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 h-14 border-b">
        <span className="font-semibold">メニュー</span>
        <button className="p-2 rounded hover:bg-gray-100" onClick={() => setOpen(false)} aria-label="閉じる">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <ul className="p-2">
        <li><Link className="block px-4 py-3 hover:bg-gray-50 rounded" href="/">トップ</Link></li>
        <li><Link className="block px-4 py-3 hover:bg-gray-50 rounded" href="/pricing">料金プラン</Link></li>
        <li><Link className="block px-4 py-3 hover:bg-gray-50 rounded" href="/organizations">企業ディレクトリ</Link></li>
        <li><Link className="block px-4 py-3 hover:bg-gray-50 rounded" href="/hearing-service">ヒアリング代行</Link></li>
        <li className="mt-2 border-t"><Link className="block px-4 py-3 hover:bg-gray-50 rounded" href="/auth/login">ログイン</Link></li>
      </ul>
    </nav>
  );

  return (
    <>
      {mounted ? createPortal(Overlay, document.body) : null}
      {mounted ? createPortal(Drawer,  document.body) : null}
      {mounted ? createPortal(Fab,     document.body) : null}
    </>
  );
}