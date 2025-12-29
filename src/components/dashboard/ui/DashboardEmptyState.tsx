'use client';

/**
 * DashboardEmptyState - 空状態表示コンポーネント
 *
 * データがない場合やリストが空の場合に表示する統一されたUIを提供
 */

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DashboardCard } from './DashboardCard';

export interface DashboardEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** アイコン */
  icon?: React.ReactNode;
  /** タイトル */
  title: string;
  /** 説明文 */
  description?: string;
  /** アクションボタン */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** カードで囲むかどうか */
  variant?: 'card' | 'inline';
}

export const DashboardEmptyState = React.forwardRef<HTMLDivElement, DashboardEmptyStateProps>(
  ({
    className,
    icon,
    title,
    description,
    action,
    variant = 'card',
    ...props
  }, ref) => {
    const content = (
      <div className="text-center py-12">
        {icon && (
          <div className="mx-auto w-16 h-16 rounded-full bg-[var(--aio-muted)] flex items-center justify-center mb-4">
            <div className="text-[var(--color-text-secondary)]">
              {icon}
            </div>
          </div>
        )}
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mx-auto mb-6">
            {description}
          </p>
        )}
        {action && (
          action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--aio-primary)] text-white font-medium text-sm hover:bg-[var(--aio-primary-hover)] transition-colors"
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--aio-primary)] text-white font-medium text-sm hover:bg-[var(--aio-primary-hover)] transition-colors"
            >
              {action.label}
            </button>
          )
        )}
      </div>
    );

    if (variant === 'inline') {
      return (
        <div ref={ref} className={className} {...props}>
          {content}
        </div>
      );
    }

    return (
      <DashboardCard ref={ref} className={cn('border-dashed', className)} {...props}>
        {content}
      </DashboardCard>
    );
  }
);

DashboardEmptyState.displayName = 'DashboardEmptyState';
