'use client';

/**
 * DashboardBadge - ステータス表示バッジコンポーネント
 *
 * 特徴:
 * - 明確なステータス色
 * - ドット表示オプション
 * - サイズバリエーション
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1.5',
    'font-medium',
    'rounded-full',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[var(--aio-muted)]',
          'text-[var(--color-text-secondary)]',
        ],
        success: [
          'bg-[var(--status-success-bg)]',
          'text-[var(--aio-success)]',
        ],
        warning: [
          'bg-[var(--status-warning-bg)]',
          'text-[var(--aio-warning)]',
        ],
        error: [
          'bg-[var(--status-error-bg)]',
          'text-[var(--aio-danger)]',
        ],
        info: [
          'bg-[var(--status-info-bg)]',
          'text-[var(--aio-info)]',
        ],
        primary: [
          'bg-[var(--aio-primary)]/10',
          'text-[var(--aio-primary)]',
        ],
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface DashboardBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** ドット表示 */
  dot?: boolean;
  /** ドットのアニメーション */
  pulse?: boolean;
}

export const DashboardBadge = React.forwardRef<HTMLSpanElement, DashboardBadgeProps>(
  ({ className, variant, size, dot = false, pulse = false, children, ...props }, ref) => {
    const dotColors = {
      default: 'bg-[var(--color-text-tertiary)]',
      success: 'bg-[var(--status-success)]',
      warning: 'bg-[var(--status-warning)]',
      error: 'bg-[var(--status-error)]',
      info: 'bg-[var(--status-info)]',
      primary: 'bg-[var(--aio-primary)]',
    };

    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              dotColors[variant || 'default'],
              pulse && 'animate-pulse'
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

DashboardBadge.displayName = 'DashboardBadge';

// ============================================
// Status Badge (preset variants)
// ============================================

export interface StatusBadgeProps extends Omit<DashboardBadgeProps, 'variant'> {
  status: 'active' | 'inactive' | 'pending' | 'draft' | 'published' | 'archived' | 'error';
}

const statusConfig: Record<StatusBadgeProps['status'], {
  variant: 'success' | 'warning' | 'error' | 'default';
  label: string;
  dot?: boolean;
  pulse?: boolean;
}> = {
  active: { variant: 'success', label: '有効', dot: true, pulse: true },
  inactive: { variant: 'default', label: '無効', dot: true },
  pending: { variant: 'warning', label: '保留中', dot: true },
  draft: { variant: 'default', label: '下書き', dot: false },
  published: { variant: 'success', label: '公開中', dot: true },
  archived: { variant: 'default', label: 'アーカイブ', dot: false },
  error: { variant: 'error', label: 'エラー', dot: true },
};

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, children, ...props }, ref) => {
    const config = statusConfig[status];
    return (
      <DashboardBadge
        ref={ref}
        variant={config.variant}
        dot={config.dot}
        pulse={config.pulse}
        {...props}
      >
        {children || config.label}
      </DashboardBadge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

// ============================================
// Count Badge (for notifications)
// ============================================

export interface CountBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count: number;
  max?: number;
  variant?: 'default' | 'primary' | 'error';
}

export const CountBadge = React.forwardRef<HTMLSpanElement, CountBadgeProps>(
  ({ count, max = 99, variant = 'primary', className, ...props }, ref) => {
    const displayCount = count > max ? `${max}+` : count.toString();

    const variantStyles = {
      default: 'bg-[var(--color-text-tertiary)] text-white',
      primary: 'bg-[var(--aio-primary)] text-white',
      error: 'bg-[var(--status-error)] text-white',
    };

    if (count === 0) return null;

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center',
          'min-w-[20px] h-5 px-1.5',
          'text-xs font-semibold',
          'rounded-full',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {displayCount}
      </span>
    );
  }
);

CountBadge.displayName = 'CountBadge';
