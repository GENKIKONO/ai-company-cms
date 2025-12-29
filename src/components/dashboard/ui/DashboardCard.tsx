'use client';

/**
 * DashboardCard - ダッシュボード用カードコンポーネント
 *
 * デザイントークンを使用した統一されたカードスタイルを提供
 * 上位コンポーネントを変更すると全配下が自動で変わる
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  [
    'rounded-xl',
    'transition-all',
    'duration-200',
    'ease-out',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[var(--dashboard-card-bg)]',
          'border',
          'border-[var(--dashboard-card-border)]',
          'shadow-[var(--dashboard-card-shadow)]',
        ],
        elevated: [
          'bg-[var(--dashboard-card-bg)]',
          'border',
          'border-[var(--dashboard-card-border)]',
          'shadow-[var(--dashboard-card-shadow)]',
          'hover:shadow-[var(--dashboard-card-shadow-hover)]',
          'hover:-translate-y-0.5',
        ],
        flat: [
          'bg-[var(--dashboard-card-bg)]',
          'border',
          'border-[var(--dashboard-card-border)]',
        ],
        ghost: [
          'bg-transparent',
          'border-0',
        ],
        glass: [
          'glass-card',
        ],
        status: [
          'border-l-4',
          'bg-[var(--dashboard-card-bg)]',
          'shadow-[var(--dashboard-card-shadow)]',
        ],
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        true: [
          'cursor-pointer',
          'focus-visible:outline-none',
          'focus-visible:ring-2',
          'focus-visible:ring-[var(--aio-primary)]',
          'focus-visible:ring-offset-2',
          'active:scale-[0.99]',
        ],
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      interactive: false,
    },
  }
);

export interface DashboardCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  as?: 'div' | 'article' | 'section';
  statusColor?: 'success' | 'warning' | 'error' | 'info';
}

export const DashboardCard = React.forwardRef<HTMLDivElement, DashboardCardProps>(
  ({ className, variant, padding, interactive, as: Component = 'div', statusColor, style, ...props }, ref) => {
    const statusColorMap = {
      success: 'var(--status-success)',
      warning: 'var(--status-warning)',
      error: 'var(--status-error)',
      info: 'var(--status-info)',
    };

    const statusStyles = variant === 'status' && statusColor
      ? { borderLeftColor: statusColorMap[statusColor], ...style }
      : style;

    return (
      <Component
        ref={ref}
        className={cn(cardVariants({ variant, padding, interactive, className }))}
        style={statusStyles}
        {...props}
      />
    );
  }
);

DashboardCard.displayName = 'DashboardCard';

// Card Header
export interface DashboardCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  actions?: React.ReactNode;
}

export const DashboardCardHeader = React.forwardRef<HTMLDivElement, DashboardCardHeaderProps>(
  ({ className, actions, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-start justify-between gap-4',
          'pb-4',
          'border-b border-[var(--dashboard-card-border)]',
          className
        )}
        {...props}
      >
        <div className="flex-1 min-w-0">
          {children}
        </div>
        {actions && (
          <div className="flex-shrink-0 flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    );
  }
);

DashboardCardHeader.displayName = 'DashboardCardHeader';

// Card Content
export const DashboardCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('pt-4', className)}
      {...props}
    />
  );
});

DashboardCardContent.displayName = 'DashboardCardContent';

// Card Footer
export interface DashboardCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  justify?: 'start' | 'center' | 'end' | 'between';
}

export const DashboardCardFooter = React.forwardRef<HTMLDivElement, DashboardCardFooterProps>(
  ({ className, justify = 'end', ...props }, ref) => {
    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3',
          'pt-4 mt-4',
          'border-t border-[var(--dashboard-card-border)]',
          justifyClasses[justify],
          className
        )}
        {...props}
      />
    );
  }
);

DashboardCardFooter.displayName = 'DashboardCardFooter';
