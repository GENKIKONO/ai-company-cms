'use client';

import Link from 'next/link';
import { ArrowRightIcon } from '@/components/icons/HIGIcons';

interface CTAProps {
  variant?: 'primary' | 'secondary';
  size?: 'large' | 'medium' | 'small';
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  showArrow?: boolean;
  className?: string;
}

/**
 * 統一CTAコンポーネント
 * iCloud準拠のデザインで白文字を確実に表示
 */
export default function UnifiedCTA({
  variant = 'primary',
  size = 'medium',
  href,
  onClick,
  disabled = false,
  children,
  showArrow = false,
  className = ''
}: CTAProps) {
  
  // 基本スタイル（統一仕様）
  const baseStyles = `
    inline-flex items-center justify-center gap-2 
    font-semibold transition-all duration-300 
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    letter-spacing: 0.01em
    -webkit-font-smoothing: antialiased
    text-rendering: optimizeLegibility
    border-radius: 980px !important
    min-height: 44px
  `.replace(/\s+/g, ' ').trim();

  // バリアント別スタイル
  const variantStyles = {
    primary: `
      background: #0A84FF !important;
      color: #FFFFFF !important;
      border: none;
      box-shadow: 0 4px 12px rgba(10, 132, 255, 0.3);
      hover:background: #066CEB !important;
      focus:ring-color: #1B6DFF;
      transform: translateY(0);
      hover:transform: translateY(-2px) scale(1.02);
      hover:box-shadow: 0 8px 24px rgba(10, 132, 255, 0.4);
    `,
    secondary: `
      background: #FFFFFF !important;
      color: var(--text-primary) !important;
      border: 1px solid rgba(0, 0, 0, 0.1);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      hover:background: rgba(0, 0, 0, 0.05) !important;
      focus:ring-color: #0A84FF;
      transform: translateY(0);
      hover:transform: translateY(-1px) scale(1.02);
      hover:box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `
  };

  // サイズ別スタイル
  const sizeStyles = {
    large: 'px-8 py-4 text-lg min-h-[56px]',
    medium: 'px-6 py-3 text-base min-h-[48px]', 
    small: 'px-4 py-2 text-sm min-h-[40px]'
  };

  // 最終的なクラス名
  const finalClassName = `${baseStyles} ${sizeStyles[size]} ${className}`.trim();

  // インラインスタイル（重要度を確実にするため）
  const inlineStyle = {
    borderRadius: '980px',
    ...(variant === 'primary' ? {
      backgroundColor: '#0A84FF',
      color: '#FFFFFF',
      border: 'none',
      boxShadow: '0 4px 12px rgba(10, 132, 255, 0.3)'
    } : {
      backgroundColor: '#FFFFFF',
      color: 'var(--text-primary)',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    })
  };

  const content = (
    <>
      <span style={{ 
        color: variant === 'primary' ? '#FFFFFF' : 'inherit' 
      }}>{children}</span>
      {showArrow && (
        <ArrowRightIcon 
          className="w-4 h-4 transition-transform group-hover:translate-x-1" 
          style={{ color: variant === 'primary' ? '#FFFFFF' : 'inherit' }}
        />
      )}
    </>
  );

  if (href) {
    return (
      <Link 
        href={href} 
        className={`${finalClassName} group`}
        style={inlineStyle}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={`${finalClassName} group`}
      style={inlineStyle}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </button>
  );
}

// 便利なエクスポート
export function PrimaryCTA({ children, href, onClick, showArrow = true, ...props }: Omit<CTAProps, 'variant'>) {
  return (
    <UnifiedCTA 
      variant="primary" 
      href={href} 
      onClick={onClick}
      showArrow={showArrow}
      {...props}
    >
      {children}
    </UnifiedCTA>
  );
}

export function SecondaryCTA({ children, href, onClick, showArrow = false, ...props }: Omit<CTAProps, 'variant'>) {
  return (
    <UnifiedCTA 
      variant="secondary" 
      href={href} 
      onClick={onClick}
      showArrow={showArrow}
      {...props}
    >
      {children}
    </UnifiedCTA>
  );
}