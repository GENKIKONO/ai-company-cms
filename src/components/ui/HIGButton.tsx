/**
 * HIG-Compliant Button Component
 * Follows Apple Human Interface Guidelines for buttons
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { LoadingIcon } from '../icons/HIGIcons';

const buttonVariants = cva(
  [
    // Base styles following HIG principles
    'hig-button',
    'relative',
    'inline-flex',
    'items-center',
    'justify-center',
    'gap-2',
    'text-center',
    'font-medium',
    'transition-all',
    'duration-150',
    'ease-out',
    'select-none',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-offset-2',
    'disabled:opacity-60',
    'disabled:pointer-events-none',
    'disabled:cursor-not-allowed',
    // Ensure minimum tap target
    'min-h-[44px]',
    'min-w-[44px]',
    // Japanese text optimization
    'hig-jp-nowrap',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-[var(--color-primary)]',
          'text-white',
          'border-0',
          'hover:bg-[var(--color-primary-dark)]',
          'focus-visible:ring-[var(--color-primary)]',
          'active:scale-[0.98]',
          'shadow-sm',
        ],
        secondary: [
          'bg-[var(--color-background-secondary)]',
          'text-[var(--color-text-primary)]',
          'border',
          'border-[var(--color-border-primary)]',
          'hover:bg-[var(--color-border-secondary)]',
          'hover:border-[var(--color-border-primary)]',
          'focus-visible:ring-[var(--color-primary)]',
          'active:scale-[0.98]',
        ],
        tertiary: [
          'bg-transparent',
          'text-[var(--color-primary)]',
          'border-0',
          'hover:bg-[var(--color-background-secondary)]',
          'focus-visible:ring-[var(--color-primary)]',
          'active:scale-[0.98]',
        ],
        danger: [
          'bg-[var(--color-error)]',
          'text-white',
          'border-0',
          'hover:opacity-90',
          'focus-visible:ring-[var(--color-error)]',
          'active:scale-[0.98]',
          'shadow-sm',
        ],
        ghost: [
          'bg-transparent',
          'text-[var(--color-text-primary)]',
          'border-0',
          'hover:bg-[var(--color-background-secondary)]',
          'focus-visible:ring-[var(--color-primary)]',
          'active:scale-[0.98]',
        ],
      },
      size: {
        sm: [
          'h-10',
          'px-3',
          'text-sm',
          'rounded-lg',
        ],
        md: [
          'h-11',
          'px-4',
          'text-base',
          'rounded-lg',
        ],
        lg: [
          'h-12',
          'px-6',
          'text-base',
          'rounded-xl',
        ],
        xl: [
          'h-14',
          'px-8',
          'text-lg',
          'rounded-xl',
        ],
        icon: [
          'h-10',
          'w-10',
          'p-0',
          'rounded-lg',
        ],
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

export interface HIGButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const HIGButton = React.forwardRef<HTMLButtonElement, HIGButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        type={type}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <>
            <LoadingIcon 
              size={16} 
              className="animate-spin" 
              aria-hidden="true"
            />
            <span className="hig-sr-only">読み込み中...</span>
          </>
        )}
        
        {!loading && leftIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        {children && (
          <span className={cn(
            size === 'icon' && 'hig-sr-only'
          )}>
            {children}
          </span>
        )}
        
        {!loading && rightIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

HIGButton.displayName = 'HIGButton';

export { HIGButton, buttonVariants };

// Link variant for navigation
export interface HIGLinkButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof buttonVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  external?: boolean;
}

export const HIGLinkButton = React.forwardRef<HTMLAnchorElement, HIGLinkButtonProps>(
  (
    {
      className,
      variant = 'tertiary',
      size,
      fullWidth,
      leftIcon,
      rightIcon,
      children,
      external = false,
      href,
      ...props
    },
    ref
  ) => {
    const linkProps = external ? {
      target: '_blank',
      rel: 'noopener noreferrer',
    } : {};

    return (
      <a
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        href={href}
        {...linkProps}
        {...props}
      >
        {leftIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        <span>{children}</span>
        
        {rightIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
        
        {external && (
          <span className="hig-sr-only">（新しいタブで開く）</span>
        )}
      </a>
    );
  }
);

HIGLinkButton.displayName = 'HIGLinkButton';