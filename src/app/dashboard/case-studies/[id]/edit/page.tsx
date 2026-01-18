'use client';

/**
 * Edit Case Study Page - 導入事例編集ページ
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { DashboardPageShell } from '@/components/dashboard';
import {
  DashboardPageHeader,
  DashboardButton,
  DashboardAlert,
} from '@/components/dashboard/ui';
import { logger } from '@/lib/utils/logger';

interface CaseStudy {
  id: string;
  title: string;
  slug?: string;
  client_name?: string;
  client_industry?: string;
  client_size?: string;
  challenge?: string;
  solution?: string;
  result?: string;
  testimonial?: string;
  images?: string[];
  is_published?: boolean;
  created_at: string;
  updated_at: string;
}

export default function EditCaseStudyPage() {
  return (
    <DashboardPageShell title="導入事例編集" requiredRole="editor">
      <EditCaseStudyContent />
    </DashboardPageShell>
  );
}

function EditCaseStudyContent() {
  const router = useRouter();
  const params = useParams();
  const caseStudyId = params.id as string;

  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    client_name: '',
    client_industry: '',
    client_size: '',
    challenge: '',
    solution: '',
    result: '',
    testimonial: '',
    is_published: false,
  });

  const fetchCaseStudy = useCallback(async () => {
    try {
      const response = await fetch(`/api/my/case-studies/${caseStudyId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('導入事例が見つかりません');
        } else {
          setError('導入事例の読み込みに失敗しました');
        }
        return;
      }

      const result = await response.json();
      const data = result.data;

      setCaseStudy(data);
      setFormData({
        title: data.title || '',
        client_name: data.client_name || '',
        client_industry: data.client_industry || '',
        client_size: data.client_size || '',
        challenge: data.challenge || '',
        solution: data.solution || '',
        result: data.result || '',
        testimonial: data.testimonial || '',
        is_published: data.is_published || false,
      });
    } catch (err) {
      setError('導入事例の読み込みに失敗しました');
      logger.error('Failed to fetch case study', { data: err });
    } finally {
      setLoading(false);
    }
  }, [caseStudyId]);

  useEffect(() => {
    fetchCaseStudy();
  }, [fetchCaseStudy]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/my/case-studies/${caseStudyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          client_name: formData.client_name || undefined,
          client_industry: formData.client_industry || undefined,
          client_size: formData.client_size || undefined,
          challenge: formData.challenge || undefined,
          solution: formData.solution || undefined,
          result: formData.result || undefined,
          testimonial: formData.testimonial || undefined,
          is_published: formData.is_published,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));

        if (response.status === 401) {
          setError('認証が必要です。ログインし直してください。');
          return;
        }

        if (response.status === 404) {
          setError('導入事例が見つかりません。');
          return;
        }

        setError(result.error || result.message || '更新に失敗しました');
        return;
      }

      const result = await response.json();

      if (result.ok !== false && result.data) {
        router.replace(ROUTES.dashboardCaseStudies);
      } else {
        setError(result.error || '更新に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      logger.error('Failed to update case study', { data: err });
    } finally {
      setSaving(false);
    }
  }, [caseStudyId, formData, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)]"></div>
        <span className="ml-3 text-[var(--color-text-secondary)]">読み込み中...</span>
      </div>
    );
  }

  if (!caseStudy && !loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">導入事例が見つかりません</h2>
          <Link
            href={ROUTES.dashboardCaseStudies}
            className="mt-4 text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] inline-block"
          >
            導入事例一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardPageHeader
        title="導入事例編集"
        description="導入事例の情報を更新してください"
        backLink={{ href: ROUTES.dashboardCaseStudies, label: '導入事例一覧' }}
      />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              タイトル *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="導入事例のタイトルを入力"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="client_name" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                クライアント名
              </label>
              <input
                type="text"
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                placeholder="株式会社〇〇"
              />
            </div>
            <div>
              <label htmlFor="client_industry" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                業種
              </label>
              <input
                type="text"
                id="client_industry"
                value={formData.client_industry}
                onChange={(e) => setFormData({ ...formData, client_industry: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                placeholder="製造業"
              />
            </div>
          </div>

          <div>
            <label htmlFor="challenge" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              課題
            </label>
            <textarea
              id="challenge"
              value={formData.challenge}
              onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="クライアントが抱えていた課題を入力"
            />
          </div>

          <div>
            <label htmlFor="solution" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              ソリューション
            </label>
            <textarea
              id="solution"
              value={formData.solution}
              onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="提供したソリューションを入力"
            />
          </div>

          <div>
            <label htmlFor="result" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              成果
            </label>
            <textarea
              id="result"
              value={formData.result}
              onChange={(e) => setFormData({ ...formData, result: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="達成した成果を入力"
            />
          </div>

          <div>
            <label htmlFor="testimonial" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              お客様の声
            </label>
            <textarea
              id="testimonial"
              value={formData.testimonial}
              onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="お客様からのコメントを入力"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="h-4 w-4 text-[var(--aio-primary)] focus:ring-[var(--aio-primary)] border-[var(--input-border)] rounded"
              />
              <span className="ml-2 text-sm text-[var(--color-text-secondary)]">公開する</span>
            </label>
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
            <DashboardButton
              type="submit"
              variant="primary"
              disabled={saving}
            >
              {saving ? '更新中...' : '更新'}
            </DashboardButton>
            <Link
              href={ROUTES.dashboardCaseStudies}
              className="bg-[var(--dashboard-card-border)] text-[var(--color-text-secondary)] px-6 py-2 rounded-md hover:bg-[var(--table-row-hover)] inline-block text-center"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
