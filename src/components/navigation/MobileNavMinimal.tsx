"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

// モバイル判定カスタムHook
function useIsMobile(lg = 1024) {
  const [mobile, setMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${lg - 1}px)`);
    const onChange = () => setMobile(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [lg]);
  return mobile;
}

// 内部実装コンポーネント（Hook順序固定）
function MobileNavMinimalInner() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // マウント状態管理
  useEffect(() => setMounted(true), []);

  // 背景スクロールロック
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (open) {
      const prevOverflow = root.style.overflow;
      root.style.overflow = "hidden";
      return () => {
        root.style.overflow = prevOverflow;
      };
    }
  }, [open, mounted]);

  // Escキーで閉じる
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // 右下固定FAB
  const Fab = (
    <button
      type="button"
      aria-label={open ? "メニューを閉じる" : "メニューを開く"}
      aria-expanded={open}
      aria-controls="mobile-drawer"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
      className="fixed bottom-4 right-4 z-[9999] inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400"
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

  // Portal(A): オーバーレイ（opened時のみ）
  const Overlay = mounted && open ? createPortal(
    <div
      className="fixed inset-0 z-40 bg-black/40 opacity-100 pointer-events-auto"
      aria-hidden="true"
      onClick={() => setOpen(false)}
    />,
    document.body
  ) : null;

  // Portal(B): ドロワー（常時、transform制御）
  const Drawer = mounted ? createPortal(
    <nav
      id="mobile-drawer"
      role="navigation"
      aria-label="モバイルメニュー"
      className={`fixed top-0 right-0 z-50 h-screen w-72 max-w-[85vw] bg-white shadow-xl transition-transform duration-300 ease-out ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
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
        <li><Link className="block px-4 py-3 hover:bg-gray-50 rounded" href="/">トップ</Link></li>
        <li><Link className="block px-4 py-3 hover:bg-gray-50 rounded" href="/pricing">料金プラン</Link></li>
        <li><Link className="block px-4 py-3 hover:bg-gray-50 rounded" href="/organizations">企業ディレクトリ</Link></li>
        <li><Link className="block px-4 py-3 hover:bg-gray-50 rounded" href="/hearing-service">ヒアリング代行</Link></li>
        <li className="mt-2 border-t"><Link className="block px-4 py-3 hover:bg-gray-50 rounded" href="/auth/login">ログイン</Link></li>
      </ul>
    </nav>,
    document.body
  ) : null;

  return (
    <>
      {Overlay}
      {Drawer}
      {mounted ? createPortal(Fab, document.body) : null}
    </>
  );
}

// ラッパーコンポーネント（モバイル判定・早期return）
export default function MobileNavMinimal() {
  const isMobile = useIsMobile(1024);

  if (isMobile === null) return null; // 初回マウントまで待つ
  if (!isMobile) return null;         // PCでは一切描画しない

  return <MobileNavMinimalInner />;
}