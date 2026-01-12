'use client';

/**
 * Unified Button Component - iCloud Dense Design System
 *
 * iCloudの美しさとStripeの密度を融合した統一ボタン
 * 全ページ共通で使用する唯一のボタンコンポーネント
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex',
    'items-center',
    'justify-center',
    'gap-2',
    'font-medium',
    'rounded-lg',
    'transition-all',
    'duration-200',
    'ease-out',
    'select-none',
    'outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-[var(--aio-primary)]',
    'focus-visible:ring-offset-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'disabled:pointer-events-none',
    'shadow-[var(--btn-shadow)]',
    'hover:shadow-[var(--btn-shadow-hover)]',
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-[var(--btn-primary-bg)]',
          'text-white',
          'hover:bg-[var(--btn-primary-hover)]',
          'active:bg-[var(--btn-primary-active)]',
        ],
        secondary: [
          'bg-[var(--btn-secondary-bg)]',
          'text-[var(--color-text-primary)]',
          'border',
          'border-[var(--btn-secondary-border)]',
          'hover:bg-[var(--btn-secondary-hover)]',
          'hover:border-[var(--color-text-tertiary)]',
          'shadow-none',
          'hover:shadow-[var(--btn-shadow)]',
        ],
        tertiary: [
          'bg-transparent',
          'text-[var(--aio-primary)]',
          'shadow-none',
          'hover:shadow-none',
          'hover:bg-[var(--aio-surface)]',
        ],
        danger: [
          'bg-[var(--btn-danger-bg)]',
          'text-white',
          'hover:bg-[var(--btn-danger-hover)]',
          'active:bg-[#b91c1c]',
        ],
        ghost: [
          'bg-transparent',
          'text-[var(--color-text-secondary)]',
          'shadow-none',
          'hover:shadow-none',
          'hover:bg-[var(--aio-muted)]',
          'hover:text-[var(--color-text-primary)]',
        ],
        outline: [
          'bg-transparent',
          'text-[var(--color-text-primary)]',
          'border',
          'border-[var(--btn-secondary-border)]',
          'shadow-none',
          'hover:bg-[var(--aio-muted)]',
          'hover:border-[var(--color-text-tertiary)]',
        ],
        link: [
          'bg-transparent',
          'text-[var(--aio-primary)]',
          'shadow-none',
          'hover:shadow-none',
          'hover:text-[var(--aio-primary-hover)]',
          'hover:underline',
          'p-0',
          'h-auto',
        ],
        // Legacy aliases for backward compatibility
        default: [
          'bg-[var(--btn-secondary-bg)]',
          'text-[var(--color-text-primary)]',
          'border',
          'border-[var(--btn-secondary-border)]',
          'hover:bg-[var(--btn-secondary-hover)]',
          'hover:border-[var(--color-text-tertiary)]',
          'shadow-none',
          'hover:shadow-[var(--btn-shadow)]',
        ],
        destructive: [
          'bg-[var(--btn-danger-bg)]',
          'text-white',
          'hover:bg-[var(--btn-danger-hover)]',
          'active:bg-[#b91c1c]',
        ],
      },
      size: {
        sm: ['h-8', 'px-3', 'text-sm'],
        md: ['h-9', 'px-4', 'text-sm'],
        lg: ['h-10', 'px-5', 'text-base'],
        xl: ['h-11', 'px-6', 'text-base'],
        icon: ['h-9', 'w-9', 'p-0'],
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

const LoadingSpinner = ({ className }: { className?: string }) => (
  <svg
    className={cn('animate-spin h-4 w-4', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading = false, leftIcon, rightIcon, disabled, children, type = 'button', ...props }, ref) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner />
            <span>{children || '処理中...'}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
            {children && <span>{children}</span>}
            {rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical';
  gap?: 'sm' | 'md' | 'lg';
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, direction = 'horizontal', gap = 'sm', children, ...props }, ref) => {
    const gapClass = { sm: 'gap-2', md: 'gap-3', lg: 'gap-4' }[gap];
    return (
      <div ref={ref} role="group" className={cn('flex', direction === 'horizontal' ? 'flex-row' : 'flex-col', gapClass, className)} {...props}>
        {children}
      </div>
    );
  }
);
ButtonGroup.displayName = 'ButtonGroup';

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, variant = 'ghost', ...props }, ref) => (
    <Button ref={ref} size="icon" variant={variant} className={className} {...props}>{icon}</Button>
  )
);
IconButton.displayName = 'IconButton';

export interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement>, VariantProps<typeof buttonVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  external?: boolean;
}

const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ className, variant = 'tertiary', size, fullWidth, leftIcon, rightIcon, children, external = false, href, ...props }, ref) => {
    const externalProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
    return (
      <a ref={ref} href={href} className={cn(buttonVariants({ variant, size, fullWidth, className }))} {...externalProps} {...props}>
        {leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
        <span>{children}</span>
        {rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
        {external && <span className="sr-only">（新しいタブで開く）</span>}
      </a>
    );
  }
);
LinkButton.displayName = 'LinkButton';

export { Button, ButtonGroup, IconButton, LinkButton, buttonVariants };
