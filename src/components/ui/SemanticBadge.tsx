/**
 * SemanticBadge - 意味論的バッジコンポーネント
 *
 * ステータス表示用のバッジ。色の直書きではなく、
 * 意味（info/success/warning/danger）でスタイルを決定。
 *
 * @see docs/architecture/ui-semantic-contract.md
 */

import React from 'react';

export type SemanticVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

interface SemanticBadgeProps {
  variant: SemanticVariant;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

const variantStyles: Record<SemanticVariant, string> = {
  info: 'bg-[var(--aio-info-muted)] text-[var(--aio-info)]',
  success: 'bg-[var(--aio-success-muted)] text-[var(--aio-success)]',
  warning: 'bg-[var(--aio-warning-muted)] text-[var(--aio-warning)]',
  danger: 'bg-[var(--aio-danger-muted)] text-[var(--aio-danger)]',
  neutral: 'bg-gray-100 text-gray-700',
};

const sizeStyles: Record<'sm' | 'md', string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function SemanticBadge({
  variant,
  children,
  className = '',
  size = 'md',
}: SemanticBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </span>
  );
}

export default SemanticBadge;
