'use client';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useNavigation, type NavigationItem } from '../hooks/useNavigation';
import '../styles/navigation.css';

interface MobileNavProps {
  menuItems?: NavigationItem[];
  className?: string;
  title?: string;
}

const defaultMenuItems: NavigationItem[] = [
  { href: '/', label: 'トップ' },
  { href: '/pricing', label: '料金プラン' },
  { href: '/organizations', label: '企業ディレクトリ' },
  { href: '/hearing-service', label: 'ヒアリング代行' },
];

export function MobileNav({ 
  menuItems = defaultMenuItems, 
  className = '',
  title = 'AIO Hub'
}: MobileNavProps) {
  const { isOpen, isMobile, toggle, close } = useNavigation();

  // Don't render on server or desktop
  if (!isMobile) return null;

  const fabContent = isOpen ? '×' : '☰';

  return (
    <>
      {/* FAB Button */}
      <button
        type="button"
        onClick={toggle}
        className={`nav-fab ${className}`}
        aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
        aria-expanded={isOpen}
      >
        {fabContent}
      </button>

      {/* Portal Navigation */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <>
          {/* Overlay */}
          <div 
            className="nav-overlay"
            onClick={close}
            aria-hidden="true"
          />
          
          {/* Navigation Panel */}
          <nav 
            className={`nav-panel ${isOpen ? 'nav-panel-open' : 'nav-panel-closed'}`}
            role="dialog"
            aria-modal="true"
            aria-label="モバイルナビゲーション"
          >
            {/* Header */}
            <div className="nav-header">
              <h2 className="nav-header-title">{title}</h2>
            </div>

            {/* Menu Items */}
            <div>
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-menu-item"
                  onClick={close}
                  {...(item.external && { 
                    target: '_blank', 
                    rel: 'noopener noreferrer' 
                  })}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Footer */}
            <div className="nav-footer">
              © {new Date().getFullYear()} AIO Hub
            </div>
          </nav>
        </>,
        document.body
      )}
    </>
  );
}