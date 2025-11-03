'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { HIGButton } from '@/design-system';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Escape キーでメニューを閉じる
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 背景スクロール防止
  useEffect(() => {
    if (!isOpen) return;
    const originalBodyOverflow = document.body.style.overflow;
    const originalDocumentOverflow = document.documentElement.style.overflow;
    
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalDocumentOverflow;
    };
  }, [isOpen]);

  // フォーカス管理
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus({ preventScroll: true });
    }
  }, [isOpen]);

  const handleToggle = () => setIsOpen(!isOpen);
  const handleClose = () => setIsOpen(false);

  // Floating Action Button - HIG準拠のデザイントークン使用
  const FloatingButton = (
    <HIGButton
      variant="primary"
      size="icon"
      onClick={handleToggle}
      aria-controls="mobile-nav-panel"
      aria-expanded={isOpen}
      aria-label={isOpen ? 'ナビゲーションを閉じる' : 'ナビゲーションを開く'}
      className="mobile-nav-fab"
    >
      <span className="mobile-nav-fab__icon" aria-hidden="true">
        {isOpen ? '×' : '☰'}
      </span>
    </HIGButton>
  );

  // Navigation Panel - Portal経由でbody直下にマウント
  const NavigationPanel = mounted && isOpen && createPortal(
    <>
      {/* Backdrop */}
      <div
        className="mobile-nav-backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />
      
      {/* Navigation Panel */}
      <nav
        id="mobile-nav-panel"
        role="navigation"
        aria-label="モバイルナビゲーション"
        ref={panelRef}
        tabIndex={-1}
        className="mobile-nav-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mobile-nav-content">
          <h2 className="mobile-nav-title">AIO Hub</h2>
          
          <div className="mobile-nav-links">
            <Link 
              href="/" 
              onClick={handleClose}
              className="mobile-nav-link"
            >
              トップ
            </Link>
            <Link 
              href="/pricing" 
              onClick={handleClose}
              className="mobile-nav-link"
            >
              料金プラン
            </Link>
            <Link 
              href="/organizations" 
              onClick={handleClose}
              className="mobile-nav-link"
            >
              企業ディレクトリ
            </Link>
            <Link 
              href="/hearing-service" 
              onClick={handleClose}
              className="mobile-nav-link"
            >
              ヒアリング代行
            </Link>

            {/* Login Section */}
            <div className="mobile-nav-auth">
              <Link href="/auth/login" onClick={handleClose}>
                <HIGButton 
                  variant="primary" 
                  size="lg" 
                  fullWidth
                  className="mobile-nav-login-btn"
                >
                  ログイン
                </HIGButton>
              </Link>
            </div>
          </div>
          
          <div className="mobile-nav-footer">
            © {new Date().getFullYear()} AIO Hub
          </div>
        </div>
      </nav>
    </>,
    document.body
  );

  return (
    <>
      {FloatingButton}
      {NavigationPanel}
    </>
  );
}