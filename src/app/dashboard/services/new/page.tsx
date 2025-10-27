'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ServiceImageUploader from '@/components/ServiceImageUploader';
import { HIGButton } from '@/design-system';

export default function NewServicePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [features, setFeatures] = useState<string[]>(['']);
  const [ctaText, setCtaText] = useState<string>('');
  const [ctaUrl, setCtaUrl] = useState<string>('');
  const [publishStatus, setPublishStatus] = useState<'draft' | 'published' | 'private'>('draft');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name')?.toString() || '',
      description: formData.get('description')?.toString() || '',
      price: formData.get('price')?.toString() || '',
      category: formData.get('category')?.toString() || '',
      is_published: publishStatus === 'published'
    };

    try {
      const response = await fetch('/api/my/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok && result.data) {
        router.push('/dashboard/services');
      } else {
        setError(result.message || result.error || '作成に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">新しいサービス</h1>
        <p className="text-gray-600 mt-2">サービス情報を入力してください</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            サービス名 *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="サービス名を入力"
          />
        </div>

        <div>
          <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
            概要（オプション）
          </label>
          <textarea
            id="summary"
            name="summary"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="サービスの概要を入力"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            詳細説明（オプション）
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              name="price"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              name="duration_months"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              name="category"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="コンサルティング"
            />
          </div>
        </div>

        <ServiceImageUploader
          currentImageUrl={imageUrl}
          onImageChange={setImageUrl}
          disabled={loading}
        />

        <div>
          <label htmlFor="video_url" className="block text-sm font-medium text-gray-700 mb-2">
            動画URL（YouTube等）
          </label>
          <input
            type="url"
            id="video_url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p className="mt-1 text-xs text-gray-500">
            YouTube、Vimeo等の動画URLを入力してください
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            サービス機能・特徴
          </label>
          <div className="space-y-2">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => {
                    const newFeatures = [...features];
                    newFeatures[index] = e.target.value;
                    setFeatures(newFeatures);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 高度な分析機能"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newFeatures = features.filter((_, i) => i !== index);
                    setFeatures(newFeatures.length > 0 ? newFeatures : ['']);
                  }}
                  className="px-3 py-2 text-red-600 hover:text-red-700"
                >
                  削除
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFeatures([...features, ''])}
              className="px-4 py-2 text-blue-600 hover:text-blue-700 border border-blue-600 rounded-md hover:bg-blue-50"
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
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/service"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            公開ステータス
          </label>
          <select
            value={publishStatus}
            onChange={(e) => setPublishStatus(e.target.value as 'draft' | 'published' | 'private')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">下書き</option>
            <option value="published">公開</option>
            <option value="private">非公開</option>
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
            disabled={loading}
            variant="primary"
            size="md"
          >
            {loading ? '作成中...' : '作成'}
          </HIGButton>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}