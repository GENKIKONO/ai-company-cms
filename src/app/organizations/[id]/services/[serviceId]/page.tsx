'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getOrganization } from '@/lib/organizations';
import { getService, updateService, deleteService, getServiceCategories } from '@/lib/services';
import { type AppUser, type Organization, type Service, type ServiceFormData } from '@/types/database';

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
    features: [],
    categories: [],
    price_range: '',
    url: '',
    supported_platforms: [],
    api_available: false,
    free_trial: false
  });

  const priceRanges = [
    '無料',
    '月額1,000円未満',
    '月額1,000円〜5,000円',
    '月額5,000円〜10,000円',
    '月額10,000円〜50,000円',
    '月額50,000円〜100,000円',
    '月額100,000円以上',
    '要問い合わせ'
  ];

  const platforms = [
    'Web', 'iOS', 'Android', 'Windows', 'macOS', 'Linux',
    'Chrome Extension', 'Firefox Extension', 'Safari Extension',
    'API', 'SDK', 'WordPress Plugin', 'Shopify App'
  ];

  const popularCategories = [
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
            features: svc.features || [],
            categories: svc.categories || [],
            price_range: svc.price_range || '',
            url: svc.url || '',
            supported_platforms: svc.supported_platforms || [],
            api_available: svc.api_available || false,
            free_trial: svc.free_trial || false
          });
        } else {
          router.push(`/organizations/${organizationId}`);
          return;
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

  const handleArrayChange = (field: 'features' | 'categories' | 'supported_platforms', value: string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addFeature = () => {
    const feature = (document.getElementById('newFeature') as HTMLInputElement)?.value.trim();
    if (feature && !(formData.features || []).includes(feature)) {
      handleArrayChange('features', [...(formData.features || []), feature]);
      (document.getElementById('newFeature') as HTMLInputElement).value = '';
    }
  };

  const removeFeature = (index: number) => {
    handleArrayChange('features', (formData.features || []).filter((_, i) => i !== index));
  };

  const addCustomCategory = () => {
    const category = (document.getElementById('customCategory') as HTMLInputElement)?.value.trim();
    if (category && !(formData.categories || []).includes(category)) {
      handleArrayChange('categories', [...(formData.categories || []), category]);
      (document.getElementById('customCategory') as HTMLInputElement).value = '';
    }
  };

  const toggleCategory = (category: string) => {
    const updatedCategories = (formData.categories || []).includes(category)
      ? (formData.categories || []).filter(c => c !== category)
      : [...(formData.categories || []), category];
    handleArrayChange('categories', updatedCategories);
  };

  const togglePlatform = (platform: string) => {
    const updatedPlatforms = (formData.supported_platforms || []).includes(platform)
      ? (formData.supported_platforms || []).filter(p => p !== platform)
      : [...(formData.supported_platforms || []), platform];
    handleArrayChange('supported_platforms', updatedPlatforms);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'サービス名は必須です';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'サービス説明は必須です';
    }

    if ((formData.categories || []).length === 0) {
      newErrors.categories = '少なくとも1つのカテゴリを選択してください';
    }

    if (formData.url && !formData.url.match(/^https?:\/\/.+/)) {
      newErrors.url = '正しいURL形式で入力してください';
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
      console.error('Failed to update service:', error);
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
      console.error('Failed to delete service:', error);
      setErrors({ submit: 'サービスの削除に失敗しました' });
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

  if (!organization || !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">サービスが見つかりません</h2>
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  サービスURL
                </label>
                <input
                  type="url"
                  id="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.url ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.url && <p className="mt-1 text-sm text-red-600">{errors.url}</p>}
              </div>

              <div>
                <label htmlFor="price_range" className="block text-sm font-medium text-gray-700 mb-2">
                  価格帯
                </label>
                <select
                  id="price_range"
                  value={formData.price_range}
                  onChange={(e) => handleInputChange('price_range', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  {priceRanges.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* カテゴリ */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">カテゴリ</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  サービスカテゴリ <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {popularCategories.map(category => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(formData.categories || []).includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
                {errors.categories && <p className="mt-1 text-sm text-red-600">{errors.categories}</p>}
              </div>

              <div>
                <label htmlFor="customCategory" className="block text-sm font-medium text-gray-700 mb-2">
                  カスタムカテゴリを追加
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="customCategory"
                    placeholder="独自のカテゴリ名"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addCustomCategory}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    追加
                  </button>
                </div>
              </div>

              {(formData.categories || []).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">選択中のカテゴリ:</p>
                  <div className="flex flex-wrap gap-2">
                    {(formData.categories || []).map((category, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center"
                      >
                        {category}
                        <button
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 機能・特徴 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">機能・特徴</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="newFeature" className="block text-sm font-medium text-gray-700 mb-2">
                  主要機能を追加
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="newFeature"
                    placeholder="例: 複数プロジェクト管理"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    追加
                  </button>
                </div>
              </div>

              {(formData.features || []).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">機能一覧:</p>
                  <div className="space-y-2">
                    {(formData.features || []).map((feature, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                        <span className="text-sm text-gray-900">{feature}</span>
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 対応プラットフォーム */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">対応プラットフォーム</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {platforms.map(platform => (
                <label key={platform} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(formData.supported_platforms || []).includes(platform)}
                    onChange={() => togglePlatform(platform)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{platform}</span>
                </label>
              ))}
            </div>
          </div>

          {/* その他の設定 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">その他の設定</h2>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.api_available}
                  onChange={(e) => handleInputChange('api_available', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">API提供あり</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.free_trial}
                  onChange={(e) => handleInputChange('free_trial', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">無料トライアルあり</span>
              </label>
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