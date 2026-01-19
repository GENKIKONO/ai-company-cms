'use client';

/**
 * New Service Page - 新アーキテクチャ版
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageShell, useDashboardPageContext } from '@/components/dashboard';
import {
  DashboardPageHeader,
  DashboardAlert,
} from '@/components/dashboard/ui';
import ServiceImageUploader from '@/components/ServiceImageUploader';

export default function NewServicePage() {
  return (
    <DashboardPageShell
      title="新しいサービス"
      requiredRole="editor"
    >
      <NewServiceContent />
    </DashboardPageShell>
  );
}

function NewServiceContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [features, setFeatures] = useState<string[]>(['']);
  const [ctaText, setCtaText] = useState<string>('');
  const [ctaUrl, setCtaUrl] = useState<string>('');
  const [publishStatus, setPublishStatus] = useState<'draft' | 'published' | 'private'>('draft');
  const router = useRouter();
  const { organizationId } = useDashboardPageContext();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!organizationId) {
      setError('組織情報が取得できません。ページを再読み込みしてください。');
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      organizationId,
      name: formData.get('name')?.toString() || '',
      summary: formData.get('summary')?.toString() || '',
      description: formData.get('description')?.toString() || '',
      price: formData.get('price')?.toString() ? parseInt(formData.get('price')?.toString() || '0', 10) : null,
      duration_months: formData.get('duration_months')?.toString() ? parseInt(formData.get('duration_months')?.toString() || '0', 10) : null,
      category: formData.get('category')?.toString() || '',
      slug: formData.get('slug')?.toString() || '', // オプション
      is_published: publishStatus === 'published'
    };

    try {
      const response = await fetch('/api/my/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));

        if (response.status === 401) {
          setError('認証が必要です。ログインし直してください。');
          return;
        } else if (response.status === 403) {
          setError('この操作を行う権限がありません。');
        } else if (response.status === 400 && result.code === 'DUPLICATE_SLUG') {
          setError('このスラッグは既に使用されています。別のスラッグを使用してください。');
        } else if (response.status >= 500) {
          const errorMsg = result.error || 'サーバーエラーが発生しました。しばらく後にお試しください。';
          const logDetails = result.code ? ` (${result.code})` : '';
          setError(errorMsg + logDetails);
        } else {
          setError(result.error || result.message || '作成に失敗しました');
        }
        return;
      }

      const result = await response.json();
      if (result.data) {
        router.replace('/dashboard/services');
      } else {
        setError(result.error || 'サービスの作成に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DashboardPageHeader
        title="新しいサービス"
        description="サービス情報を入力してください"
        backLink={{ href: '/dashboard/services', label: 'サービス一覧' }}
      />

      <div className="max-w-2xl">

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            サービス名 *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
            placeholder="サービス名を入力"
          />
        </div>

        <div>
          <label htmlFor="summary" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            概要（オプション）
          </label>
          <textarea
            id="summary"
            name="summary"
            rows={3}
            className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
            placeholder="サービスの概要を入力"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            詳細説明（オプション）
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
            placeholder="サービスの詳細説明を入力"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              価格（円）
            </label>
            <input
              type="number"
              id="price"
              name="price"
              min="0"
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="10000"
            />
          </div>

          <div>
            <label htmlFor="duration_months" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              期間（月）
            </label>
            <input
              type="number"
              id="duration_months"
              name="duration_months"
              min="1"
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="12"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              カテゴリ
            </label>
            <input
              type="text"
              id="category"
              name="category"
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="コンサルティング"
            />
          </div>
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            スラッグ（オプション）
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
            placeholder="ai-consulting-service"
          />
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            URL用の識別子。空白の場合は自動生成されます。半角英数字とハイフンのみ使用可能。
          </p>
        </div>

        <ServiceImageUploader
          currentImageUrl={imageUrl}
          onImageChange={setImageUrl}
          disabled={loading}
        />

        <div>
          <label htmlFor="video_url" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            動画URL（YouTube等）
          </label>
          <input
            type="url"
            id="video_url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            YouTube、Vimeo等の動画URLを入力してください
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
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
                  className="flex-1 px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                  placeholder="例: 高度な分析機能"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newFeatures = features.filter((_, i) => i !== index);
                    setFeatures(newFeatures.length > 0 ? newFeatures : ['']);
                  }}
                  className="px-3 py-2 text-[var(--aio-danger)] hover:text-[var(--aio-danger)]"
                >
                  削除
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFeatures([...features, ''])}
              className="px-4 py-2 text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] border border-[var(--aio-primary)] rounded-md hover:bg-[var(--aio-muted)]"
            >
              + 機能を追加
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cta_text" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              CTAボタンテキスト
            </label>
            <input
              type="text"
              id="cta_text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="例: 詳細を見る"
            />
          </div>
          <div>
            <label htmlFor="cta_url" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              CTAURL
            </label>
            <input
              type="url"
              id="cta_url"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="https://example.com/service"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            公開ステータス
          </label>
          <select
            value={publishStatus}
            onChange={(e) => setPublishStatus(e.target.value as 'draft' | 'published' | 'private')}
            className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
          >
            <option value="draft">下書き</option>
            <option value="published">公開</option>
            <option value="private">非公開</option>
          </select>
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            公開にすると企業ページに表示され、検索エンジンからも見つけられるようになります
          </p>
        </div>

        {error && (
          <DashboardAlert
            variant="error"
            title="エラー"
            description={error}
          />
        )}

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-[var(--aio-primary)] text-white px-6 py-2 rounded-md hover:bg-[var(--aio-primary-hover)] disabled:opacity-50"
          >
            {loading ? '作成中...' : '作成'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-[var(--dashboard-card-border)] text-[var(--color-text-secondary)] px-6 py-2 rounded-md hover:bg-[var(--table-row-hover)]"
          >
            キャンセル
          </button>
        </div>
      </form>
      </div>
    </>
  );
}