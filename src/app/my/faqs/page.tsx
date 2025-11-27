'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HIGButton } from '@/design-system';
import supabaseClient from '@/lib/supabase/client';
import type { FAQ } from '@/types/database';
import { logger } from '@/lib/utils/logger';

export default function MyFAQsPage() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/my/faqs', {
        headers: {
          'Authorization': `Bearer ${(await supabaseClient.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setFaqs(result.data || []);
    } catch (error) {
      logger.error('Failed to fetch FAQs', { data: error instanceof Error ? error : new Error(String(error)) });
      setError('FAQの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const deleteFAQ = async (id: string) => {
    if (!confirm('このFAQを削除しますか？この操作は取り消せません。')) {
      return;
    }

    setDeleting(id);
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/my/faqs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(await supabaseClient.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // FAQリストから削除
      setFaqs(prev => prev.filter(faq => faq.id !== id));
    } catch (error) {
      logger.error('Failed to delete FAQ', { data: error instanceof Error ? error : new Error(String(error)) });
      setError('FAQの削除に失敗しました');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)]"></div>
            <span className="ml-3 text-gray-600">読み込み中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">FAQ管理</h1>
          <p className="text-lg text-gray-600">
            よくある質問を管理して、お客様のサポートを効率化しましょう
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* アクションボタン */}
        <div className="mb-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {faqs.length}件のFAQが登録されています
          </div>
          <Link href="/my/faqs/new">
            <HIGButton variant="primary"
              size="md"
            >
              新しいFAQを追加
            </HIGButton>
          </Link>
        </div>

        {/* FAQリスト */}
        {faqs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">FAQがまだありません</h3>
            <p className="text-gray-600 mb-6">
              最初のFAQを追加して、お客様からのよくある質問に対応しましょう
            </p>
            <Link href="/my/faqs/new">
              <HIGButton variant="primary"
                size="md"
              >
                FAQを追加
              </HIGButton>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {faq.answer}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {faq.category && (
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {faq.category}
                          </span>
                        )}
                        <span>表示順序: {faq.sort_order}</span>
                        <span>
                          作成日: {new Date(faq.created_at).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/my/faqs/${faq.id}/edit`}
                        className="inline-flex items-center px-3 py-1 text-sm text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] border border-blue-200 rounded-md hover:bg-blue-50"
                      >
                        編集
                      </Link>
                      <button
                        onClick={() => deleteFAQ(faq.id)}
                        disabled={deleting === faq.id}
                        className="inline-flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50"
                      >
                        {deleting === faq.id ? '削除中...' : '削除'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}