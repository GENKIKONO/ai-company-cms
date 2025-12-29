'use client';

/**
 * DashboardButton - Stripe風ボタンコンポーネント
 *
 * 特徴:
 * - 明確なホバー・アクティブ状態
 * - ローディング対応
 * - アイコン対応
 * - 複数のバリエーション
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium',
    'rounded-lg',
    'transition-all duration-150 ease-out',
    'outline-none',
    'focus-visible:shadow-[var(--focus-ring)]',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'select-none',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-[var(--btn-primary-bg)]',
          'text-white',
          'hover:bg-[var(--btn-primary-hover)]',
          'active:bg-[var(--btn-primary-active)]',
          'shadow-sm',
        ],
        secondary: [
          'bg-[var(--btn-secondary-bg)]',
          'text-[var(--color-text-primary)]',
          'border border-[var(--btn-secondary-border)]',
          'hover:bg-[var(--btn-secondary-hover)]',
          'active:bg-[var(--aio-muted)]',
        ],
        danger: [
          'bg-[var(--btn-danger-bg)]',
          'text-white',
          'hover:bg-[var(--btn-danger-hover)]',
          'active:bg-[#b91c1c]',
          'shadow-sm',
        ],
        ghost: [
          'bg-transparent',
          'text-[var(--color-text-secondary)]',
          'hover:bg-[var(--aio-muted)]',
          'hover:text-[var(--color-text-primary)]',
        ],
        link: [
          'bg-transparent',
          'text-[var(--aio-primary)]',
          'hover:text-[var(--aio-primary-hover)]',
          'hover:underline',
          'p-0 h-auto',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface DashboardButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** ローディング状態 */
  loading?: boolean;
  /** 左アイコン */
  leftIcon?: React.ReactNode;
  /** 右アイコン */
  rightIcon?: React.ReactNode;
}

export const DashboardButton = React.forwardRef<HTMLButtonElement, DashboardButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner />
            <span>処理中...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

DashboardButton.displayName = 'DashboardButton';

// ============================================
// Loading Spinner
// ============================================

const LoadingSpinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// ============================================
// Button Group
// ============================================

export interface DashboardButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 方向 */
  direction?: 'horizontal' | 'vertical';
}

export const DashboardButtonGroup = React.forwardRef<HTMLDivElement, DashboardButtonGroupProps>(
  ({ className, direction = 'horizontal', children, ...props }, ref) => (
    <div
      ref={ref}
      role="group"
      className={cn(
        'flex',
        direction === 'horizontal' ? 'flex-row gap-2' : 'flex-col gap-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

DashboardButtonGroup.displayName = 'DashboardButtonGroup';

// ============================================
// Icon Button
// ============================================

export interface DashboardIconButtonProps
  extends Omit<DashboardButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  /** アイコン */
  icon: React.ReactNode;
  /** アクセシビリティ用ラベル */
  'aria-label': string;
}

export const DashboardIconButton = React.forwardRef<HTMLButtonElement, DashboardIconButtonProps>(
  ({ icon, className, ...props }, ref) => (
    <DashboardButton
      ref={ref}
      size="icon"
      variant="ghost"
      className={className}
      {...props}
    >
      {icon}
    </DashboardButton>
  )
);

DashboardIconButton.displayName = 'DashboardIconButton';
