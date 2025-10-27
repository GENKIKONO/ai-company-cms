'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getOrganization } from '@/lib/organizations';
import { getService, updateService, deleteService, getServiceCategories } from '@/lib/services';
import { type AppUser, type Organization, type Service, type ServiceFormData } from '@/types/database';
import ServiceImageUploader from '@/components/ServiceImageUploader';
import { HIGButton } from '@/design-system';
import { logger } from '@/lib/utils/logger';

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.id as string;
  const serviceId = params.serviceId as string;
  
  const [user, setUser] = useState<AppUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    price: undefined,
    duration_months: undefined,
    category: '',
    image_url: '',
    video_url: ''
  });

  const categoryOptions = [
    'Webサービス', 'モバイルアプリ', 'SaaS', 'API・SDK',
    'マーケティング', 'セールス', 'カスタマーサポート', 'HR・人事',
    '経理・財務', 'プロジェクト管理', 'コミュニケーション', 'セキュリティ',
    'データ分析', '開発ツール', 'デザイン', 'EC・通販'
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        
        setUser(currentUser);
        
        const [orgResult, serviceResult, categoriesResult] = await Promise.all([
          getOrganization(organizationId),
          getService(serviceId),
          getServiceCategories()
        ]);

        if (orgResult.data) {
          setOrganization(orgResult.data);
        } else {
          router.push('/dashboard');
          return;
        }

        if (serviceResult.data) {
          const svc = serviceResult.data;
          setService(svc);
          setFormData({
            name: svc.name || '',
            description: svc.description || '',
            price: svc.price || undefined,
            duration_months: svc.duration_months || undefined,
            category: svc.category || '',
            image_url: svc.image_url || '',
            video_url: svc.video_url || ''
          });
        } else {
          router.push(`/organizations/${organizationId}`);
          return;
        }
        
        if (categoriesResult.data) {
          setCategories(categoriesResult.data);
        }
      } catch (error) {
        logger.error('Failed to fetch data', error instanceof Error ? error : new Error(String(error)));
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    if (organizationId && serviceId) {
      fetchData();
    }
  }, [organizationId, serviceId, router]);

  const handleInputChange = (field: keyof ServiceFormData, value: any) => {
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

    if (!formData.name.trim()) {
      newErrors.name = 'サービス名は必須です';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'サービス説明は必須です';
    }

    if (formData.price !== undefined && formData.price < 0) {
      newErrors.price = '価格は0以上で入力してください';
    }

    if (formData.duration_months !== undefined && formData.duration_months < 1) {
      newErrors.duration_months = '期間は1ヶ月以上で入力してください';
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
      const result = await updateService(serviceId, formData);
      
      if (result.data) {
        setService(result.data);
        setErrors({ success: 'サービス情報を更新しました' });
      } else {
        setErrors({ submit: 'サービス情報の更新に失敗しました' });
      }
    } catch (error) {
      logger.error('Failed to update service', error instanceof Error ? error : new Error(String(error)));
      setErrors({ submit: 'サービス情報の更新に失敗しました' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteService(serviceId);
      router.push(`/organizations/${organizationId}`);
    } catch (error) {
      logger.error('Failed to delete service', error instanceof Error ? error : new Error(String(error)));
      setErrors({ submit: 'サービスの削除に失敗しました' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--bg-primary)]"></div>
        <span className="ml-3 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  if (!organization || !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">サービスが見つかりません</h2>
          <Link href="/dashboard" className="mt-4 text-[var(--bg-primary)] hover:text-[var(--bg-primary-hover)]">
マイページに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* パンくずナビ */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                マイページ
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
              <span className="text-gray-900 font-medium">{service.name}</span>
            </li>
          </ol>
        </nav>

        {/* ページタイトル */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.name}</h1>
              <p className="text-lg text-gray-600">
                サービス情報を編集できます
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
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  サービス名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary)] ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  サービス説明 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary)] ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  価格（円）
                </label>
                <input
                  type="number"
                  id="price"
                  min="0"
                  value={formData.price || ''}
                  onChange={(e) => handleInputChange('price', e.target.value ? Number(e.target.value) : undefined)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary)] ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="例: 5000"
                />
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
              </div>

              <div>
                <label htmlFor="duration_months" className="block text-sm font-medium text-gray-700 mb-2">
                  期間（月）
                </label>
                <input
                  type="number"
                  id="duration_months"
                  min="1"
                  value={formData.duration_months || ''}
                  onChange={(e) => handleInputChange('duration_months', e.target.value ? Number(e.target.value) : undefined)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary)] ${
                    errors.duration_months ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="例: 12"
                />
                {errors.duration_months && <p className="mt-1 text-sm text-red-600">{errors.duration_months}</p>}
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  カテゴリ
                </label>
                <select
                  id="category"
                  value={formData.category || ''}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary)]"
                >
                  <option value="">選択してください</option>
                  {categoryOptions.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* サービス画像設定 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">サービス画像</h2>
            
            <ServiceImageUploader
              serviceId={service?.id}
              currentImageUrl={formData.image_url}
              onImageChange={(imageUrl) => handleInputChange('image_url', imageUrl || '')}
              disabled={submitting}
            />
          </div>

          {/* 動画URL設定 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">動画URL</h2>
            
            <div>
              <label htmlFor="video_url" className="block text-sm font-medium text-gray-700 mb-2">
                動画URL（YouTube等）
              </label>
              <input
                type="url"
                id="video_url"
                value={formData.video_url || ''}
                onChange={(e) => handleInputChange('video_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary)]"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="mt-1 text-xs text-gray-500">
                YouTube、Vimeo等の動画URLを入力してください
              </p>
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
              <HIGButton
                type="submit"
                disabled={submitting}
                variant="primary"
                size="md"
              >
                {submitting ? '保存中...' : '変更を保存'}
              </HIGButton>
            </div>
          </div>
        </form>
      </main>

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">サービスを削除</h3>
            <p className="text-gray-600 mb-4">
              「{service.name}」を削除してもよろしいですか？この操作は取り消せません。
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