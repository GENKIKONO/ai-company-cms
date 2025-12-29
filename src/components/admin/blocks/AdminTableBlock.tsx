'use client';

/**
 * AdminTableBlock
 * Admin領域のテーブル表示用共通ブロック
 */

import { ReactNode } from 'react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface AdminTableBlockProps<T> {
  /** テーブルデータ */
  data: T[];
  /** カラム定義 */
  columns: Column<T>[];
  /** 行のキーを取得する関数 */
  getRowKey: (row: T) => string;
  /** ローディング状態 */
  isLoading?: boolean;
  /** 空の場合のメッセージ */
  emptyMessage?: string;
  /** 行クリック時のハンドラ */
  onRowClick?: (row: T) => void;
  /** ヘッダー部分のタイトル */
  title?: string;
  /** ヘッダー右のアクション */
  headerActions?: ReactNode;
}

export function AdminTableBlock<T extends Record<string, unknown>>({
  data,
  columns,
  getRowKey,
  isLoading = false,
  emptyMessage = 'データがありません',
  onRowClick,
  title,
  headerActions,
}: AdminTableBlockProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] overflow-hidden">
      {(title || headerActions) && (
        <div className="px-4 py-3 border-b border-[var(--aio-border)] flex items-center justify-between">
          {title && (
            <h3 className="text-sm font-medium text-[var(--aio-text)]">{title}</h3>
          )}
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}
      <table className="min-w-full divide-y divide-[var(--aio-border)]">
        <thead className="bg-[var(--aio-surface-secondary)]">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`px-4 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--aio-border)]">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-[var(--aio-text-muted)]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={getRowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer hover:bg-[var(--aio-surface-secondary)]' : ''}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`px-4 py-3 text-sm text-[var(--aio-text)] ${col.className || ''}`}
                  >
                    {col.render
                      ? col.render(row)
                      : String(row[col.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
