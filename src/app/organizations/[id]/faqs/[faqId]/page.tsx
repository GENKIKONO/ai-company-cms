'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getOrganization } from '@/lib/organizations';
import { getServices } from '@/lib/services';
import { getFAQ, updateFAQ, deleteFAQ, getFAQCategories, getPopularFAQCategories } from '@/lib/faqs';
import { type AppUser, type Organization, type Service, type FAQ, type FAQFormData } from '@/types/database';

export default function EditFAQPage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.id as string;
  const faqId = params.faqId as string;
  
  const [user, setUser] = useState<AppUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [faq, setFAQ] = useState<FAQ | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState<FAQFormData>({
    question: '',
    answer: '',
    category: '',
    order_index: 1
  });

  const popularCategories = getPopularFAQCategories();

  useEffect(() => {
    async function fetchData() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        
        setUser(currentUser);
        
        const [orgResult, faqResult, servicesResult, categoriesResult] = await Promise.all([
          getOrganization(organizationId),
          getFAQ(faqId),
          getServices({ organizationId }),
          getFAQCategories()
        ]);

        if (orgResult.data) {
          setOrganization(orgResult.data);
        } else {
          router.push('/dashboard');
          return;
        }

        if (faqResult.data) {
          const faqData = faqResult.data;
          setFAQ(faqData);
          setFormData({
            question: faqData.question || '',
            answer: faqData.answer || '',
            category: faqData.category || '',
            service_id: faqData.service_id || undefined,
            order_index: faqData.order_index || 1
          });
        } else {
          router.push(`/organizations/${organizationId}`);
          return;
        }
        
        if (servicesResult.data) {
          setServices(servicesResult.data);
        }

        if (categoriesResult.data) {
          setCategories(categoriesResult.data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    if (organizationId && faqId) {
      fetchData();
    }
  }, [organizationId, faqId, router]);

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
      const result = await updateFAQ(faqId, formData);
      
      if (result.data) {
        setFAQ(result.data);
        setErrors({ success: 'FAQを更新しました' });
      } else {
        setErrors({ submit: 'FAQの更新に失敗しました' });
      }
    } catch (error) {
      console.error('Failed to update FAQ:', error);
      setErrors({ submit: 'FAQの更新に失敗しました' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteFAQ(faqId);
      router.push(`/organizations/${organizationId}`);
    } catch (error) {
      console.error('Failed to delete FAQ:', error);
      setErrors({ submit: 'FAQの削除に失敗しました' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  if (!organization || !faq) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">FAQが見つかりません</h2>
          <Link href="/dashboard" className="mt-4 text-blue-600 hover:text-blue-700">
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
                LuxuCare AI企業CMS
              </Link>
              <nav className="ml-10 hidden md:flex space-x-8">
                <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                  ダッシュボード
                </Link>
                <Link href="/organizations" className="text-blue-600 font-medium">
                  企業ディレクトリ
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                こんにちは、{user?.full_name || user?.email}さん
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <Link href={`/organizations/${organizationId}`} className="text-gray-500 hover:text-gray-700">
                {organization.name}
              </Link>
            </li>
            <li>
              <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <span className="text-gray-900 font-medium">FAQ編集</span>
            </li>
          </ol>
        </nav>

        {/* ページタイトル */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">FAQ編集</h1>
              <p className="text-lg text-gray-600">
                FAQの内容を編集できます
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                削除
              </button>
            </div>
          </div>
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.question ? 'border-red-500' : 'border-gray-300'
                  }`}
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.answer ? 'border-red-500' : 'border-gray-300'
                  }`}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください（任意）</option>
                    {popularCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                    {categories.filter(cat => !popularCategories.includes(cat)).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="service_id" className="block text-sm font-medium text-gray-700 mb-2">
                    関連サービス
                  </label>
                  <select
                    id="service_id"
                    value={formData.service_id || ''}
                    onChange={(e) => handleInputChange('service_id', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください（任意）</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                  </select>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    if (e.target.value.trim()) {
                      handleInputChange('category', e.target.value.trim());
                    }
                  }}
                />
              </div>

              <div>
                <label htmlFor="order_index" className="block text-sm font-medium text-gray-700 mb-2">
                  表示順序
                </label>
                <input
                  type="number"
                  id="order_index"
                  min="1"
                  value={formData.order_index}
                  onChange={(e) => handleInputChange('order_index', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  小さい数字ほど上に表示されます
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
            
            {errors.success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">{errors.success}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <Link
                href={`/organizations/${organizationId}`}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                戻る
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '保存中...' : '変更を保存'}
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">FAQを削除</h3>
            <p className="text-gray-600 mb-4">
              このFAQを削除してもよろしいですか？この操作は取り消せません。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}