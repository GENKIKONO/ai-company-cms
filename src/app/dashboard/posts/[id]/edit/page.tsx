'use client';

/**
 * Edit Post Page - 記事編集ページ
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { DashboardPageShell } from '@/components/dashboard';
import {
  DashboardPageHeader,
  DashboardButton,
  DashboardAlert,
} from '@/components/dashboard/ui';
import { logger } from '@/lib/utils/logger';

interface Post {
  id: string;
  title: string;
  content?: string;
  content_markdown?: string;
  slug: string;
  status: 'draft' | 'published';
  is_published?: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export default function EditPostPage() {
  return (
    <DashboardPageShell title="記事編集" requiredRole="editor">
      <EditPostContent />
    </DashboardPageShell>
  );
}

function EditPostContent() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    slug: '',
    status: 'draft' as 'draft' | 'published',
  });

  const fetchPost = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('記事が見つかりません');
        } else {
          setError('記事の読み込みに失敗しました');
        }
        return;
      }

      const result = await response.json();
      const postData = result.data;

      setPost(postData);
      setFormData({
        title: postData.title || '',
        content: postData.content_markdown || postData.content || postData.body || '',
        slug: postData.slug || '',
        status: postData.status || 'draft',
      });
    } catch (err) {
      setError('記事の読み込みに失敗しました');
      logger.error('Failed to fetch post', { data: err });
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/my/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          content_markdown: formData.content,
          slug: formData.slug || undefined,
          status: formData.status,
          is_published: formData.status === 'published',
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));

        if (response.status === 401) {
          setError('認証が必要です。ログインし直してください。');
          return;
        }

        if (response.status === 404) {
          setError('記事が見つかりません。');
          return;
        }

        if (response.status === 400 && result.code === 'DUPLICATE_SLUG') {
          setError('このスラッグは既に使用されています。別のスラッグを使用してください。');
          return;
        }

        setError(result.error || result.message || '更新に失敗しました');
        return;
      }

      const result = await response.json();

      if (result.ok !== false && result.data) {
        router.replace(ROUTES.dashboardPosts);
      } else {
        setError(result.error || '更新に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      logger.error('Failed to update post', { data: err });
    } finally {
      setSaving(false);
    }
  }, [postId, formData, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)]"></div>
        <span className="ml-3 text-[var(--color-text-secondary)]">読み込み中...</span>
      </div>
    );
  }

  if (!post && !loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">記事が見つかりません</h2>
          <Link
            href={ROUTES.dashboardPosts}
            className="mt-4 text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] inline-block"
          >
            記事一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardPageHeader
        title="記事編集"
        description="記事の情報を更新してください"
        backLink={{ href: ROUTES.dashboardPosts, label: '記事一覧' }}
      />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              タイトル *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="記事のタイトルを入力"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              スラッグ
            </label>
            <input
              type="text"
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="URL用のスラッグ"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              内容 *
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={12}
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="記事の内容を入力（Markdown形式）"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              ステータス
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
            >
              <option value="draft">下書き</option>
              <option value="published">公開</option>
            </select>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              公開にすると企業ページに表示され、検索エンジンからも見つけられるようになります
            </p>
          </div>

          {error && (
            <DashboardAlert
              variant="error"
              title="エラー"
              description={error}
            />
          )}

          <div className="flex space-x-4">
            <DashboardButton
              type="submit"
              variant="primary"
              disabled={saving}
            >
              {saving ? '更新中...' : '更新'}
            </DashboardButton>
            <Link
              href={ROUTES.dashboardPosts}
              className="bg-[var(--dashboard-card-border)] text-[var(--color-text-secondary)] px-6 py-2 rounded-md hover:bg-[var(--table-row-hover)] inline-block text-center"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
