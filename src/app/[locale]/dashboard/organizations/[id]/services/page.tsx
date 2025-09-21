'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import ServiceForm from '@/components/forms/ServiceForm';

type Service = {
  id: string;
  name: string;
  summary: string;
  features: string[];
  price?: string;
  category?: string;
  cta_url?: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
};

type Props = {
  params: { id: string };
};

export default function ServicesPage({ params }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
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
        // パートナーチェックは省略（複雑になるため）

        if (!isOwner && !isAdmin) {
          router.push('/dashboard');
          return;
        }

        setOrganization(org);

        // サービス一覧を取得
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('org_id', params.id)
          .order('updated_at', { ascending: false });

        if (servicesError) {
          console.error('Services fetch error:', servicesError);
        } else {
          setServices(servicesData || []);
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

      const serviceData = {
        org_id: params.id,
        name: formData.name,
        summary: formData.summary,
        features: formData.features,
        price: formData.price || null,
        category: formData.category || null,
        cta_url: formData.cta_url || null,
        status: formData.status,
        media: formData.media || [],
      };

      if (editingService) {
        // 更新
        const { error } = await supabase
          .from('services')
          .update({
            ...serviceData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingService.id);

        if (error) {
          throw error;
        }

        setServices(prev => prev.map(s => 
          s.id === editingService.id 
            ? { ...s, ...serviceData, updated_at: new Date().toISOString() }
            : s
        ));
      } else {
        // 新規作成
        const { data: newService, error } = await supabase
          .from('services')
          .insert(serviceData)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setServices(prev => [newService, ...prev]);
      }

      setShowForm(false);
      setEditingService(null);
    } catch (error) {
      console.error('Service submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setShowForm(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('このサービスを削除しますか？')) {
      return;
    }

    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) {
        throw error;
      }

      setServices(prev => prev.filter(s => s.id !== serviceId));
    } catch (error) {
      console.error('Service deletion error:', error);
      alert('サービスの削除に失敗しました');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { text: '下書き', color: 'bg-gray-100 text-gray-800' },
      published: { text: '公開中', color: 'bg-green-100 text-green-800' },
    };
    const badge = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
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
                {editingService ? 'サービス編集' : '新規サービス作成'}
              </h1>
            </div>
          </div>
        </div>

        <div className="py-8">
          <ServiceForm
            initialData={editingService || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingService(null);
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
                  {organization?.name} - サービス管理
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  提供サービス・商品の管理
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                >
                  新規サービス追加
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
        {services.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">サービスが登録されていません</h3>
            <p className="text-gray-500 mb-4">提供しているサービス・商品を登録してください</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
            >
              最初のサービスを追加
            </button>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">サービス一覧</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {services.map((service) => (
                <div key={service.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900 truncate">
                          {service.name}
                        </h4>
                        {getStatusBadge(service.status)}
                        {service.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {service.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {service.summary}
                      </p>
                      {service.features && service.features.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-xs font-medium text-gray-500 mb-1">特徴・機能</h5>
                          <ul className="text-sm text-gray-600 list-disc list-inside">
                            {service.features.slice(0, 3).map((feature, index) => (
                              <li key={index}>{feature}</li>
                            ))}
                            {service.features.length > 3 && (
                              <li className="text-gray-400">他 {service.features.length - 3} 項目</li>
                            )}
                          </ul>
                        </div>
                      )}
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        {service.price && (
                          <span>価格: {service.price}</span>
                        )}
                        <span>更新: {new Date(service.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(service)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}