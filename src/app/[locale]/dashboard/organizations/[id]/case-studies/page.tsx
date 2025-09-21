'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import CaseStudyForm from '@/components/forms/CaseStudyForm';

type CaseStudy = {
  id: string;
  title: string;
  client_type?: string;
  client_name?: string;
  problem?: string;
  solution?: string;
  outcome?: string;
  metrics?: Record<string, string | number>;
  published_at?: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
};

type Props = {
  params: { id: string };
};

export default function CaseStudiesPage({ params }: Props) {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCaseStudy, setEditingCaseStudy] = useState<CaseStudy | null>(null);
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

        // 導入事例一覧を取得
        const { data: caseStudiesData, error: caseStudiesError } = await supabase
          .from('case_studies')
          .select('*')
          .eq('org_id', params.id)
          .order('updated_at', { ascending: false });

        if (caseStudiesError) {
          console.error('Case studies fetch error:', caseStudiesError);
        } else {
          setCaseStudies(caseStudiesData || []);
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

      const caseStudyData = {
        org_id: params.id,
        title: formData.title,
        client_type: formData.client_type || null,
        client_name: formData.is_anonymous ? null : formData.client_name,
        problem: formData.problem || null,
        solution: formData.solution || null,
        outcome: formData.outcome || null,
        metrics: formData.metrics || {},
        published_at: formData.published_at || null,
        is_anonymous: formData.is_anonymous,
      };

      if (editingCaseStudy) {
        // 更新
        const { error } = await supabase
          .from('case_studies')
          .update({
            ...caseStudyData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCaseStudy.id);

        if (error) {
          throw error;
        }

        setCaseStudies(prev => prev.map(cs => 
          cs.id === editingCaseStudy.id 
            ? { ...cs, ...caseStudyData, updated_at: new Date().toISOString() }
            : cs
        ));
      } else {
        // 新規作成
        const { data: newCaseStudy, error } = await supabase
          .from('case_studies')
          .insert(caseStudyData)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setCaseStudies(prev => [newCaseStudy, ...prev]);
      }

      setShowForm(false);
      setEditingCaseStudy(null);
    } catch (error) {
      console.error('Case study submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (caseStudy: CaseStudy) => {
    setEditingCaseStudy(caseStudy);
    setShowForm(true);
  };

  const handleDelete = async (caseStudyId: string) => {
    if (!confirm('この導入事例を削除しますか？')) {
      return;
    }

    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase
        .from('case_studies')
        .delete()
        .eq('id', caseStudyId);

      if (error) {
        throw error;
      }

      setCaseStudies(prev => prev.filter(cs => cs.id !== caseStudyId));
    } catch (error) {
      console.error('Case study deletion error:', error);
      alert('導入事例の削除に失敗しました');
    }
  };

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
                {editingCaseStudy ? '導入事例編集' : '新規導入事例作成'}
              </h1>
            </div>
          </div>
        </div>

        <div className="py-8">
          <CaseStudyForm
            initialData={editingCaseStudy || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingCaseStudy(null);
            }}
            isLoading={isSubmitting}
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
                  {organization?.name} - 導入事例管理
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  プロジェクトの成功事例を管理
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                >
                  新規導入事例追加
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
        {caseStudies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">導入事例が登録されていません</h3>
            <p className="text-gray-500 mb-4">プロジェクトの成功事例を登録してください</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
            >
              最初の導入事例を追加
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {caseStudies.map((caseStudy) => (
              <div key={caseStudy.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {caseStudy.title}
                        </h3>
                        {caseStudy.is_anonymous && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            匿名化
                          </span>
                        )}
                        {caseStudy.client_type && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {caseStudy.client_type}
                          </span>
                        )}
                      </div>

                      {!caseStudy.is_anonymous && caseStudy.client_name && (
                        <p className="text-sm text-gray-600 mb-2">
                          クライアント: {caseStudy.client_name}
                        </p>
                      )}

                      {caseStudy.problem && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700">課題</h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                            {caseStudy.problem}
                          </p>
                        </div>
                      )}

                      {caseStudy.outcome && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700">成果</h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {caseStudy.outcome}
                          </p>
                        </div>
                      )}

                      {caseStudy.metrics && Object.keys(caseStudy.metrics).length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700">数値指標</h4>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {Object.entries(caseStudy.metrics).slice(0, 3).map(([key, value]) => (
                              <span key={key} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 text-green-800">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        {caseStudy.published_at && (
                          <span>公開日: {new Date(caseStudy.published_at).toLocaleDateString()}</span>
                        )}
                        <span>更新: {new Date(caseStudy.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(caseStudy)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(caseStudy.id)}
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