'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageShell } from '@/components/dashboard';
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title')?.toString() || '',
      problem: formData.get('problem')?.toString() || '',
      solution: formData.get('solution')?.toString() || '',
      result: formData.get('result')?.toString() || '',
      client_name: formData.get('client_name')?.toString() || '',
      client_industry: formData.get('client_industry')?.toString() || '',
      tags: []
    };

    try {
      const response = await fetch('/api/my/case-studies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        router.replace('/dashboard/case-studies');
      } else {
        setError(result.error || '作成に失敗しました');
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
            概要 *
          </label>
          <textarea
            id="summary"
            name="summary"
            required
            rows={4}
            className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
            placeholder="導入事例の概要を入力"
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