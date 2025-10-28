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

  if (!isMobile) return null;

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-xl hover:bg-blue-700 transition-colors"
        style={{ zIndex: 9999 }}
      >
        {isOpen ? '×' : '☰'}
      </button>

      {/* Overlay and Menu */}
      {isOpen && (
        <>
          {/* Dark Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
            style={{ zIndex: 9998 }}
          />
          
          {/* Side Navigation */}
          <nav 
            className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-40 transform transition-transform duration-300"
            style={{ zIndex: 9998 }}
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
              
              <div className="absolute bottom-6 left-6 right-6 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} AIO Hub
              </div>
            </div>
          </nav>
        </>
      )}
    </>
  );
}