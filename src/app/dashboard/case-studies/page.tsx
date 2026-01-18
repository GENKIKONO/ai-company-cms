'use client';

/**
 * Case Studies Management Page - 新アーキテクチャ版
 */

import Link from 'next/link';
import { useCallback } from 'react';
import { ROUTES } from '@/lib/routes';
import type { CaseStudy } from '@/types/legacy/database';
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

const CaseStudyIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

export default function CaseStudiesManagementPage() {
  return (
    <DashboardPageShell
      title="事例管理"
      requiredRole="viewer"
      featureFlag="case_studies"
      loadingSkeleton={<ListLoadingSkeleton />}
    >
      <CaseStudiesContent />
    </DashboardPageShell>
  );
}

// =====================================================
// CONTENT
// =====================================================

function CaseStudiesContent() {
  const { organizationId, organization, userRole } = useDashboardPageContext();

  const {
    data: caseStudies,
    isLoading,
    error: fetchError,
    isEmpty,
    totalCount,
    refresh,
  } = useDashboardData<CaseStudy>('case_studies', {
    organizationId: organizationId || undefined,
    userRole,
  });

  const {
    remove,
    isDeleting,
    error: mutationError,
    canDelete,
    clearError,
  } = useDashboardMutation('case_studies', {
    organizationId: organizationId || undefined,
    userRole,
    onSuccess: () => refresh(),
  });

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('この事例を削除しますか？')) return;
    await remove(id);
  }, [remove]);

  const error = fetchError || mutationError;
  const publicUrl = organization?.slug ? `/o/${organization.slug}/case-studies` : null;

  return (
    <>
      <DashboardPageHeader
        title="事例管理"
        description="成功事例・実績を管理します"
        backLink={{ href: ROUTES.dashboard, label: 'ダッシュボード' }}
        actions={
          <>
            {publicUrl && (
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <DashboardButton variant="secondary" leftIcon={<ExternalLinkIcon />}>
                  事例一覧を表示
                </DashboardButton>
              </a>
            )}
            <Link href={ROUTES.dashboardCaseStudiesNew}>
              <DashboardButton variant="primary" leftIcon={<PlusIcon />}>
                新しい事例
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
          icon={<CaseStudyIcon />}
          title="事例がありません"
          description="最初の事例を作成してみましょう。"
          action={{ label: '事例を作成', href: ROUTES.dashboardCaseStudiesNew }}
        />
      ) : (
        <DashboardCard padding="none">
          <DashboardCardHeader className="px-6 py-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              事例一覧 ({totalCount}件)
            </h2>
          </DashboardCardHeader>
          <DashboardCardContent className="pt-0">
            <div className="divide-y divide-[var(--dashboard-card-border)]">
              {caseStudies.map((caseStudy) => (
                <CaseStudyListItem
                  key={caseStudy.id}
                  caseStudy={caseStudy}
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

interface CaseStudyListItemProps {
  caseStudy: CaseStudy;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  canDelete: boolean;
}

function CaseStudyListItem({ caseStudy, onDelete, isDeleting, canDelete }: CaseStudyListItemProps) {
  // 日付の安全なフォーマット
  const formatDate = (dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('ja-JP');
    } catch {
      return null;
    }
  };
  const createdAtFormatted = formatDate(caseStudy.created_at);
  const updatedAtFormatted = formatDate(caseStudy.updated_at);
  const showUpdatedAt = updatedAtFormatted && caseStudy.updated_at !== caseStudy.created_at;

  // tags の安全なチェック（null と [] の両方を考慮）
  const hasTags = Array.isArray(caseStudy.tags) && caseStudy.tags.length > 0;

  return (
    <div className="p-6 hover:bg-[var(--aio-muted)]/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] truncate">
            {caseStudy.title}
          </h3>
          {caseStudy.problem && caseStudy.problem.trim() !== '' && (
            <div className="mt-2">
              <h4 className="text-sm font-medium text-[var(--color-text-secondary)]">課題</h4>
              <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mt-1">
                {caseStudy.problem}
              </p>
            </div>
          )}
          {caseStudy.solution && caseStudy.solution.trim() !== '' && (
            <div className="mt-2">
              <h4 className="text-sm font-medium text-[var(--color-text-secondary)]">解決策</h4>
              <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mt-1">
                {caseStudy.solution}
              </p>
            </div>
          )}
          {hasTags && (
            <div className="mt-2 flex flex-wrap gap-1">
              {caseStudy.tags.map((tag, index) => (
                <DashboardBadge key={index} variant="warning" size="sm">
                  {tag}
                </DashboardBadge>
              ))}
            </div>
          )}
          <div className="mt-2 text-sm text-[var(--color-text-tertiary)]">
            {createdAtFormatted && <span>作成: {createdAtFormatted}</span>}
            {showUpdatedAt && (
              <span className="ml-4">更新: {updatedAtFormatted}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/dashboard/case-studies/${caseStudy.id}/edit`}>
            <DashboardButton variant="primary" size="sm">編集</DashboardButton>
          </Link>
          {canDelete && (
            <DashboardButton
              variant="danger"
              size="sm"
              onClick={() => onDelete(caseStudy.id)}
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
      <DashboardLoadingCard lines={4} showHeader />
      <DashboardLoadingCard lines={4} showHeader />
      <DashboardLoadingCard lines={4} showHeader />
    </div>
  );
}
