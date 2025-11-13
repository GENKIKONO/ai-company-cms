/**
 * エクスポートボタンコンポーネント
 * CSV/JSON形式でのデータエクスポート機能
 * AIO Design Tokens v2 準拠
 */

'use client';

import { useState } from 'react';

interface ExportButtonProps {
  onExport: (format: 'csv' | 'json') => void;
  enabled: boolean;
  formats?: ('csv' | 'json')[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ExportButton({ 
  onExport, 
  enabled, 
  formats = ['csv', 'json'],
  size = 'md',
  className = ''
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const formatLabels = {
    csv: 'CSV形式',
    json: 'JSON形式'
  };

  const formatIcons = {
    csv: '📊',
    json: '📄'
  };

  if (!enabled) {
    return (
      <button
        disabled
        className={`
          inline-flex items-center space-x-2 rounded-md font-medium
          bg-[var(--aio-surface-hover)] text-[var(--text-muted)]
          border border-[var(--aio-border)]
          cursor-not-allowed opacity-50
          ${sizeClasses[size]}
          ${className}
        `}
      >
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
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
        <span>エクスポート</span>
        <span className="text-xs">(Businessで有効化)</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center space-x-2 rounded-md font-medium
          bg-[var(--aio-primary)] text-[var(--text-on-primary)] 
          hover:bg-[var(--aio-primary-hover)]
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)] focus:ring-offset-2
          ${sizeClasses[size]}
          ${className}
        `}
      >
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
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
        <span>エクスポート</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <>
          {/* オーバーレイ */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* メニュー */}
          <div className="absolute right-0 mt-2 w-48 bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-md shadow-lg z-20">
            <div className="py-1">
              {formats.map((format) => (
                <button
                  key={format}
                  onClick={() => {
                    onExport(format);
                    setIsOpen(false);
                  }}
                  className="
                    w-full text-left px-4 py-2 text-sm
                    text-[var(--text-primary)]
                    hover:bg-[var(--aio-surface-hover)]
                    transition-colors duration-150
                    flex items-center space-x-3
                  "
                >
                  <span className="text-lg">{formatIcons[format]}</span>
                  <div>
                    <div className="font-medium">{formatLabels[format]}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {format === 'csv' 
                        ? 'Excel等で開ける表計算形式' 
                        : 'プログラムで処理しやすいデータ形式'
                      }
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* フッター */}
            <div className="border-t border-[var(--aio-border)] px-4 py-2">
              <div className="text-xs text-[var(--text-muted)]">
                分析期間: 直近30日間のデータ
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}