'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageShell, useDashboardPageContext } from '@/components/dashboard';
import {
  DashboardPageHeader,
  DashboardAlert,
} from '@/components/dashboard/ui';

export default function NewCaseStudyPage() {
  return (
    <DashboardPageShell title="新規導入事例" requiredRole="editor">
      <NewCaseStudyContent />
    </DashboardPageShell>
  );
}

function NewCaseStudyContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      title: formData.get('title')?.toString() || '',
      summary: formData.get('summary')?.toString() || undefined,
      problem: formData.get('problem')?.toString() || undefined,
      solution: formData.get('solution')?.toString() || undefined,
      result: formData.get('result')?.toString() || undefined,
      client_name: formData.get('client_name')?.toString() || undefined,
      industry: formData.get('industry')?.toString() || undefined,
    };

    try {
      const response = await fetch('/api/my/case-studies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok && result.data) {
        router.replace('/dashboard/case-studies');
      } else {
        setError(result.error || result.message || '作成に失敗しました');
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
        title="新しい導入事例"
        description="導入事例の情報を入力してください"
        backLink={{ href: '/dashboard/case-studies', label: '導入事例一覧' }}
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
            name="title"
            required
            className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
            placeholder="導入事例のタイトルを入力"
          />
        </div>

        <div>
          <label htmlFor="summary" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            概要
          </label>
          <textarea
            id="summary"
            name="summary"
            rows={3}
            className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
            placeholder="導入事例の概要を入力"
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
              name="client_name"
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="株式会社〇〇"
            />
          </div>
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              業界
            </label>
            <input
              type="text"
              id="industry"
              name="industry"
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              placeholder="製造業、IT、小売など"
            />
          </div>
        </div>

        <div>
          <label htmlFor="problem" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            課題・背景
          </label>
          <textarea
            id="problem"
            name="problem"
            rows={3}
            className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
            placeholder="導入前の課題や背景を記述"
          />
        </div>

        <div>
          <label htmlFor="solution" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            解決策・導入内容
          </label>
          <textarea
            id="solution"
            name="solution"
            rows={3}
            className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
            placeholder="導入したサービスや解決策を記述"
          />
        </div>

        <div>
          <label htmlFor="result" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            成果・効果
          </label>
          <textarea
            id="result"
            name="result"
            rows={3}
            className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
            placeholder="導入後の成果や効果を記述"
          />
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