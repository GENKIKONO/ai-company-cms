/**
 * LoadingSpinner コンポーネント
 * 要件定義準拠: 一貫したローディング体験
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spinnerVariants = cva(
  [
    'animate-spin rounded-full border-2 border-current border-t-transparent',
    'text-muted-foreground',
  ],
  {
    variants: {
      size: {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        default: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
      },
      variant: {
        default: 'text-muted-foreground',
        primary: 'text-primary',
        secondary: 'text-secondary',
        white: 'text-white',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
  showLabel?: boolean;
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  (
    {
      className,
      size,
      variant,
      label = '読み込み中...',
      showLabel = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center', className)}
        {...props}
      >
        <div className="flex flex-col items-center space-y-2">
          <div
            className={cn(spinnerVariants({ size, variant }))}
            role="status"
            aria-label={label}
          >
            <span className="sr-only">{label}</span>
          </div>
          {showLabel && (
            <span className="text-sm text-muted-foreground">{label}</span>
          )}
        </div>
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

// Page-level loading component
export interface PageLoadingProps {
  message?: string;
  className?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  message = 'ページを読み込んでいます...',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex min-h-[400px] items-center justify-center',
        className
      )}
    >
      <LoadingSpinner size="lg" showLabel label={message} />
    </div>
  );
};

// Inline loading component for buttons, etc.
export interface InlineLoadingProps {
  size?: VariantProps<typeof spinnerVariants>['size'];
  variant?: VariantProps<typeof spinnerVariants>['variant'];
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  size = 'sm',
  variant = 'default',
  className,
}) => {
  return (
    <LoadingSpinner
      size={size}
      variant={variant}
      className={cn('inline-flex', className)}
    />
  );
};

export { LoadingSpinner, spinnerVariants };