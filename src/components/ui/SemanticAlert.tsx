/**
 * SemanticAlert - 意味論的アラートコンポーネント
 *
 * 情報ボックス/アラート表示用。色の直書きではなく、
 * 意味（info/success/warning/danger）でスタイルを決定。
 *
 * @see docs/architecture/ui-semantic-contract.md
 */

import React from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

interface SemanticAlertProps {
  variant: AlertVariant;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  title?: string;
}

const variantStyles: Record<AlertVariant, { bg: string; border: string; text: string; title: string }> = {
  info: {
    bg: 'bg-[var(--aio-info-surface)]',
    border: 'border-[var(--aio-info-border)]',
    text: 'text-[var(--aio-info)]',
    title: 'text-[var(--aio-info)]',
  },
  success: {
    bg: 'bg-[var(--aio-success-muted)]',
    border: 'border-green-200',
    text: 'text-[var(--aio-success)]',
    title: 'text-[var(--aio-success)]',
  },
  warning: {
    bg: 'bg-[var(--aio-warning-muted)]',
    border: 'border-yellow-200',
    text: 'text-[var(--aio-warning)]',
    title: 'text-[var(--aio-warning)]',
  },
  danger: {
    bg: 'bg-[var(--aio-danger-muted)]',
    border: 'border-red-200',
    text: 'text-[var(--aio-danger)]',
    title: 'text-[var(--aio-danger)]',
  },
};

export function SemanticAlert({
  variant,
  children,
  className = '',
  icon,
  title,
}: SemanticAlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={`
        ${styles.bg} ${styles.border} border rounded-lg p-4
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      role="alert"
    >
      <div className="flex">
        {icon && (
          <div className={`flex-shrink-0 ${styles.text}`}>
            {icon}
          </div>
        )}
        <div className={icon ? 'ml-3' : ''}>
          {title && (
            <h3 className={`text-sm font-medium ${styles.title}`}>
              {title}
            </h3>
          )}
          <div className={`${title ? 'mt-2' : ''} text-sm ${styles.text}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SemanticAlert;
