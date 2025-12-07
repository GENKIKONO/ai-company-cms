'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HIGButton } from '@/design-system';
import supabaseClient from '@/lib/supabase/client';
import type { FAQFormData } from '@/types/domain/content';;
import { logger } from '@/lib/utils/logger';

const POPULAR_CATEGORIES = [
  '料金・プラン',
  'サービス内容',
  '利用方法',
  'サポート',
  'セキュリティ',
  '技術仕様',
  '契約・支払い',
  'アカウント管理'
];

export default function NewFAQPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FAQFormData>({
    question: '',
    answer: '',
    category: '',
    sort_order: 1
  });

  const handleInputChange = (field: keyof FAQFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.question.trim()) {
      newErrors.question = '質問は必須です';
    }

    if (!formData.answer.trim()) {
      newErrors.answer = '回答は必須です';
    }

    if (formData.sort_order && formData.sort_order < 1) {
      newErrors.sort_order = '表示順序は1以上である必要があります';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabaseClient().auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/my/faqs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabaseClient().auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'FAQの作成に失敗しました');
      }

      const result = await response.json();
      if (result.data) {
        router.push('/my/faqs');
      } else {
        setErrors({ submit: 'FAQの作成に失敗しました' });
      }
    } catch (error) {
      logger.error('Failed to create FAQ', { data: error instanceof Error ? error : new Error(String(error)) });
      setErrors({ submit: error instanceof Error ? error.message : 'FAQの作成に失敗しました' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* パンくずナビ */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                ダッシュボード
              </Link>
            </li>
            <li>
              <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <Link href="/my/faqs" className="text-gray-500 hover:text-gray-700">
                FAQ管理
              </Link>
            </li>
            <li>
              <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <span className="text-gray-900 font-medium">新しいFAQ</span>
            </li>
          </ol>
        </nav>

        {/* ページタイトル */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">新しいFAQを作成</h1>
          <p className="text-lg text-gray-600">
            よくある質問と回答を追加して、お客様のサポートを効率化しましょう
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* 基本情報 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                  質問 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="question"
                  value={formData.question}
                  onChange={(e) => handleInputChange('question', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)] ${
                    errors.question ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="例: サービスの利用料金はいくらですか？"
                />
                {errors.question && <p className="mt-1 text-sm text-red-600">{errors.question}</p>}
              </div>

              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
                  回答 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="answer"
                  rows={6}
                  value={formData.answer}
                  onChange={(e) => handleInputChange('answer', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)] ${
                    errors.answer ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="質問に対する詳細な回答を記載してください。改行やリンクも含めることができます。"
                />
                {errors.answer && <p className="mt-1 text-sm text-red-600">{errors.answer}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    カテゴリ
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                  >
                    <option value="">選択してください（任意）</option>
                    {POPULAR_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="sort_order" className="block text-sm font-medium text-gray-700 mb-2">
                    表示順序
                  </label>
                  <input
                    type="number"
                    id="sort_order"
                    min="1"
                    value={formData.sort_order}
                    onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 1)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)] ${
                      errors.sort_order ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.sort_order && <p className="mt-1 text-sm text-red-600">{errors.sort_order}</p>}
                  <p className="mt-1 text-xs text-gray-500">
                    小さい数字ほど上に表示されます
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="customCategory" className="block text-sm font-medium text-gray-700 mb-2">
                  カスタムカテゴリ
                </label>
                <input
                  type="text"
                  id="customCategory"
                  placeholder="独自のカテゴリ名を入力（上記で選択した場合は無視されます）"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                  onChange={(e) => {
                    if (e.target.value.trim()) {
                      handleInputChange('category', e.target.value.trim());
                    }
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">
                  上記のカテゴリにない場合は、独自のカテゴリ名を入力できます
                </p>
              </div>
            </div>
          </div>

          {/* プレビュー */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">プレビュー</h2>
            
            <div className="border border-gray-200 rounded-lg">
              <details className="group">
                <summary className="flex items-center justify-between p-4 cursor-pointer">
                  <h3 className="text-base font-medium text-gray-900">
                    {formData.question || '質問がここに表示されます'}
                  </h3>
                  <svg 
                    className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform"
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-4 pb-4">
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {formData.answer || '回答がここに表示されます'}
                  </p>
                  {formData.category && (
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {formData.category}
                      </span>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="p-6">
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <Link
                href="/my/faqs"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </Link>
              <HIGButton
                type="submit"
                disabled={submitting}
                variant="primary"
                size="md"
              >
                {submitting ? '作成中...' : 'FAQを作成'}
              </HIGButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}