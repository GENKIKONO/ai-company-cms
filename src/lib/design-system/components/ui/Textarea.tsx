/**
 * Textarea コンポーネント
 * 要件定義準拠: アクセシビリティAA、フォーム体験最適化
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textareaVariants = cva(
  [
    'flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'transition-colors duration-200',
    'resize-y',
  ],
  {
    variants: {
      variant: {
        default: 'border-input bg-background',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
      size: {
        default: 'min-h-[80px]',
        sm: 'min-h-[60px] text-xs',
        lg: 'min-h-[120px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: string;
  success?: boolean;
  label?: string;
  description?: string;
  required?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      size,
      error,
      success,
      label,
      description,
      required,
      id,
      maxLength,
      showCount = false,
      value,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const descriptionId = `${textareaId}-description`;

    // Determine variant based on error/success state
    const textareaVariant = error ? 'error' : success ? 'success' : variant;

    // Calculate character count
    const currentLength = typeof value === 'string' ? value.length : 0;
    const isNearLimit = maxLength && currentLength > maxLength * 0.8;
    const isOverLimit = maxLength && currentLength > maxLength;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <textarea
            className={cn(
              textareaVariants({ variant: textareaVariant, size }),
              className
            )}
            ref={ref}
            id={textareaId}
            maxLength={maxLength}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              description && descriptionId,
              error && errorId
            )}
            value={value}
            {...props}
          />

          {showCount && maxLength && (
            <div
              className={cn(
                'absolute bottom-2 right-2 text-xs',
                isOverLimit
                  ? 'text-destructive'
                  : isNearLimit
                  ? 'text-warning'
                  : 'text-muted-foreground'
              )}
            >
              {currentLength}/{maxLength}
            </div>
          )}
        </div>

        {description && !error && (
          <p
            id={descriptionId}
            className="text-sm text-muted-foreground"
          >
            {description}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            className="text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}

        {showCount && maxLength && !error && (
          <p className="text-xs text-muted-foreground text-right">
            {currentLength}/{maxLength} 文字
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };