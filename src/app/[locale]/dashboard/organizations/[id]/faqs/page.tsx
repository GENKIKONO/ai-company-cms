'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import FAQForm from '@/components/forms/FAQForm';

type FAQ = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type Props = {
  params: { id: string };
};

export default function FAQsPage({ params }: Props) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = supabaseBrowser();
        
        // 認証チェック
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/login');
          return;
        }

        // 組織情報を取得
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, owner_user_id')
          .eq('id', params.id)
          .single();

        if (orgError || !org) {
          router.push('/dashboard');
          return;
        }

        // 権限チェック
        const { data: appUser, error: userError } = await supabase
          .from('app_users')
          .select('role, partner_id')
          .eq('id', user.id)
          .single();

        if (userError) {
          router.push('/dashboard');
          return;
        }

        const isOwner = org.owner_user_id === user.id;
        const isAdmin = appUser.role === 'admin';

        if (!isOwner && !isAdmin) {
          router.push('/dashboard');
          return;
        }

        setOrganization(org);

        // FAQ一覧を取得
        const { data: faqsData, error: faqsError } = await supabase
          .from('faqs')
          .select('*')
          .eq('org_id', params.id)
          .order('sort_order', { ascending: true });

        if (faqsError) {
          console.error('FAQs fetch error:', faqsError);
        } else {
          setFaqs(faqsData || []);
        }

      } catch (error) {
        console.error('Error:', error);
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [params.id, router]);

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const supabase = supabaseBrowser();

      const faqData = {
        org_id: params.id,
        question: formData.question,
        answer: formData.answer,
        sort_order: formData.sort_order,
      };

      if (editingFAQ) {
        // 更新
        const { error } = await supabase
          .from('faqs')
          .update({
            ...faqData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingFAQ.id);

        if (error) {
          throw error;
        }

        setFaqs(prev => prev.map(faq => 
          faq.id === editingFAQ.id 
            ? { ...faq, ...faqData, updated_at: new Date().toISOString() }
            : faq
        ).sort((a, b) => a.sort_order - b.sort_order));
      } else {
        // 新規作成
        const { data: newFAQ, error } = await supabase
          .from('faqs')
          .insert(faqData)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setFaqs(prev => [...prev, newFAQ].sort((a, b) => a.sort_order - b.sort_order));
      }

      setShowForm(false);
      setEditingFAQ(null);
    } catch (error) {
      console.error('FAQ submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setShowForm(true);
  };

  const handleDelete = async (faqId: string) => {
    if (!confirm('このFAQを削除しますか？')) {
      return;
    }

    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', faqId);

      if (error) {
        throw error;
      }

      setFaqs(prev => prev.filter(faq => faq.id !== faqId));
    } catch (error) {
      console.error('FAQ deletion error:', error);
      alert('FAQの削除に失敗しました');
    }
  };

  const moveFAQ = async (faqId: string, direction: 'up' | 'down') => {
    const currentIndex = faqs.findIndex(faq => faq.id === faqId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= faqs.length) return;

    const updatedFaqs = [...faqs];
    const currentFAQ = updatedFaqs[currentIndex];
    const targetFAQ = updatedFaqs[newIndex];

    // 順序を交換
    const tempOrder = currentFAQ.sort_order;
    currentFAQ.sort_order = targetFAQ.sort_order;
    targetFAQ.sort_order = tempOrder;

    try {
      const supabase = supabaseBrowser();
      
      // データベースを更新
      await Promise.all([
        supabase.from('faqs').update({ sort_order: currentFAQ.sort_order }).eq('id', currentFAQ.id),
        supabase.from('faqs').update({ sort_order: targetFAQ.sort_order }).eq('id', targetFAQ.id)
      ]);

      // ローカル状態を更新
      updatedFaqs.sort((a, b) => a.sort_order - b.sort_order);
      setFaqs(updatedFaqs);
    } catch (error) {
      console.error('FAQ reorder error:', error);
      alert('FAQの並び替えに失敗しました');
    }
  };

  const maxSortOrder = faqs.length > 0 ? Math.max(...faqs.map(faq => faq.sort_order)) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {editingFAQ ? 'FAQ編集' : '新規FAQ作成'}
              </h1>
            </div>
          </div>
        </div>

        <div className="py-8">
          <FAQForm
            initialData={editingFAQ || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingFAQ(null);
            }}
            isLoading={isSubmitting}
            maxSortOrder={maxSortOrder}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {organization?.name} - FAQ管理
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  よくある質問の管理・並び順設定
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                >
                  新規FAQ追加
                </button>
                <button
                  onClick={() => router.push(`/dashboard/organizations/${params.id}`)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {faqs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">FAQが登録されていません</h3>
            <p className="text-gray-500 mb-4">よくある質問を登録してください</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
            >
              最初のFAQを追加
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={faq.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {faq.sort_order}
                        </span>
                        <h3 className="text-lg font-medium text-gray-900">
                          Q. {faq.question}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">
                        A. {faq.answer}
                      </p>
                      <div className="text-xs text-gray-500">
                        更新: {new Date(faq.updated_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {/* 並び替えボタン */}
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => moveFAQ(faq.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveFAQ(faq.id, 'down')}
                          disabled={index === faqs.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleEdit(faq)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        削除
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