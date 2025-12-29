'use client';

/**
 * AdminFormBlock
 * Admin領域のフォーム用共通ブロック
 */

import { ReactNode, FormEvent } from 'react';
import { HIGButton } from '@/components/ui/HIGButton';

interface AdminFormBlockProps {
  /** フォームタイトル */
  title?: string;
  /** 説明 */
  description?: string;
  /** フォーム内容 */
  children: ReactNode;
  /** 送信時のハンドラ */
  onSubmit: (e: FormEvent) => void;
  /** 送信ボタンのラベル */
  submitLabel?: string;
  /** キャンセルボタンのラベル */
  cancelLabel?: string;
  /** キャンセル時のハンドラ */
  onCancel?: () => void;
  /** 送信中かどうか */
  isSubmitting?: boolean;
  /** 送信ボタンを無効にするか */
  submitDisabled?: boolean;
}

export function AdminFormBlock({
  title,
  description,
  children,
  onSubmit,
  submitLabel = '保存',
  cancelLabel = 'キャンセル',
  onCancel,
  isSubmitting = false,
  submitDisabled = false,
}: AdminFormBlockProps) {
  return (
    <div className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] overflow-hidden">
      {(title || description) && (
        <div className="px-6 py-4 border-b border-[var(--aio-border)]">
          {title && (
            <h3 className="text-lg font-medium text-[var(--aio-text)]">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-[var(--aio-text-muted)]">{description}</p>
          )}
        </div>
      )}
      <form onSubmit={onSubmit}>
        <div className="px-6 py-4 space-y-4">{children}</div>
        <div className="px-6 py-4 bg-[var(--aio-surface-secondary)] border-t border-[var(--aio-border)] flex justify-end gap-2">
          {onCancel && (
            <HIGButton type="button" variant="secondary" onClick={onCancel}>
              {cancelLabel}
            </HIGButton>
          )}
          <HIGButton type="submit" disabled={isSubmitting || submitDisabled}>
            {isSubmitting ? '処理中...' : submitLabel}
          </HIGButton>
        </div>
      </form>
    </div>
  );
}

/** フォーム内のフィールドグループ */
export function AdminFormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--aio-text)] mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
