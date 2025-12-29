'use client';

/**
 * DashboardInput - Stripe風フォーム入力コンポーネント
 *
 * 特徴:
 * - 明確なフォーカス状態
 * - ラベル・説明・エラー表示の統一
 * - アクセシビリティ対応
 */

import React from 'react';
import { cn } from '@/lib/utils';

// Base input styles
const inputBaseStyles = [
  'w-full',
  'px-3 py-2',
  'text-sm',
  'text-[var(--color-text-primary)]',
  'placeholder:text-[var(--input-placeholder)]',
  'bg-[var(--input-bg)]',
  'border border-[var(--input-border)]',
  'rounded-lg',
  'transition-all duration-150 ease-out',
  'outline-none',
  'hover:border-[var(--input-border-hover)]',
  'focus:border-[var(--input-border-focus)]',
  'focus:shadow-[var(--focus-ring)]',
  'disabled:bg-[var(--input-bg-disabled)]',
  'disabled:cursor-not-allowed',
  'disabled:opacity-60',
].join(' ');

const inputErrorStyles = [
  'border-[var(--status-error)]',
  'focus:border-[var(--status-error)]',
  'focus:shadow-[var(--focus-ring-error)]',
].join(' ');

// ============================================
// Input Field
// ============================================

export interface DashboardInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const DashboardInput = React.forwardRef<HTMLInputElement, DashboardInputProps>(
  ({ className, label, description, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--color-text-primary)]"
          >
            {label}
          </label>
        )}
        {description && (
          <p id={descriptionId} className="text-sm text-[var(--color-text-secondary)]">
            {description}
          </p>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-describedby={cn(descriptionId, errorId)}
            aria-invalid={!!error}
            className={cn(
              inputBaseStyles,
              error && inputErrorStyles,
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-sm text-[var(--status-error)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

DashboardInput.displayName = 'DashboardInput';

// ============================================
// Textarea
// ============================================

export interface DashboardTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
}

export const DashboardTextarea = React.forwardRef<HTMLTextAreaElement, DashboardTextareaProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const descriptionId = description ? `${textareaId}-description` : undefined;
    const errorId = error ? `${textareaId}-error` : undefined;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-[var(--color-text-primary)]"
          >
            {label}
          </label>
        )}
        {description && (
          <p id={descriptionId} className="text-sm text-[var(--color-text-secondary)]">
            {description}
          </p>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-describedby={cn(descriptionId, errorId)}
          aria-invalid={!!error}
          className={cn(
            inputBaseStyles,
            'min-h-[100px] resize-y',
            error && inputErrorStyles,
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-sm text-[var(--status-error)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

DashboardTextarea.displayName = 'DashboardTextarea';

// ============================================
// Select
// ============================================

export interface DashboardSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  description?: string;
  error?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const DashboardSelect = React.forwardRef<HTMLSelectElement, DashboardSelectProps>(
  ({ className, label, description, error, options, placeholder, id, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id ?? generatedId;
    const descriptionId = description ? `${selectId}-description` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-[var(--color-text-primary)]"
          >
            {label}
          </label>
        )}
        {description && (
          <p id={descriptionId} className="text-sm text-[var(--color-text-secondary)]">
            {description}
          </p>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-describedby={cn(descriptionId, errorId)}
          aria-invalid={!!error}
          className={cn(
            inputBaseStyles,
            'appearance-none cursor-pointer',
            'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")]',
            'bg-[length:20px] bg-[right_8px_center] bg-no-repeat',
            'pr-10',
            error && inputErrorStyles,
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} className="text-sm text-[var(--status-error)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

DashboardSelect.displayName = 'DashboardSelect';

// ============================================
// Checkbox
// ============================================

export interface DashboardCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export const DashboardCheckbox = React.forwardRef<HTMLInputElement, DashboardCheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id ?? generatedId;

    return (
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={cn(
            'mt-1 h-4 w-4 rounded',
            'border-[var(--input-border)]',
            'text-[var(--aio-primary)]',
            'focus:ring-2 focus:ring-[var(--aio-primary)] focus:ring-offset-2',
            'cursor-pointer',
            className
          )}
          {...props}
        />
        <div>
          <label
            htmlFor={checkboxId}
            className="text-sm font-medium text-[var(--color-text-primary)] cursor-pointer"
          >
            {label}
          </label>
          {description && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
);

DashboardCheckbox.displayName = 'DashboardCheckbox';

// ============================================
// Form Group (for layout)
// ============================================

export interface DashboardFormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 2カラムレイアウト */
  columns?: 1 | 2;
}

export const DashboardFormGroup = React.forwardRef<HTMLDivElement, DashboardFormGroupProps>(
  ({ className, columns = 1, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'space-y-4',
          columns === 2 && 'sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DashboardFormGroup.displayName = 'DashboardFormGroup';
