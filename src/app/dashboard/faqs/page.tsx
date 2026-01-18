'use client';

/**
 * FAQs Management Page - 新アーキテクチャ版
 */

import Link from 'next/link';
import { useCallback } from 'react';
import { ROUTES } from '@/lib/routes';
import type { FAQ } from '@/types/legacy/database';
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

const FAQIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

export default function FAQsManagementPage() {
  return (
    <DashboardPageShell
      title="FAQ管理"
      requiredRole="viewer"
      featureFlag="faqs"
      loadingSkeleton={<ListLoadingSkeleton />}
    >
      <FAQsContent />
    </DashboardPageShell>
  );
}

// =====================================================
// CONTENT
// =====================================================

function FAQsContent() {
  const { organizationId, organization, userRole } = useDashboardPageContext();

  const {
    data: faqs,
    isLoading,
    error: fetchError,
    isEmpty,
    totalCount,
    refresh,
  } = useDashboardData<FAQ>('faqs', {
    organizationId: organizationId || undefined,
    userRole,
  });

  const {
    remove,
    isDeleting,
    error: mutationError,
    canDelete,
    clearError,
  } = useDashboardMutation('faqs', {
    organizationId: organizationId || undefined,
    userRole,
    onSuccess: () => refresh(),
  });

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('このFAQを削除しますか？')) return;
    await remove(id);
  }, [remove]);

  const error = fetchError || mutationError;
  const publicUrl = organization?.slug ? `/o/${organization.slug}/faq` : null;

  return (
    <>
      <DashboardPageHeader
        title="FAQ管理"
        description="お客様からよくある簡単な質問と回答を管理します。詳しい解説が必要な場合はナレッジベース機能をご利用ください。"
        backLink={{ href: ROUTES.dashboard, label: 'ダッシュボード' }}
        actions={
          <>
            {publicUrl && (
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <DashboardButton variant="secondary" leftIcon={<ExternalLinkIcon />}>
                  FAQを表示
                </DashboardButton>
              </a>
            )}
            <Link href={ROUTES.dashboardFaqsNew}>
              <DashboardButton variant="primary" leftIcon={<PlusIcon />}>
                新しいFAQ
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
          icon={<FAQIcon />}
          title="FAQがありません"
          description="お客様からよくある簡単な質問と回答を登録しましょう。"
          action={{ label: 'FAQを作成', href: ROUTES.dashboardFaqsNew }}
        />
      ) : (
        <DashboardCard padding="none">
          <DashboardCardHeader className="px-6 py-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              FAQ一覧 ({totalCount}件)
            </h2>
          </DashboardCardHeader>
          <DashboardCardContent className="pt-0">
            <div className="divide-y divide-[var(--dashboard-card-border)]">
              {faqs.map((faq) => (
                <FAQListItem
                  key={faq.id}
                  faq={faq}
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

interface FAQListItemProps {
  faq: FAQ;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  canDelete: boolean;
}

function FAQListItem({ faq, onDelete, isDeleting, canDelete }: FAQListItemProps) {
  // 日付の安全なフォーマット
  const formatDate = (dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('ja-JP');
    } catch {
      return null;
    }
  };
  const createdAtFormatted = formatDate(faq.created_at);
  const updatedAtFormatted = formatDate(faq.updated_at);
  const showUpdatedAt = updatedAtFormatted && faq.updated_at !== faq.created_at;

  // answer の安全なチェック
  const hasAnswer = faq.answer && faq.answer.trim() !== '';

  return (
    <div className="p-6 hover:bg-[var(--aio-muted)]/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
            Q: {faq.question}
          </h3>
          {hasAnswer && (
            <div className="text-sm text-[var(--color-text-secondary)] mb-3">
              <strong>A:</strong> {faq.answer}
            </div>
          )}
          <div className="flex items-center gap-4 text-sm text-[var(--color-text-tertiary)]">
            {faq.category && faq.category.trim() !== '' && (
              <DashboardBadge variant="info">{faq.category}</DashboardBadge>
            )}
            {createdAtFormatted && <span>作成: {createdAtFormatted}</span>}
            {showUpdatedAt && (
              <span>更新: {updatedAtFormatted}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/dashboard/faqs/${faq.id}/edit`}>
            <DashboardButton variant="primary" size="sm">編集</DashboardButton>
          </Link>
          {canDelete && (
            <DashboardButton
              variant="danger"
              size="sm"
              onClick={() => onDelete(faq.id)}
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
      <DashboardLoadingCard lines={3} showHeader />
      <DashboardLoadingCard lines={3} showHeader />
      <DashboardLoadingCard lines={3} showHeader />
    </div>
  );
}
