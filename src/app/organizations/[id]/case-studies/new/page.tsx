'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getOrganization } from '@/lib/organizations';
import { getServices } from '@/lib/services';
import { createCaseStudy, getClientIndustries, getClientSizes } from '@/lib/case-studies';
import { type AppUser, type Organization, type Service, type CaseStudyFormData } from '@/types/database';

export default function NewCaseStudyPage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.id as string;
  
  const [user, setUser] = useState<AppUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CaseStudyFormData>({
    title: '',
    problem: '',
    solution: '',
    outcome: '',
    metrics: {},
    client_name: '',
    client_industry: '',
    client_size: '',
    is_anonymous: false,
    published_date: '',
    url: '',
    service_id: ''
  });

  const clientSizes = getClientSizes();

  useEffect(() => {
    async function fetchData() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        
        setUser(currentUser);
        
        const [orgResult, servicesResult, industriesResult] = await Promise.all([
          getOrganization(organizationId),
          getServices({ organizationId }),
          getClientIndustries()
        ]);

        if (orgResult.data) {
          setOrganization(orgResult.data);
        } else {
          router.push('/dashboard');
        }
        
        if (servicesResult.data) {
          setServices(servicesResult.data);
        }

        if (industriesResult.data) {
          setIndustries(industriesResult.data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    if (organizationId) {
      fetchData();
    }
  }, [organizationId, router]);

  const handleInputChange = (field: keyof CaseStudyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleMetricChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        [key]: value
      }
    }));
  };

  const addMetric = () => {
    const keyInput = document.getElementById('metricKey') as HTMLInputElement;
    const valueInput = document.getElementById('metricValue') as HTMLInputElement;
    
    const key = keyInput?.value.trim();
    const value = valueInput?.value.trim();
    
    if (key && value) {
      handleMetricChange(key, value);
      keyInput.value = '';
      valueInput.value = '';
    }
  };

  const removeMetric = (key: string) => {
    setFormData(prev => {
      const updatedMetrics = { ...prev.metrics };
      delete updatedMetrics[key];
      return { ...prev, metrics: updatedMetrics };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    }

    if (!formData.problem?.trim()) {
      newErrors.problem = '課題・問題は必須です';
    }

    if (!formData.solution?.trim()) {
      newErrors.solution = '解決策は必須です';
    }

    if (!formData.outcome?.trim()) {
      newErrors.outcome = '成果・結果は必須です';
    }

    if (!formData.is_anonymous && !formData.client_name?.trim()) {
      newErrors.client_name = '実名公開の場合、クライアント名は必須です';
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
      const result = await createCaseStudy(organizationId, formData);
      
      if (result.data) {
        router.push(`/organizations/${organizationId}/case-studies/${result.data.id}`);
      } else {
        setErrors({ submit: 'ケーススタディの作成に失敗しました' });
      }
    } catch (error) {
      console.error('Failed to create case study:', error);
      setErrors({ submit: 'ケーススタディの作成に失敗しました' });
    } finally {
      setSubmitting(false);
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

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">企業が見つかりません</h2>
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
              <span className="text-gray-900 font-medium">新しいケーススタディを追加</span>
            </li>
          </ol>
        </nav>

        {/* ページタイトル */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">新しいケーススタディを追加</h1>
          <p className="text-lg text-gray-600">
            {organization.name}の導入事例を追加してください
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* 基本情報 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="例: 業務効率化により月間工数を50%削減"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
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

              <div>
                <label htmlFor="published_date" className="block text-sm font-medium text-gray-700 mb-2">
                  公開日
                </label>
                <input
                  type="date"
                  id="published_date"
                  value={formData.published_date}
                  onChange={(e) => handleInputChange('published_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  詳細URL
                </label>
                <input
                  type="url"
                  id="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.url ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com/case-study"
                />
                {errors.url && <p className="mt-1 text-sm text-red-600">{errors.url}</p>}
              </div>
            </div>
          </div>

          {/* ケーススタディ内容 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ケーススタディ内容</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="problem" className="block text-sm font-medium text-gray-700 mb-2">
                  課題・問題 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="problem"
                  rows={4}
                  value={formData.problem}
                  onChange={(e) => handleInputChange('problem', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.problem ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="導入前に抱えていた課題や問題点を記載してください"
                />
                {errors.problem && <p className="mt-1 text-sm text-red-600">{errors.problem}</p>}
              </div>

              <div>
                <label htmlFor="solution" className="block text-sm font-medium text-gray-700 mb-2">
                  解決策 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="solution"
                  rows={4}
                  value={formData.solution}
                  onChange={(e) => handleInputChange('solution', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.solution ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="どのように課題を解決したかを記載してください"
                />
                {errors.solution && <p className="mt-1 text-sm text-red-600">{errors.solution}</p>}
              </div>

              <div>
                <label htmlFor="outcome" className="block text-sm font-medium text-gray-700 mb-2">
                  成果・結果 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="outcome"
                  rows={4}
                  value={formData.outcome}
                  onChange={(e) => handleInputChange('outcome', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.outcome ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="導入後に得られた成果や効果を記載してください"
                />
                {errors.outcome && <p className="mt-1 text-sm text-red-600">{errors.outcome}</p>}
              </div>
            </div>
          </div>

          {/* 定量的指標 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">定量的指標</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  指標を追加
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    id="metricKey"
                    placeholder="指標名（例: 作業時間削減率）"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="metricValue"
                      placeholder="値（例: 50%）"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addMetric}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      追加
                    </button>
                  </div>
                </div>
              </div>

              {formData.metrics && Object.keys(formData.metrics).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">登録済み指標:</p>
                  <div className="space-y-2">
                    {Object.entries(formData.metrics).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                        <span className="text-sm text-gray-900">
                          <strong>{key}:</strong> {value}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeMetric(key)}
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

          {/* クライアント情報 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">クライアント情報</h2>
            
            <div className="space-y-6">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_anonymous}
                    onChange={(e) => handleInputChange('is_anonymous', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">匿名での公開（クライアント名を非公開）</span>
                </label>
              </div>

              {!formData.is_anonymous && (
                <div>
                  <label htmlFor="client_name" className="block text-sm font-medium text-gray-700 mb-2">
                    クライアント名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => handleInputChange('client_name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.client_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="株式会社サンプル"
                  />
                  {errors.client_name && <p className="mt-1 text-sm text-red-600">{errors.client_name}</p>}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="client_industry" className="block text-sm font-medium text-gray-700 mb-2">
                    業界
                  </label>
                  <select
                    id="client_industry"
                    value={formData.client_industry}
                    onChange={(e) => handleInputChange('client_industry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="client_size" className="block text-sm font-medium text-gray-700 mb-2">
                    企業規模
                  </label>
                  <select
                    id="client_size"
                    value={formData.client_size}
                    onChange={(e) => handleInputChange('client_size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    {clientSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
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
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '作成中...' : 'ケーススタディを作成'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}