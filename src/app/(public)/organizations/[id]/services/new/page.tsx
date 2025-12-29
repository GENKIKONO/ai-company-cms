'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { HIGButton } from '@/design-system';
import { getCurrentUserClient as getCurrentUser } from '@/lib/core/auth-state.client';
import { getOrganization } from '@/lib/organizations';
import { createService, generateServiceSlug, getServiceCategories } from '@/lib/services';
import type { AppUser, Organization } from '@/types/legacy/database';
import type { ServiceFormData } from '@/types/domain/content';;
import ServiceImageUploader from '@/components/ServiceImageUploader';
import { logger } from '@/lib/utils/logger';

export default function NewServicePage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.id as string;
  
  const [user, setUser] = useState<AppUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    price: undefined,
    duration_months: undefined,
    category: '',
    features: [],
    media: [],
    image_url: '',
    video_url: '',
    cta_text: '',
    cta_url: ''
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
          router.push('/auth/login');
          return;
        }
        
        setUser(currentUser);
        
        const [orgResult, categoriesResult] = await Promise.all([
          getOrganization(organizationId),
          getServiceCategories()
        ]);

        if (orgResult.data) {
          setOrganization(orgResult.data);
        } else {
          router.replace('/dashboard');
        }
        
        if (categoriesResult.data) {
          setCategories(categoriesResult.data);
        }
      } catch (error) {
        logger.error('Failed to fetch data', { data: error instanceof Error ? error : new Error(String(error)) });
        router.replace('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    if (organizationId) {
      fetchData();
    }
  }, [organizationId, router]);

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

    if (formData.cta_url && !formData.cta_url.startsWith('https://')) {
      newErrors.cta_url = 'URLはhttps://で始まる必要があります';
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
      // スラッグを自動生成
      const slug = await generateServiceSlug(formData.name, organizationId);
      
      const serviceData = {
        ...formData,
        organization_id: organizationId,
        slug
      };

      const result = await createService(serviceData);
      
      if (result.data) {
        router.push(`/organizations/${organizationId}/services/${result.data.id}`);
      } else {
        setErrors({ submit: 'サービスの作成に失敗しました' });
      }
    } catch (error) {
      logger.error('Failed to create service', { data: error instanceof Error ? error : new Error(String(error)) });
      setErrors({ submit: 'サービスの作成に失敗しました' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)]"></div>
        <span className="ml-3 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">企業が見つかりません</h2>
          <Link href="/dashboard" replace className="mt-4 text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)]">
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div>
        {/* パンくずナビ */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/dashboard" replace className="text-gray-500 hover:text-gray-700">
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
              <span className="text-gray-900 font-medium">新しいサービスを追加</span>
            </li>
          </ol>
        </nav>

        {/* ページタイトル */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">新しいサービスを追加</h1>
          <p className="text-lg text-gray-600">
            {organization.name}のサービス情報を入力してください
          </p>
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)] ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="例: TaskFlow Pro"
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)] ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="サービスの概要、特徴、利用場面などを記載してください"
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)] ${
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)] ${
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
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
              serviceId={undefined}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="mt-1 text-xs text-gray-500">
                YouTube、Vimeo等の動画URLを入力してください
              </p>
            </div>
          </div>

          {/* 機能・特徴 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">機能・特徴</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  サービスの機能・特徴
                </label>
                <div className="space-y-2">
                  {formData.features?.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...(formData.features || [])];
                          newFeatures[index] = e.target.value;
                          handleInputChange('features', newFeatures);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                        placeholder="例: 高度な分析機能"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newFeatures = formData.features?.filter((_, i) => i !== index) || [];
                          handleInputChange('features', newFeatures);
                        }}
                        className="px-3 py-2 text-red-600 hover:text-red-700"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newFeatures = [...(formData.features || []), ''];
                      handleInputChange('features', newFeatures);
                    }}
                    className="px-4 py-2 text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] border border-[var(--aio-primary)] rounded-md hover:bg-[var(--aio-info-surface)]"
                  >
                    + 機能を追加
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* コール・トゥ・アクション */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">コール・トゥ・アクション</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="cta_text" className="block text-sm font-medium text-gray-700 mb-2">
                  CTAボタンテキスト
                </label>
                <input
                  type="text"
                  id="cta_text"
                  value={formData.cta_text || ''}
                  onChange={(e) => handleInputChange('cta_text', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                  placeholder="例: 詳細を見る"
                />
              </div>

              <div>
                <label htmlFor="cta_url" className="block text-sm font-medium text-gray-700 mb-2">
                  CTAURL
                </label>
                <input
                  type="url"
                  id="cta_url"
                  value={formData.cta_url || ''}
                  onChange={(e) => handleInputChange('cta_url', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)] ${
                    errors.cta_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com/service"
                />
                {errors.cta_url && <p className="mt-1 text-sm text-red-600">{errors.cta_url}</p>}
              </div>
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
                href={`/organizations/${organizationId}`}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                企業ページに戻る
              </Link>
              <HIGButton
                type="submit"
                disabled={submitting}
                variant="primary"
                size="md"
              >
                {submitting ? '作成中...' : 'サービスを作成'}
              </HIGButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}