'use client';

import { useState, useEffect , useCallback} from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ServiceImageUploader from '@/components/ServiceImageUploader';
import { HIGButton } from '@/design-system';
import DashboardBackLink from '@/components/dashboard/DashboardBackLink';

import { logger } from '@/lib/log';
interface Service {
  id: string;
  name: string;
  summary?: string;
  description?: string;
  price?: number;
  duration_months?: number;
  category?: string;
  image_url?: string;
  video_url?: string;
  features?: string[];
  cta_text?: string;
  cta_url?: string;
  is_published?: boolean;
}

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    summary: '',
    description: '',
    price: '',
    duration_months: '',
    category: '',
    image_url: null as string | null,
    video_url: '',
    features: [''] as string[],
    cta_text: '',
    cta_url: '',
    is_published: false
  });

  const fetchService = useCallback(async () => {
    try {
      const response = await fetch(`/api/my/services/${serviceId}`);
      if (!response.ok) throw new Error('Failed to fetch service');
      
      const result = await response.json();
      const serviceData = result.data;
      
      setService(serviceData);
      setFormData({
        name: serviceData.name || '',
        summary: serviceData.summary || '',
        description: serviceData.description || '',
        price: serviceData.price?.toString() || '',
        duration_months: serviceData.duration_months?.toString() || '',
        category: serviceData.category || '',
        image_url: serviceData.image_url || null,
        video_url: serviceData.video_url || '',
        features: serviceData.features?.length > 0 ? serviceData.features : [''],
        cta_text: serviceData.cta_text || '',
        cta_url: serviceData.cta_url || '',
        is_published: serviceData.is_published || false
      });
    } catch (err) {
      setError('サービスの読み込みに失敗しました');
      logger.error(err);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const submitData = {
      name: formData.name,
      summary: formData.summary || undefined,
      description: formData.description || undefined,
      price: formData.price ? Number(formData.price) : undefined,
      duration_months: formData.duration_months ? Number(formData.duration_months) : undefined,
      category: formData.category || undefined,
      image_url: formData.image_url,
      video_url: formData.video_url || undefined,
      features: formData.features.filter(f => f.trim() !== ''),
      cta_text: formData.cta_text || undefined,
      cta_url: formData.cta_url || undefined,
      is_published: formData.is_published
    };

    try {
      const response = await fetch(`/api/my/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (result.ok) {
        router.replace('/dashboard/services');
      } else {
        setError(result.error || '更新に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setSaving(false);
    }
  }, [serviceId, formData, router]);

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures.length > 0 ? newFeatures : [''] });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)]"></div>
        <span className="ml-3 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">サービスが見つかりません</h2>
          <Link
            href="/dashboard/services"
            className="mt-4 text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] inline-block"
            replace
          >
            サービス一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">サービス編集</h1>
            <p className="text-gray-600 mt-2">サービス情報を更新してください</p>
          </div>
          <DashboardBackLink variant="button" className="mb-0" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            サービス名 *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
            placeholder="サービス名を入力"
          />
        </div>

        <div>
          <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
            概要（オプション）
          </label>
          <textarea
            id="summary"
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
            placeholder="サービスの概要を入力"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            詳細説明（オプション）
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
            placeholder="サービスの詳細説明を入力"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              価格（円）
            </label>
            <input
              type="number"
              id="price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="10000"
            />
          </div>

          <div>
            <label htmlFor="duration_months" className="block text-sm font-medium text-gray-700 mb-2">
              期間（月）
            </label>
            <input
              type="number"
              id="duration_months"
              value={formData.duration_months}
              onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="12"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリ
            </label>
            <input
              type="text"
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="コンサルティング"
            />
          </div>
        </div>

        <ServiceImageUploader
          serviceId={serviceId}
          currentImageUrl={formData.image_url}
          onImageChange={(imageUrl) => setFormData({ ...formData, image_url: imageUrl })}
          disabled={saving}
        />

        <div>
          <label htmlFor="video_url" className="block text-sm font-medium text-gray-700 mb-2">
            動画URL（YouTube等）
          </label>
          <input
            type="url"
            id="video_url"
            value={formData.video_url}
            onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            サービス機能・特徴
          </label>
          <div className="space-y-2">
            {formData.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                  placeholder="例: 高度な分析機能"
                />
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-700"
                >
                  削除
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addFeature}
              className="px-4 py-2 text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] border border-[var(--aio-primary)] rounded-md hover:bg-blue-50"
            >
              + 機能を追加
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cta_text" className="block text-sm font-medium text-gray-700 mb-2">
              CTAボタンテキスト
            </label>
            <input
              type="text"
              id="cta_text"
              value={formData.cta_text}
              onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
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
              value={formData.cta_url}
              onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="https://example.com/service"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            公開ステータス
          </label>
          <select
            value={formData.is_published ? 'published' : 'draft'}
            onChange={(e) => setFormData({ ...formData, is_published: e.target.value === 'published' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
          >
            <option value="draft">下書き</option>
            <option value="published">公開</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            公開にすると企業ページに表示され、検索エンジンからも見つけられるようになります
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="flex space-x-4">
          <HIGButton
            type="submit"
            disabled={saving}
            variant="primary"
            size="md"
          >
            {saving ? '更新中...' : '更新'}
          </HIGButton>
          <Link
            href="/dashboard/services"
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 inline-block text-center"
            replace
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}