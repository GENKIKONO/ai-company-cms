'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const menuItems = [
  { href: '/', label: 'トップ' },
  { href: '/pricing', label: '料金プラン' },
  { href: '/organizations', label: '企業ディレクトリ' },
  { href: '/hearing-service', label: 'ヒアリング代行' },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Debug: Always show for testing
  // if (!isMobile) return null;

  return (
    <>
      {/* Hamburger Button - Viewport based positioning */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-xl hover:bg-blue-700 transition-colors"
        style={{ 
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999
        }}
      >
        {isOpen ? '×' : '☰'}
      </button>

      {/* Overlay and Menu - Viewport based */}
      {isOpen && (
        <>
          {/* Dark Overlay - Only covers viewport */}
          <div 
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9998
            }}
          />
          
          {/* Side Navigation - Slides from viewport right */}
          <nav 
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '320px',
              height: '100vh',
              backgroundColor: 'white',
              boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
              zIndex: 9998,
              transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 300ms ease-in-out'
            }}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-800">AIO Hub</h2>
              
              <div className="space-y-4">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block py-3 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              
              <div style={{ 
                position: 'absolute', 
                bottom: '24px', 
                left: '24px', 
                right: '24px', 
                textAlign: 'center',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                © {new Date().getFullYear()} AIO Hub
              </div>
            </div>
          </nav>
        </>
      )}
    </>
  );
}