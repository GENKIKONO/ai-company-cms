'use client';

/**
 * DashboardLoadingState - ローディング状態表示コンポーネント
 *
 * データ読み込み中に表示する統一されたUIを提供
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { DashboardCard } from './DashboardCard';

export interface DashboardLoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** ローディングメッセージ */
  message?: string;
  /** サブメッセージ */
  subMessage?: string;
  /** フルスクリーン表示 */
  fullScreen?: boolean;
}

export const DashboardLoadingState = React.forwardRef<HTMLDivElement, DashboardLoadingStateProps>(
  ({
    className,
    message = 'データを読み込んでいます',
    subMessage,
    fullScreen = false,
    ...props
  }, ref) => {
    const content = (
      <div className="text-center py-12">
        <div className="mx-auto w-12 h-12 mb-4">
          <div className="w-12 h-12 border-4 border-[var(--aio-primary)]/20 border-t-[var(--aio-primary)] rounded-full animate-spin" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          {message}
        </h2>
        {subMessage && (
          <p className="text-sm text-[var(--color-text-secondary)]">
            {subMessage}
          </p>
        )}
      </div>
    );

    if (fullScreen) {
      return (
        <div
          ref={ref}
          className={cn(
            'min-h-screen bg-[var(--dashboard-bg)] flex items-center justify-center',
            className
          )}
          {...props}
        >
          <div className="max-w-md w-full mx-auto px-6">
            {content}
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className={className} {...props}>
        {content}
      </div>
    );
  }
);

DashboardLoadingState.displayName = 'DashboardLoadingState';

// Card skeleton for loading states
export interface DashboardLoadingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** スケルトンの行数 */
  lines?: number;
  /** ヘッダーを表示するか */
  showHeader?: boolean;
}

export const DashboardLoadingCard = React.forwardRef<HTMLDivElement, DashboardLoadingCardProps>(
  ({
    className,
    lines = 3,
    showHeader = true,
    ...props
  }, ref) => {
    return (
      <DashboardCard ref={ref} className={cn('animate-pulse', className)} {...props}>
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 bg-[var(--dashboard-card-border)] rounded w-32" />
            <div className="h-5 bg-[var(--dashboard-card-border)] rounded w-20" />
          </div>
        )}
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-[var(--dashboard-card-border)] rounded"
              style={{ width: `${100 - i * 15}%` }}
            />
          ))}
        </div>
      </DashboardCard>
    );
  }
);

DashboardLoadingCard.displayName = 'DashboardLoadingCard';
