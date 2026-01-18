'use client';

/**
 * New FAQ Page - 新アーキテクチャ版
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageShell } from '@/components/dashboard';
import {
  DashboardPageHeader,
  DashboardCard,
  DashboardCardContent,
  DashboardButton,
  DashboardAlert,
} from '@/components/dashboard/ui';

export default function NewFAQPage() {
  return (
    <DashboardPageShell
      title="新しいFAQ"
      requiredRole="editor"
    >
      <NewFAQContent />
    </DashboardPageShell>
  );
}

function NewFAQContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      question: formData.get('question')?.toString() || '',
      answer: formData.get('answer')?.toString() || ''
    };

    try {
      const response = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.ok) {
        router.replace('/dashboard/faqs');
      } else {
        setError(result.error || '作成に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DashboardPageHeader
        title="新しいFAQ"
        description="よくある質問の情報を入力してください"
        backLink={{ href: '/dashboard/faqs', label: 'FAQ一覧' }}
      />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              質問 *
            </label>
            <input
              type="text"
              id="question"
              name="question"
              required
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="質問を入力"
            />
          </div>

          <div>
            <label htmlFor="answer" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              回答 *
            </label>
            <textarea
              id="answer"
              name="answer"
              required
              rows={6}
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="回答を入力"
            />
          </div>

          {error && (
            <DashboardAlert
              variant="error"
              title="エラー"
              description={error}
              className="mb-4"
            />
          )}

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-[var(--aio-primary)] text-white px-6 py-2 rounded-md hover:bg-[var(--aio-primary-hover)] disabled:opacity-50"
            >
              {loading ? '作成中...' : '作成'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-[var(--dashboard-card-border)] text-[var(--color-text-secondary)] px-6 py-2 rounded-md hover:bg-[var(--table-row-hover)]"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </>
  );
}