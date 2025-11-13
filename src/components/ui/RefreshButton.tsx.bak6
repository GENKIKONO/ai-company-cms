/**
 * データ再読み込みボタンコンポーネント
 * AIO Design Tokens v2 準拠
 */

'use client';

import { LoadingSpinner } from './LoadingSpinner';

interface RefreshButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function RefreshButton({ 
  onClick, 
  isLoading = false, 
  disabled = false,
  size = 'md',
  variant = 'secondary',
  className = ''
}: RefreshButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    primary: 'bg-[var(--aio-primary)] text-[var(--text-on-primary)] hover:bg-[var(--aio-primary-hover)]',
    secondary: 'bg-[var(--aio-surface-hover)] text-[var(--text-primary)] hover:bg-[var(--aio-surface-active)] border border-[var(--aio-border)]'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center space-x-2 rounded-md font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)] focus:ring-offset-2
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" />
          <span>更新中...</span>
        </>
      ) : (
        <>
          <svg 
            className="w-4 h-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          <span>データ更新</span>
        </>
      )}
    </button>
  );
}