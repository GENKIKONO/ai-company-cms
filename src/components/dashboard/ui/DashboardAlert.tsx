'use client';

/**
 * DashboardAlert - アラート/通知コンポーネント
 *
 * 成功、警告、エラー、情報などのメッセージを表示する統一されたUIを提供
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface DashboardAlertAction {
  label: string;
  onClick: () => void;
}

export interface DashboardAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /** アラートの種類 */
  variant?: 'success' | 'warning' | 'error' | 'info';
  /** タイトル */
  title?: string;
  /** 説明文（childrenの代替） */
  description?: string;
  /** アイコン */
  icon?: React.ReactNode;
  /** 閉じるボタンを表示するか */
  dismissible?: boolean;
  /** 閉じるときのコールバック */
  onDismiss?: () => void;
  /** アクションボタン（ReactNodeまたはオブジェクト形式） */
  action?: React.ReactNode | DashboardAlertAction;
}

// Helper to check if action is an object
function isActionObject(action: React.ReactNode | DashboardAlertAction): action is DashboardAlertAction {
  return typeof action === 'object' && action !== null && 'label' in action && 'onClick' in action;
}

export const DashboardAlert = React.forwardRef<HTMLDivElement, DashboardAlertProps>(
  ({
    className,
    variant = 'info',
    title,
    description,
    icon,
    dismissible = false,
    onDismiss,
    action,
    children,
    ...props
  }, ref) => {
    const variantStyles = {
      success: {
        container: 'bg-[var(--status-success-bg)] border-[var(--status-success)]',
        icon: 'text-[var(--status-success)]',
        title: 'text-green-800',
        text: 'text-green-700',
      },
      warning: {
        container: 'bg-[var(--status-warning-bg)] border-[var(--status-warning)]',
        icon: 'text-[var(--status-warning)]',
        title: 'text-yellow-800',
        text: 'text-yellow-700',
      },
      error: {
        container: 'bg-[var(--status-error-bg)] border-[var(--status-error)]',
        icon: 'text-[var(--status-error)]',
        title: 'text-red-800',
        text: 'text-red-700',
      },
      info: {
        container: 'bg-[var(--status-info-bg)] border-[var(--status-info)]',
        icon: 'text-[var(--status-info)]',
        title: 'text-[var(--aio-info)]',
        text: 'text-[var(--aio-info)]',
      },
    };

    const styles = variantStyles[variant];

    const defaultIcons = {
      success: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      warning: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      error: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
      info: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'rounded-lg border-l-4 p-4',
          styles.container,
          className
        )}
        {...props}
      >
        <div className="flex">
          {(icon || defaultIcons[variant]) && (
            <div className={cn('flex-shrink-0', styles.icon)}>
              {icon || defaultIcons[variant]}
            </div>
          )}
          <div className={cn('flex-1', (icon || defaultIcons[variant]) && 'ml-3')}>
            {title && (
              <h3 className={cn('text-sm font-medium', styles.title)}>
                {title}
              </h3>
            )}
            {(children || description) && (
              <div className={cn('text-sm', styles.text, title && 'mt-1')}>
                {description || children}
              </div>
            )}
            {action && (
              <div className="mt-3">
                {isActionObject(action) ? (
                  <button
                    type="button"
                    onClick={action.onClick}
                    className={cn(
                      'text-sm font-medium underline hover:no-underline',
                      styles.title
                    )}
                  >
                    {action.label}
                  </button>
                ) : (
                  action
                )}
              </div>
            )}
          </div>
          {dismissible && onDismiss && (
            <div className="flex-shrink-0 ml-4">
              <button
                type="button"
                onClick={onDismiss}
                className={cn(
                  'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                  styles.text,
                  'hover:opacity-75'
                )}
              >
                <span className="sr-only">閉じる</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

DashboardAlert.displayName = 'DashboardAlert';
