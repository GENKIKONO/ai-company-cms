'use client';

/**
 * Posts Management Page - 新アーキテクチャ版
 *
 * 使用コンポーネント:
 * - DashboardPageShell: 認証・権限・エラーハンドリング
 * - useDashboardData: データ取得
 * - useDashboardMutation: 削除処理
 */

import Link from 'next/link';
import { useCallback } from 'react';
import { ROUTES } from '@/lib/routes';
import type { Post } from '@/types/legacy/database';
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
  StatusBadge,
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

const DocumentIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

// =====================================================
// MAIN PAGE COMPONENT
// =====================================================

export default function PostsManagementPage() {
  return (
    <DashboardPageShell
      title="記事管理"
      requiredRole="viewer"
      featureFlag="posts"
      loadingSkeleton={<PostsLoadingSkeleton />}
    >
      <PostsContent />
    </DashboardPageShell>
  );
}

// =====================================================
// CONTENT COMPONENT
// =====================================================

function PostsContent() {
  const { organizationId, organization, userRole } = useDashboardPageContext();

  // Data fetching
  const {
    data: posts,
    isLoading,
    error: fetchError,
    isEmpty,
    totalCount,
    refresh,
  } = useDashboardData<Post>('posts', {
    organizationId: organizationId || undefined,
    userRole,
  });

  // Mutation (for delete)
  const {
    remove,
    isDeleting,
    error: mutationError,
    canDelete,
    clearError,
  } = useDashboardMutation<Record<string, unknown>, Record<string, unknown>>('posts', {
    organizationId: organizationId || undefined,
    userRole,
    onSuccess: () => {
      refresh();
    },
  });

  // Delete handler
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('この記事を削除しますか？')) return;
    await remove(id);
  }, [remove]);

  // Combined error
  const error = fetchError || mutationError;

  // Build public URL
  const publicUrl = organization?.slug
    ? `/o/${organization.slug}/posts`
    : null;

  return (
    <>
      {/* Header */}
      <DashboardPageHeader
        title="記事管理"
        description="ブログ記事やニュースを管理します"
        backLink={{
          href: ROUTES.dashboard,
          label: 'ダッシュボード',
        }}
        actions={
          <>
            {publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <DashboardButton
                  variant="secondary"
                  leftIcon={<ExternalLinkIcon />}
                >
                  記事一覧を表示
                </DashboardButton>
              </a>
            )}
            <Link href={ROUTES.dashboardPostsNew}>
              <DashboardButton
                variant="primary"
                leftIcon={<PlusIcon />}
              >
                新しい記事
              </DashboardButton>
            </Link>
          </>
        }
      />

      {/* Error Alert */}
      {error && (
        <DashboardAlert
          variant="error"
          title="エラーが発生しました"
          description={error}
          action={{
            label: 'エラーをクリア',
            onClick: clearError,
          }}
          className="mb-6"
        />
      )}

      {/* Content */}
      {isLoading ? (
        <PostsLoadingSkeleton />
      ) : isEmpty ? (
        <DashboardEmptyState
          icon={<DocumentIcon />}
          title="記事がありません"
          description="最初の記事を作成してみましょう。"
          action={{
            label: '記事を作成',
            href: ROUTES.dashboardPostsNew,
          }}
        />
      ) : (
        <DashboardCard padding="none">
          <DashboardCardHeader className="px-6 py-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              記事一覧 ({totalCount}件)
            </h2>
          </DashboardCardHeader>
          <DashboardCardContent className="pt-0">
            <div className="divide-y divide-[var(--dashboard-card-border)]">
              {posts.map((post) => (
                <PostListItem
                  key={post.id}
                  post={post}
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
// LIST ITEM COMPONENT
// =====================================================

interface PostListItemProps {
  post: Post;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  canDelete: boolean;
}

function PostListItem({ post, onDelete, isDeleting, canDelete }: PostListItemProps) {
  // Map status to StatusBadge status type
  const getStatusBadgeStatus = (status: string): 'draft' | 'published' => {
    return status === 'published' ? 'published' : 'draft';
  };

  // 日付の安全なフォーマット
  const formatDate = (dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('ja-JP');
    } catch {
      return null;
    }
  };
  const createdAtFormatted = formatDate(post.created_at);
  const updatedAtFormatted = formatDate(post.updated_at);
  const publishedAtFormatted = formatDate(post.published_at);
  const showUpdatedAt = updatedAtFormatted && post.updated_at !== post.created_at;

  return (
    <div className="p-6 hover:bg-[var(--aio-muted)]/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] truncate">
            {post.title}
          </h3>
          <div className="mt-2 flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
            <span>スラッグ: {post.slug}</span>
            <StatusBadge status={getStatusBadgeStatus(post.status)} />
          </div>
          <div className="mt-2 text-sm text-[var(--color-text-tertiary)]">
            {createdAtFormatted && <span>作成: {createdAtFormatted}</span>}
            {showUpdatedAt && (
              <span className="ml-4">更新: {updatedAtFormatted}</span>
            )}
            {publishedAtFormatted && (
              <span className="ml-4">公開: {publishedAtFormatted}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/dashboard/posts/${post.id}/edit`}>
            <DashboardButton variant="primary" size="sm">
              編集
            </DashboardButton>
          </Link>
          {canDelete && (
            <DashboardButton
              variant="danger"
              size="sm"
              onClick={() => onDelete(post.id)}
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

function PostsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <DashboardLoadingCard lines={2} showHeader />
      <DashboardLoadingCard lines={2} showHeader />
      <DashboardLoadingCard lines={2} showHeader />
    </div>
  );
}
