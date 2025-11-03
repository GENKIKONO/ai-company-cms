"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function MobileNavMinimal() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // 背景スクロールロック
  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    const body = document.body;
    if (open) {
      const prevHtml = html.style.overflow;
      const prevBody = body.style.overflow;
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      return () => {
        html.style.overflow = prevHtml;
        body.style.overflow = prevBody;
      };
    }
  }, [open, mounted]);

  // Escで閉じる
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // 右下固定FAB（lg以上では非表示）
  const Fab = (
    <button
      type="button"
      aria-label={open ? "メニューを閉じる" : "メニューを開く"}
      aria-expanded={open}
      aria-controls="mobile-drawer"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
      className="fixed bottom-4 right-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg lg:hidden hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400"
    >
      {/* アイコンはDSに依存せず生のSVG */}
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

  // オーバーレイ＋ドロワー（Portalでbody直下）
  const OverlayAndDrawer = open && mounted ? createPortal(
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />
      <nav
        id="mobile-drawer"
        role="navigation"
        aria-label="モバイルメニュー"
        className={`fixed top-0 right-0 z-50 h-screen w-72 max-w-[85vw] bg-white shadow-xl transition-transform duration-300 ease-out lg:hidden
        ${open ? "translate-x-0" : "translate-x-full"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b">
          <span className="font-semibold">メニュー</span>
          <button
            className="p-2 rounded hover:bg-gray-100"
            onClick={() => setOpen(false)}
            aria-label="閉じる"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <ul className="p-2">
          <li><a className="block px-4 py-3 hover:bg-gray-50 rounded" href="/">トップ</a></li>
          <li><a className="block px-4 py-3 hover:bg-gray-50 rounded" href="/pricing">料金プラン</a></li>
          <li><a className="block px-4 py-3 hover:bg-gray-50 rounded" href="/organizations">企業ディレクトリ</a></li>
          <li><a className="block px-4 py-3 hover:bg-gray-50 rounded" href="/hearing-service">ヒアリング代行</a></li>
          <li className="mt-2 border-t"><a className="block px-4 py-3 hover:bg-gray-50 rounded" href="/auth/login">ログイン</a></li>
        </ul>
      </nav>
    </>,
    document.body
  ) : null;

  return (
    <>
      {Fab}
      {OverlayAndDrawer}
    </>
  );
}