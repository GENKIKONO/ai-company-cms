'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface SmoothScrollLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

export default function SmoothScrollLink({ href, className, children }: SmoothScrollLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // href が # で始まる場合のみスムーズスクロール
    if (href.startsWith('#')) {
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // 通常のナビゲーション
      window.location.href = href;
    }
  };

  return (
    <Link 
      href={href} 
      className={className}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}