/**
 * ValidationMessage コンポーネント
 * 要件定義準拠: フォーム体験最適化、アクセシビリティAA
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const messageVariants = cva(
  [
    'flex items-start space-x-2 text-sm',
    'transition-all duration-200',
  ],
  {
    variants: {
      type: {
        error: 'text-destructive',
        warning: 'text-yellow-600',
        success: 'text-green-600',
        info: 'text-blue-600',
      },
      size: {
        sm: 'text-xs',
        default: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      type: 'error',
      size: 'default',
    },
  }
);

const iconMap = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
};

export interface ValidationMessageProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof messageVariants> {
  message: string | string[];
  showIcon?: boolean;
  id?: string;
}

export const ValidationMessage = React.forwardRef<
  HTMLDivElement,
  ValidationMessageProps
>(
  (
    {
      className,
      type = 'error',
      size,
      message,
      showIcon = true,
      id,
      ...props
    },
    ref
  ) => {
    const Icon = iconMap[type || 'error'];
    const messages = Array.isArray(message) ? message : [message];

    if (!message || messages.length === 0) {
      return null;
    }

    return (
      <div
        ref={ref}
        id={id}
        className={cn(messageVariants({ type, size }), className)}
        role={type === 'error' ? 'alert' : 'status'}
        aria-live={type === 'error' ? 'assertive' : 'polite'}
        {...props}
      >
        {showIcon && (
          <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
        )}
        <div className="flex-1">
          {messages.length === 1 ? (
            <span>{messages[0]}</span>
          ) : (
            <ul className="space-y-1">
              {messages.map((msg, index) => (
                <li key={index}>{msg}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }
);

ValidationMessage.displayName = 'ValidationMessage';

// Form-level validation summary
export interface ValidationSummaryProps {
  errors: Record<string, string | string[]>;
  title?: string;
  className?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  title = 'フォームにエラーがあります',
  className,
}) => {
  const errorEntries = Object.entries(errors).filter(
    ([, message]) => message && (Array.isArray(message) ? message.length > 0 : true)
  );

  if (errorEntries.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-md border border-destructive bg-destructive/10 p-4',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-destructive">{title}</h3>
          <ul className="mt-2 space-y-1 text-sm text-destructive">
            {errorEntries.map(([field, message]) => {
              const messages = Array.isArray(message) ? message : [message];
              return messages.map((msg, index) => (
                <li key={`${field}-${index}`} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{msg}</span>
                </li>
              ));
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Success message component
export interface SuccessMessageProps {
  message: string;
  title?: string;
  className?: string;
  showIcon?: boolean;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  title,
  className,
  showIcon = true,
}) => {
  return (
    <div
      className={cn(
        'rounded-md border border-green-200 bg-green-50 p-4',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3">
        {showIcon && (
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          {title && (
            <h3 className="text-sm font-medium text-green-800">{title}</h3>
          )}
          <p className="text-sm text-green-700 mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Warning message component
export interface WarningMessageProps {
  message: string;
  title?: string;
  className?: string;
  showIcon?: boolean;
}

export const WarningMessage: React.FC<WarningMessageProps> = ({
  message,
  title,
  className,
  showIcon = true,
}) => {
  return (
    <div
      className={cn(
        'rounded-md border border-yellow-200 bg-yellow-50 p-4',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3">
        {showIcon && (
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          {title && (
            <h3 className="text-sm font-medium text-yellow-800">{title}</h3>
          )}
          <p className="text-sm text-yellow-700 mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
};