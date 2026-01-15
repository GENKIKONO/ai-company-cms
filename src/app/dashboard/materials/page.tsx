'use client';

/**
 * Materials Management Page - 新アーキテクチャ版
 */

import Link from 'next/link';
import { useCallback } from 'react';
import type { SalesMaterial } from '@/types/domain/sales';
import {
  DashboardPageShell,
  useDashboardPageContext,
} from '@/components/dashboard';
import {
  DashboardPageHeader,
  DashboardCard,
  DashboardCardHeader,
  DashboardCardContent,
  DashboardButton,
  DashboardAlert,
  DashboardEmptyState,
  DashboardLoadingCard,
  DashboardBadge,
} from '@/components/dashboard/ui';
import { useDashboardData, useDashboardMutation } from '@/hooks/dashboard';

// =====================================================
// ICONS
// =====================================================

const DocumentIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// =====================================================
// MAIN PAGE
// =====================================================

export default function MaterialsManagementPage() {
  return (
    <DashboardPageShell
      title="営業資料管理"
      requiredRole="viewer"
      loadingSkeleton={<ListLoadingSkeleton />}
    >
      <MaterialsContent />
    </DashboardPageShell>
  );
}

// =====================================================
// CONTENT
// =====================================================

function MaterialsContent() {
  const { organizationId, userRole } = useDashboardPageContext();

  const {
    data: materials,
    isLoading,
    error: fetchError,
    isEmpty,
    totalCount,
    refresh,
  } = useDashboardData<SalesMaterial>('sales_materials', {
    organizationId: organizationId || undefined,
    userRole,
  });

  const {
    remove,
    isDeleting,
    error: mutationError,
    canDelete,
    clearError,
  } = useDashboardMutation('sales_materials', {
    organizationId: organizationId || undefined,
    userRole,
    onSuccess: () => refresh(),
  });

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('この営業資料を削除しますか？')) return;
    await remove(id);
  }, [remove]);

  const error = fetchError || mutationError;

  return (
    <>
      <DashboardPageHeader
        title="営業資料管理"
        description="営業資料をアップロード・管理します"
        backLink={{ href: '/dashboard', label: 'ダッシュボード' }}
      />

      {error && (
        <DashboardAlert
          variant="error"
          title="エラーが発生しました"
          description={error}
          action={{ label: 'クリア', onClick: clearError }}
          className="mb-6"
        />
      )}

      {isLoading ? (
        <ListLoadingSkeleton />
      ) : isEmpty ? (
        <DashboardEmptyState
          icon={<DocumentIcon />}
          title="営業資料がありません"
          description="営業資料をアップロードして管理を始めましょう。"
        />
      ) : (
        <DashboardCard padding="none">
          <DashboardCardHeader className="px-6 py-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              営業資料一覧 ({totalCount}件)
            </h2>
          </DashboardCardHeader>
          <DashboardCardContent className="pt-0">
            <div className="divide-y divide-[var(--dashboard-card-border)]">
              {materials.map((material) => (
                <MaterialListItem
                  key={material.id}
                  material={material}
                  onDelete={handleDelete}
                  isDeleting={isDeleting}
                  canDelete={canDelete}
                />
              ))}
            </div>
          </DashboardCardContent>
        </DashboardCard>
      )}
    </>
  );
}

// =====================================================
// LIST ITEM
// =====================================================

interface MaterialListItemProps {
  material: SalesMaterial;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  canDelete: boolean;
}

function MaterialListItem({ material, onDelete, isDeleting, canDelete }: MaterialListItemProps) {
  // ファイルサイズを読みやすい形式に変換
  const formatFileSize = (bytes?: number | null): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // MIMEタイプから拡張子を抽出
  const getFileExtension = (mimeType?: string | null): string => {
    if (!mimeType) return '';
    return mimeType.split('/').pop() || mimeType;
  };

  return (
    <div className="p-6 hover:bg-[var(--aio-muted)]/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link
            href={`/dashboard/materials/${material.id}`}
            className="text-lg font-medium text-[var(--color-text-primary)] hover:text-[var(--aio-primary)] truncate block"
          >
            {material.title}
          </Link>
          <div className="mt-2 flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
            {material.mime_type && (
              <DashboardBadge variant="default">{getFileExtension(material.mime_type)}</DashboardBadge>
            )}
            {material.size_bytes && (
              <span>サイズ: {formatFileSize(material.size_bytes)}</span>
            )}
            <span>アップロード: {new Date(material.created_at).toLocaleDateString('ja-JP')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/dashboard/materials/${material.id}`}>
            <DashboardButton variant="primary" size="sm">表示</DashboardButton>
          </Link>
          {canDelete && (
            <DashboardButton
              variant="danger"
              size="sm"
              onClick={() => onDelete(material.id)}
              loading={isDeleting}
            >
              削除
            </DashboardButton>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// LOADING SKELETON
// =====================================================

function ListLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <DashboardLoadingCard lines={2} showHeader />
      <DashboardLoadingCard lines={2} showHeader />
      <DashboardLoadingCard lines={2} showHeader />
    </div>
  );
}
