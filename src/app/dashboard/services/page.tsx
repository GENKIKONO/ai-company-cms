'use client';

/**
 * Services Management Page - 新アーキテクチャ版
 */

import Link from 'next/link';
import { useCallback } from 'react';
import type { Service } from '@/types/legacy/database';
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

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const ServiceIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

// =====================================================
// MAIN PAGE
// =====================================================

export default function ServicesManagementPage() {
  return (
    <DashboardPageShell
      title="サービス管理"
      requiredRole="viewer"
      loadingSkeleton={<ListLoadingSkeleton />}
    >
      <ServicesContent />
    </DashboardPageShell>
  );
}

// =====================================================
// CONTENT
// =====================================================

function ServicesContent() {
  const { organizationId, organization, userRole } = useDashboardPageContext();

  const {
    data: services,
    isLoading,
    error: fetchError,
    isEmpty,
    totalCount,
    refresh,
  } = useDashboardData<Service>('services', {
    organizationId: organizationId || undefined,
    userRole,
  });

  const {
    remove,
    isDeleting,
    error: mutationError,
    canDelete,
    clearError,
  } = useDashboardMutation('services', {
    organizationId: organizationId || undefined,
    userRole,
    onSuccess: () => refresh(),
  });

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('このサービスを削除しますか？')) return;
    await remove(id);
  }, [remove]);

  const error = fetchError || mutationError;
  const publicUrl = organization?.slug ? `/o/${organization.slug}/services` : null;

  return (
    <>
      <DashboardPageHeader
        title="サービス管理"
        description="提供サービスを管理します"
        backLink={{ href: '/dashboard', label: 'ダッシュボード' }}
        actions={
          <>
            {publicUrl && (
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <DashboardButton variant="secondary" leftIcon={<ExternalLinkIcon />}>
                  サービス一覧を表示
                </DashboardButton>
              </a>
            )}
            <Link href="/dashboard/services/new">
              <DashboardButton variant="primary" leftIcon={<PlusIcon />}>
                新しいサービス
              </DashboardButton>
            </Link>
          </>
        }
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
          icon={<ServiceIcon />}
          title="サービスがありません"
          description="最初のサービスを作成してみましょう。"
          action={{ label: 'サービスを作成', href: '/dashboard/services/new' }}
        />
      ) : (
        <DashboardCard padding="none">
          <DashboardCardHeader className="px-6 py-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              サービス一覧 ({totalCount}件)
            </h2>
          </DashboardCardHeader>
          <DashboardCardContent className="pt-0">
            <div className="divide-y divide-[var(--dashboard-card-border)]">
              {services.map((service) => (
                <ServiceListItem
                  key={service.id}
                  service={service}
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

interface ServiceListItemProps {
  service: Service;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  canDelete: boolean;
}

function ServiceListItem({ service, onDelete, isDeleting, canDelete }: ServiceListItemProps) {
  // price の安全な数値変換（null/NaN/文字列対応）
  const p = service.price;
  const priceNumber =
    typeof p === 'string' ? Number(p) :
    typeof p === 'number' ? p : null;
  const hasPrice = priceNumber !== null && !Number.isNaN(priceNumber);

  // 日付の安全なフォーマット
  const formatDate = (dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('ja-JP');
    } catch {
      return null;
    }
  };
  const createdAtFormatted = formatDate(service.created_at);
  const updatedAtFormatted = formatDate(service.updated_at);
  const showUpdatedAt = updatedAtFormatted && service.updated_at !== service.created_at;

  return (
    <div className="p-6 hover:bg-[var(--aio-muted)]/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] truncate">
            {service.title}
          </h3>
          {service.description && (
            <p className="mt-1 text-sm text-[var(--color-text-secondary)] line-clamp-2">
              {service.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
            {service.category && (
              <DashboardBadge variant="default">{service.category}</DashboardBadge>
            )}
            {hasPrice && (
              <span>価格: ¥{priceNumber.toLocaleString()}</span>
            )}
            {service.duration_months && (
              <span>期間: {service.duration_months}ヶ月</span>
            )}
          </div>
          <div className="mt-2 text-sm text-[var(--color-text-tertiary)]">
            {createdAtFormatted && <span>作成: {createdAtFormatted}</span>}
            {showUpdatedAt && (
              <span className="ml-4">更新: {updatedAtFormatted}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/dashboard/services/${service.id}/edit`}>
            <DashboardButton variant="primary" size="sm">編集</DashboardButton>
          </Link>
          {canDelete && (
            <DashboardButton
              variant="danger"
              size="sm"
              onClick={() => onDelete(service.id)}
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
