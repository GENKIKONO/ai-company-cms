'use client';

/**
 * DashboardSection - ダッシュボード用セクションコンポーネント
 *
 * ページ内のセクション分けに使用
 * AioSectionのダッシュボード版
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface DashboardSectionProps extends React.HTMLAttributes<HTMLElement> {
  /** セクションタイトル（オプション） */
  title?: string;
  /** セクション説明（オプション） */
  description?: string;
  /** タイトル右側のアクション */
  actions?: React.ReactNode;
  /** コンテナの最大幅を無効化 */
  fullWidth?: boolean;
  /** 背景スタイル */
  variant?: 'default' | 'muted' | 'transparent';
  /** 縦のスペーシング */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

export const DashboardSection = React.forwardRef<HTMLElement, DashboardSectionProps>(
  ({
    className,
    title,
    description,
    actions,
    fullWidth = false,
    variant = 'transparent',
    spacing = 'md',
    children,
    ...props
  }, ref) => {
    const variantStyles = {
      default: 'bg-[var(--dashboard-card-bg)]',
      muted: 'bg-[var(--dashboard-bg)]',
      transparent: 'bg-transparent',
    };

    const spacingStyles = {
      none: '',
      sm: 'py-4',
      md: 'py-8',
      lg: 'py-12',
    };

    return (
      <section
        ref={ref}
        className={cn(
          variantStyles[variant],
          spacingStyles[spacing],
          className
        )}
        {...props}
      >
        <div className={cn(!fullWidth && 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8')}>
          {(title || actions) && (
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                {title && (
                  <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {description}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex-shrink-0 flex items-center gap-2">
                  {actions}
                </div>
              )}
            </div>
          )}
          {children}
        </div>
      </section>
    );
  }
);

DashboardSection.displayName = 'DashboardSection';
