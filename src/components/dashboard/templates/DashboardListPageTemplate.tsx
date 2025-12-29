'use client';

/**
 * DashboardListPageTemplate - 一覧ページテンプレート
 *
 * @description
 * データ一覧を表示するページの標準テンプレート
 *
 * 含まれる機能:
 * - 認証・権限チェック（DashboardPageShell）
 * - データ取得（useDashboardData）
 * - CRUD操作（useDashboardMutation）
 * - ローディング・エラー・空状態の統一表示
 *
 * @example
 * // 使用例（新規ページ作成時）
 * import { DashboardListPageTemplate } from '@/components/dashboard/templates/DashboardListPageTemplate';
 *
 * export default function PostsPage() {
 *   return (
 *     <DashboardListPageTemplate
 *       dataSource="posts"
 *       title="投稿管理"
 *       description="ブログ記事を管理します"
 *       columns={[
 *         { key: 'title', label: 'タイトル' },
 *         { key: 'status', label: 'ステータス' },
 *         { key: 'created_at', label: '作成日' },
 *       ]}
 *       createPath="/dashboard/posts/new"
 *     />
 *   );
 * }
 */

import React from 'react';
import {
  DashboardPageShell,
  useDashboardPageContext,
  DashboardPageHeader,
  DashboardCard,
  DashboardTable,
  DashboardTableHead,
  DashboardTableBody,
  DashboardTableRow,
  DashboardTableHeaderCell,
  DashboardTableCell,
  DashboardTableEmpty,
  DashboardButton,
  DashboardLoadingState,
  DashboardAlert,
  StatusBadge,
} from '@/components/dashboard';
import { useDashboardData } from '@/hooks/dashboard';
import { getDataSource, type DataSourceKey } from '@/config/data-sources';
import type { UserRole } from '@/types/utils/database';

// =====================================================
// TYPES
// =====================================================

export interface ColumnDefinition {
  /** データキー */
  key: string;
  /** 表示ラベル */
  label: string;
  /** カスタムレンダラー */
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  /** ソート可能か */
  sortable?: boolean;
  /** 強調表示 */
  emphasis?: boolean;
}

export interface DashboardListPageTemplateProps {
  /** データソースキー */
  dataSource: DataSourceKey | string;
  /** ページタイトル */
  title: string;
  /** ページ説明 */
  description?: string;
  /** テーブルカラム定義 */
  columns: ColumnDefinition[];
  /** 新規作成ページへのパス */
  createPath?: string;
  /** 新規作成ボタンのラベル */
  createLabel?: string;
  /** 行クリック時のコールバック */
  onRowClick?: (row: Record<string, unknown>) => void;
  /** 行アクション */
  rowActions?: (row: Record<string, unknown>) => React.ReactNode;
  /** 必要な権限 */
  requiredRole?: UserRole;
  /** 追加のフィルター */
  filters?: Record<string, unknown>;
  /** リアルタイム更新を有効化 */
  realtime?: boolean;
}

// =====================================================
// INTERNAL COMPONENT
// =====================================================

function ListPageContent({
  dataSource,
  title,
  description,
  columns,
  createPath,
  createLabel = '新規作成',
  onRowClick,
  rowActions,
  filters,
  realtime,
}: Omit<DashboardListPageTemplateProps, 'requiredRole'>) {
  const { organizationId, userRole } = useDashboardPageContext();

  // Fetch data
  const {
    data,
    isLoading,
    error,
    isEmpty,
    refresh,
  } = useDashboardData(dataSource, {
    organizationId: organizationId || undefined,
    userRole,
    filters,
    realtime,
  });

  // Get data source config for UI
  const config = getDataSource(dataSource);

  // Loading state
  if (isLoading) {
    return <DashboardLoadingState message="データを読み込んでいます..." />;
  }

  // Error state
  if (error) {
    return (
      <DashboardAlert
        variant="error"
        title="エラーが発生しました"
        description={error}
        action={{ label: '再読み込み', onClick: refresh }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <DashboardPageHeader
        title={title}
        description={description}
        actions={
          createPath && (
            <DashboardButton
              variant="primary"
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
              onClick={() => window.location.href = createPath}
            >
              {createLabel}
            </DashboardButton>
          )
        }
      />

      {/* Data Table */}
      <DashboardCard padding="none">
        <DashboardTable>
          <DashboardTableHead>
            <DashboardTableRow>
              {columns.map((col) => (
                <DashboardTableHeaderCell
                  key={col.key}
                  sortable={col.sortable}
                >
                  {col.label}
                </DashboardTableHeaderCell>
              ))}
              {rowActions && (
                <DashboardTableHeaderCell>操作</DashboardTableHeaderCell>
              )}
            </DashboardTableRow>
          </DashboardTableHead>
          <DashboardTableBody>
            {isEmpty ? (
              <DashboardTableEmpty
                colSpan={columns.length + (rowActions ? 1 : 0)}
                title={config?.ui?.emptyMessage || 'データがありません'}
                description="新しいデータを作成してください"
                action={
                  createPath && (
                    <DashboardButton
                      variant="primary"
                      size="sm"
                      onClick={() => window.location.href = createPath}
                    >
                      {createLabel}
                    </DashboardButton>
                  )
                }
              />
            ) : (
              data.map((row, index) => (
                <DashboardTableRow
                  key={(row as Record<string, unknown>).id as string || index}
                  interactive={!!onRowClick}
                  onClick={() => onRowClick?.(row as Record<string, unknown>)}
                >
                  {columns.map((col) => (
                    <DashboardTableCell key={col.key} emphasis={col.emphasis}>
                      {col.render
                        ? col.render((row as Record<string, unknown>)[col.key], row as Record<string, unknown>)
                        : renderCellValue((row as Record<string, unknown>)[col.key])}
                    </DashboardTableCell>
                  ))}
                  {rowActions && (
                    <DashboardTableCell>
                      {rowActions(row as Record<string, unknown>)}
                    </DashboardTableCell>
                  )}
                </DashboardTableRow>
              ))
            )}
          </DashboardTableBody>
        </DashboardTable>
      </DashboardCard>
    </div>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function DashboardListPageTemplate({
  requiredRole = 'viewer',
  ...props
}: DashboardListPageTemplateProps) {
  return (
    <DashboardPageShell
      requiredRole={requiredRole}
      title={props.title}
    >
      <ListPageContent {...props} />
    </DashboardPageShell>
  );
}

// =====================================================
// UTILITIES
// =====================================================

function renderCellValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-[var(--color-text-tertiary)]">-</span>;
  }

  if (typeof value === 'boolean') {
    return value ? '有効' : '無効';
  }

  if (value instanceof Date) {
    return value.toLocaleDateString('ja-JP');
  }

  if (typeof value === 'string') {
    // Check if it's a date string
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return new Date(value).toLocaleDateString('ja-JP');
    }

    // Check if it's a status
    if (['active', 'inactive', 'pending', 'draft', 'published', 'archived', 'error'].includes(value)) {
      return <StatusBadge status={value as 'active' | 'inactive' | 'pending' | 'draft' | 'published' | 'archived' | 'error'} />;
    }
  }

  return String(value);
}

export default DashboardListPageTemplate;
