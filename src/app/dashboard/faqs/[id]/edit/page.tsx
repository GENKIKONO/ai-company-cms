'use client';

/**
 * Edit FAQ Page - FAQ編集ページ
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

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order_index?: number;
  is_published?: boolean;
  created_at: string;
  updated_at: string;
}

export default function EditFAQPage() {
  return (
    <DashboardPageShell title="FAQ編集" requiredRole="editor">
      <EditFAQContent />
    </DashboardPageShell>
  );
}

function EditFAQContent() {
  const router = useRouter();
  const params = useParams();
  const faqId = params.id as string;

  const [faq, setFaq] = useState<FAQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    is_published: true,
  });

  const fetchFAQ = useCallback(async () => {
    try {
      const response = await fetch(`/api/my/faqs/${faqId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('FAQが見つかりません');
        } else {
          setError('FAQの読み込みに失敗しました');
        }
        return;
      }

      const result = await response.json();
      const data = result.data;

      setFaq(data);
      setFormData({
        question: data.question || '',
        answer: data.answer || '',
        category: data.category || '',
        is_published: data.is_published ?? true,
      });
    } catch (err) {
      setError('FAQの読み込みに失敗しました');
      logger.error('Failed to fetch FAQ', { data: err });
    } finally {
      setLoading(false);
    }
  }, [faqId]);

  useEffect(() => {
    fetchFAQ();
  }, [fetchFAQ]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/my/faqs/${faqId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: formData.question,
          answer: formData.answer,
          category: formData.category || undefined,
          is_published: formData.is_published,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));

        if (response.status === 401) {
          setError('認証が必要です。ログインし直してください。');
          return;
        }

        if (response.status === 404) {
          setError('FAQが見つかりません。');
          return;
        }

        setError(result.error || result.message || '更新に失敗しました');
        return;
      }

      const result = await response.json();

      if (result.data) {
        router.replace(ROUTES.dashboardFaqs);
      } else {
        setError(result.error || '更新に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      logger.error('Failed to update FAQ', { data: err });
    } finally {
      setSaving(false);
    }
  }, [faqId, formData, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)]"></div>
        <span className="ml-3 text-[var(--color-text-secondary)]">読み込み中...</span>
      </div>
    );
  }

  if (!faq && !loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">FAQが見つかりません</h2>
          <Link
            href={ROUTES.dashboardFaqs}
            className="mt-4 text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] inline-block"
          >
            FAQ一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardPageHeader
        title="FAQ編集"
        description="FAQの情報を更新してください"
        backLink={{ href: ROUTES.dashboardFaqs, label: 'FAQ一覧' }}
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
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
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
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              required
              rows={6}
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="回答を入力"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              カテゴリ
            </label>
            <input
              type="text"
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="カテゴリを入力（任意）"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="h-4 w-4 text-[var(--aio-primary)] focus:ring-[var(--aio-primary)] border-[var(--input-border)] rounded"
              />
              <span className="ml-2 text-sm text-[var(--color-text-secondary)]">公開する</span>
            </label>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              公開にすると企業ページに表示されます
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
              href={ROUTES.dashboardFaqs}
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
