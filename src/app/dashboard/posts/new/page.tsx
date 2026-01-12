'use client';

/**
 * New Post Page - 新アーキテクチャ版
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardPageShell } from '@/components/dashboard';
import {
  DashboardPageHeader,
  DashboardCard,
  DashboardCardContent,
  DashboardButton,
  DashboardAlert,
} from '@/components/dashboard/ui';

export default function NewPostPage() {
  return (
    <DashboardPageShell
      title="新しい記事"
      requiredRole="editor"
    >
      <NewPostContent />
    </DashboardPageShell>
  );
}

function NewPostContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title')?.toString() || '',
      content: formData.get('content')?.toString() || '',
      slug: formData.get('slug')?.toString() || '',
      status: formData.get('status')?.toString() || 'draft'
    };

    try {
      const response = await fetch('/api/my/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          content_markdown: data.content,
          is_published: data.status === 'published'
        })
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          setError('認証が必要です。ログインし直してください。');
          return;
        }
        
        if (response.status === 404 && result.code === 'ORG_NOT_FOUND') {
          setError('企業情報が見つかりません。先に企業情報を作成してください。');
        } else if (response.status === 400 && result.code === 'DUPLICATE_SLUG') {
          setError('このスラッグは既に使用されています。別のスラッグを使用してください。');
        } else if (response.status >= 500) {
          const errorMsg = result.error || 'サーバーエラーが発生しました。しばらく後にお試しください。';
          const logDetails = result.code ? ` (${result.code})` : '';
          // Server error details logged
          // status: response.status, error: result.error, code: result.code
          setError(errorMsg + logDetails);
        } else {
          setError(result.error || result.message || '作成に失敗しました');
        }
        return;
      }

      const result = await response.json();
      
      if (result.data) {
        router.replace('/dashboard/posts');
      } else {
        setError(result.error || result.message || '作成に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link
        href="/dashboard/posts"
        className="inline-flex items-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4"
      >
        ← 記事一覧に戻る
      </Link>

      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">新しい記事</h1>
          <p className="text-[var(--color-text-secondary)] mt-2">記事の情報を入力してください</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            タイトル *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="記事のタイトルを入力"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            スラッグ（オプション）
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="URL用のスラッグ（空の場合は自動生成）"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            内容 *
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={8}
            className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="記事の内容を入力（Markdown形式）"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            ステータス
          </label>
          <select
            id="status"
            name="status"
            className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="draft">下書き</option>
            <option value="published">公開</option>
          </select>
        </div>

        {error && (
          <div className="bg-[var(--aio-danger-muted)] border border-[var(--dashboard-card-border)] rounded-md p-4">
            <p className="text-[var(--aio-danger)] text-sm">{error}</p>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-[var(--aio-purple)] text-white px-6 py-2 rounded-md hover:bg-[var(--aio-purple)] disabled:opacity-50"
          >
            {loading ? '作成中...' : '作成'}
          </button>
          <Link
            href="/dashboard/posts"
            className="bg-[var(--dashboard-card-border)] text-[var(--color-text-secondary)] px-6 py-2 rounded-md hover:bg-[var(--table-row-hover)] inline-block text-center"
            replace
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}