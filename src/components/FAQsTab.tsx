'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/ui/toast';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

interface FAQFormData {
  question: string;
  answer: string;
  category: string;
  sort_order: number | null;
}

interface FAQsTabProps {
  organizationId: string;
}

export default function FAQsTab({ organizationId }: FAQsTabProps) {
  const [faqs, setFAQs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const { addToast } = useToast();

  const [formData, setFormData] = useState<FAQFormData>({
    question: '',
    answer: '',
    category: '',
    sort_order: null
  });

  useEffect(() => {
    fetchFAQs();
  }, [organizationId]);

  const fetchFAQs = async () => {
    try {
      const response = await fetch('/api/my/faqs');
      if (response.ok) {
        const result = await response.json();
        setFAQs(result.data || []);
      } else {
        const errorMessage = 'FAQ一覧の取得に失敗しました';
        setError(errorMessage);
        addToast({ title: errorMessage, type: 'error' });
      }
    } catch (error) {
      const errorMessage = 'FAQ一覧の取得に失敗しました';
      setError(errorMessage);
      addToast({ title: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: '',
      sort_order: null
    });
    setEditingFAQ(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (faq: FAQ) => {
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || '',
      sort_order: faq.sort_order
    });
    setEditingFAQ(faq);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question.trim()) {
      setError('質問は必須です');
      return;
    }

    if (!formData.answer.trim()) {
      setError('回答は必須です');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const url = editingFAQ 
        ? `/api/my/faqs/${editingFAQ.id}`
        : '/api/my/faqs';
      
      const method = editingFAQ ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchFAQs();
        resetForm();
        addToast({ title: editingFAQ ? 'FAQを更新しました' : 'FAQを作成しました', type: 'success' });
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        let errorMessage = 'FAQの保存に失敗しました';
        
        if (response.status === 401) {
          errorMessage = '認証が必要です。ログインし直してください。';
        } else if (response.status === 404 && errorData.code === 'ORG_NOT_FOUND') {
          errorMessage = '企業情報が見つかりません。先に企業情報を作成してください。';
        } else if (response.status === 403) {
          errorMessage = 'この操作を行う権限がありません。';
        } else if (response.status >= 500) {
          errorMessage = 'サーバーエラーが発生しました。しばらく後にお試しください。';
        } else {
          errorMessage = errorData.error || 'FAQの保存に失敗しました';
        }
        
        setError(errorMessage);
        addToast({ title: errorMessage, type: 'error' });
      }
    } catch (error) {
      const errorMessage = 'FAQの保存に失敗しました';
      setError(errorMessage);
      addToast({ title: errorMessage, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (faqId: string) => {
    if (!confirm('このFAQを削除してもよろしいですか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/my/faqs/${faqId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchFAQs();
        addToast({ title: 'FAQを削除しました', type: 'success' });
      } else {
        const errorMessage = 'FAQの削除に失敗しました';
        setError(errorMessage);
        addToast({ title: errorMessage, type: 'error' });
      }
    } catch (error) {
      const errorMessage = 'FAQの削除に失敗しました';
      setError(errorMessage);
      addToast({ title: errorMessage, type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)] mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">FAQ管理</h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-[var(--aio-primary)] text-white rounded-md hover:bg-[var(--aio-primary-hover)]"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            新しいFAQ
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* FAQ一覧 */}
        {faqs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            まだFAQが登録されていません
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-medium text-gray-900">Q. {faq.question}</h3>
                      {faq.category && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {faq.category}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700">
                      <strong>A.</strong> {faq.answer}
                    </div>
                    {faq.sort_order && (
                      <div className="mt-2 text-xs text-gray-500">
                        表示順: {faq.sort_order}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(faq)}
                      className="text-[var(--aio-primary)] hover:text-blue-900"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FAQ作成・編集フォーム */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingFAQ ? 'FAQ編集' : '新しいFAQ'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    質問 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    回答 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formData.answer}
                    onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      カテゴリ
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="例: サービス、料金、使い方"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      表示順
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value ? Number(e.target.value) : null }))}
                      placeholder="数字が小さいほど上に表示"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[var(--aio-primary)] text-white rounded-md hover:bg-[var(--aio-primary-hover)] disabled:opacity-50"
                  >
                    {submitting ? '保存中...' : '保存'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}