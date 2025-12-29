'use client';

/**
 * DashboardTable - Stripe風データテーブルコンポーネント
 *
 * 特徴:
 * - クリーンなデザイン
 * - ホバー状態の明確化
 * - レスポンシブ対応
 * - ソート・アクション対応
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { DashboardCard } from './DashboardCard';

// ============================================
// Table Container
// ============================================

export interface DashboardTableProps extends React.HTMLAttributes<HTMLDivElement> {
  /** テーブルタイトル */
  title?: string;
  /** テーブル説明 */
  description?: string;
  /** ヘッダー右側のアクション */
  actions?: React.ReactNode;
}

export const DashboardTable = React.forwardRef<HTMLDivElement, DashboardTableProps>(
  ({ className, title, description, actions, children, ...props }, ref) => {
    return (
      <DashboardCard ref={ref} padding="none" className={className} {...props}>
        {(title || actions) && (
          <div className="px-6 py-4 border-b border-[var(--table-border)]">
            <div className="flex items-center justify-between">
              <div>
                {title && (
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {description}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex items-center gap-2">
                  {actions}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            {children}
          </table>
        </div>
      </DashboardCard>
    );
  }
);

DashboardTable.displayName = 'DashboardTable';

// ============================================
// Table Head
// ============================================

export const DashboardTableHead = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn('bg-[var(--table-header-bg)]', className)}
    {...props}
  />
));

DashboardTableHead.displayName = 'DashboardTableHead';

// ============================================
// Table Body
// ============================================

export const DashboardTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('divide-y divide-[var(--table-border)]', className)}
    {...props}
  />
));

DashboardTableBody.displayName = 'DashboardTableBody';

// ============================================
// Table Row
// ============================================

export interface DashboardTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** クリック可能な行 */
  interactive?: boolean;
  /** 選択状態 */
  selected?: boolean;
}

export const DashboardTableRow = React.forwardRef<HTMLTableRowElement, DashboardTableRowProps>(
  ({ className, interactive = false, selected = false, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'transition-colors duration-100',
        interactive && 'cursor-pointer hover:bg-[var(--table-row-hover)]',
        selected && 'bg-[var(--status-info-bg)]',
        className
      )}
      {...props}
    />
  )
);

DashboardTableRow.displayName = 'DashboardTableRow';

// ============================================
// Table Header Cell
// ============================================

export interface DashboardTableHeaderCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** ソート可能 */
  sortable?: boolean;
  /** ソート方向 */
  sortDirection?: 'asc' | 'desc' | null;
  /** ソートクリック */
  onSort?: () => void;
}

export const DashboardTableHeaderCell = React.forwardRef<HTMLTableCellElement, DashboardTableHeaderCellProps>(
  ({ className, sortable, sortDirection, onSort, children, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'px-6 py-3',
        'text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider',
        sortable && 'cursor-pointer select-none hover:text-[var(--color-text-primary)]',
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-1.5">
        {children}
        {sortable && sortDirection && (
          <span className="text-[var(--aio-primary)]">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  )
);

DashboardTableHeaderCell.displayName = 'DashboardTableHeaderCell';

// ============================================
// Table Cell
// ============================================

export interface DashboardTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /** 強調表示 */
  emphasis?: boolean;
}

export const DashboardTableCell = React.forwardRef<HTMLTableCellElement, DashboardTableCellProps>(
  ({ className, emphasis = false, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        'px-6 py-4',
        'text-sm',
        emphasis ? 'font-medium text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]',
        className
      )}
      {...props}
    />
  )
);

DashboardTableCell.displayName = 'DashboardTableCell';

// ============================================
// Empty State for Table
// ============================================

export interface DashboardTableEmptyProps extends React.HTMLAttributes<HTMLTableRowElement> {
  colSpan: number;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const DashboardTableEmpty = React.forwardRef<HTMLTableRowElement, DashboardTableEmptyProps>(
  ({ colSpan, icon, title, description, action, ...props }, ref) => (
    <tr ref={ref} {...props}>
      <td colSpan={colSpan} className="px-6 py-12 text-center">
        {icon && (
          <div className="mx-auto w-12 h-12 rounded-full bg-[var(--aio-muted)] flex items-center justify-center mb-4 text-[var(--color-text-tertiary)]">
            {icon}
          </div>
        )}
        <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
          {title}
        </h4>
        {description && (
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            {description}
          </p>
        )}
        {action}
      </td>
    </tr>
  )
);

DashboardTableEmpty.displayName = 'DashboardTableEmpty';
