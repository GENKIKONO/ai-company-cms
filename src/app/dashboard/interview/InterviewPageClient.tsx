'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardPageShell } from '@/components/dashboard';
import { DashboardButton } from '@/components/dashboard/ui';
import type { InterviewQuestion, InterviewAxis } from '@/types/interview-session';
import { logger } from '@/lib/utils/logger';
import { OrgQuotaBadge, type SimpleQuotaProps } from '@/components/quota/OrgQuotaBadge';

interface InterviewPageClientProps {
  aiInterviewQuota: SimpleQuotaProps | null;
}

interface QuestionSelectorProps {
  axes: InterviewAxis[];
  questions: InterviewQuestion[];
  selectedQuestions: string[];
  onQuestionToggle: (questionId: string) => void;
}

function QuestionSelector({ axes, questions, selectedQuestions, onQuestionToggle }: QuestionSelectorProps) {
  const [activeAxis, setActiveAxis] = useState<string>('basic');

  const filteredQuestions = questions.filter(q => q.axis_code === activeAxis && q.is_active);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">質問を選択してください</h2>
        <p className="text-sm text-gray-600 mt-1">
          選択した質問でAIインタビューを開始します。後から追加・変更はできません。
        </p>
      </div>

      {/* 質問軸タブ */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          {axes.filter(axis => axis.is_active).map((axis) => (
            <button
              key={axis.axis_code}
              onClick={() => setActiveAxis(axis.axis_code)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeAxis === axis.axis_code
                  ? 'border-[var(--aio-primary)] text-[var(--aio-primary)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {axis.label_ja}
            </button>
          ))}
        </nav>
      </div>

      {/* 質問一覧 */}
      <div className="p-6">
        <div className="space-y-3">
          {filteredQuestions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              この軸の質問はありません
            </p>
          ) : (
            filteredQuestions.map((question) => (
              <div
                key={question.id}
                className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  id={question.id}
                  checked={selectedQuestions.includes(question.id)}
                  onChange={() => onQuestionToggle(question.id)}
                  className="h-4 w-4 text-[var(--aio-primary)] focus:ring-[var(--aio-primary)] border-gray-300 rounded mt-0.5"
                />
                <label htmlFor={question.id} className="flex-1 cursor-pointer">
                  <p className="text-sm font-medium text-gray-900">
                    {question.question_text}
                  </p>
                  {question.content_type && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--aio-muted)] text-[var(--aio-primary)] mt-2">
                      {question.content_type}
                    </span>
                  )}
                </label>
              </div>
            ))
          )}
        </div>

        {filteredQuestions.length > 0 && (
          <div className="mt-4 flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {selectedQuestions.filter(id => 
                filteredQuestions.some(q => q.id === id)
              ).length} / {filteredQuestions.length} 選択済み
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InterviewPageClient({ aiInterviewQuota }: InterviewPageClientProps) {
  return (
    <DashboardPageShell title="AIインタビュー" requiredRole="viewer">
      <InterviewPageContent aiInterviewQuota={aiInterviewQuota} />
    </DashboardPageShell>
  );
}

function InterviewPageContent({ aiInterviewQuota }: InterviewPageClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // データ
  const [axes, setAxes] = useState<InterviewAxis[]>([]);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  
  // 設定
  const [settings, setSettings] = useState({
    contentType: 'service' as 'service' | 'product' | 'faq' | 'case_study',
    organizationId: null as string | null
  });

  // Phase 4-C: Quota判定フラグ（fail-open設計）
  const isInterviewLimitReached = 
    !!aiInterviewQuota &&
    !aiInterviewQuota.unlimited &&
    aiInterviewQuota.limit >= 0 &&
    aiInterviewQuota.usedInWindow >= aiInterviewQuota.limit;

  const isInterviewDisabledByPlan = 
    !!aiInterviewQuota &&
    !aiInterviewQuota.unlimited &&
    aiInterviewQuota.limit === 0;

  const loadInterviewData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        content_type: settings.contentType,
        lang: 'ja'
      });

      if (settings.organizationId) {
        params.set('organization_id', settings.organizationId);
      }

      const response = await fetch(`/api/my/interview-questions?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load interview data');
      }

      const result = await response.json();
      setAxes(result.data?.axes || []);
      setQuestions(result.data?.questions || []);
      
    } catch (err) {
      logger.error('Failed to load interview data:', { data: err });
      setError(err instanceof Error ? err.message : 'Failed to load interview data');
    } finally {
      setLoading(false);
    }
  }, [settings.contentType, settings.organizationId]);

  useEffect(() => {
    loadInterviewData();
  }, [loadInterviewData]);

  const handleQuestionToggle = useCallback((questionId: string) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  }, []);

  const handleStartInterview = useCallback(async () => {
    if (selectedQuestions.length === 0) {
      alert('質問を1つ以上選択してください。');
      return;
    }

    try {
      setCreating(true);

      const response = await fetch('/api/my/interview/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: settings.organizationId,
          contentType: settings.contentType,
          questionIds: selectedQuestions
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create interview session');
      }

      const result = await response.json();
      
      if (result.success) {
        router.push(`/dashboard/interview/${result.sessionId}`);
      } else {
        throw new Error(result.error || 'Unknown error');
      }

    } catch (err) {
      logger.error('Failed to create interview session:', { data: err });
      alert('インタビューセッションの作成に失敗しました。');
    } finally {
      setCreating(false);
    }
  }, [selectedQuestions, settings, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">AIインタビュアー</h1>
                {/* Phase 4-B: Quota表示 */}
                <OrgQuotaBadge
                  label="AI面接"
                  quota={aiInterviewQuota}
                  className="text-sm"
                />
              </div>
              <p className="text-lg text-gray-600 mt-2">
                質問に答えることで、AIがコンテンツを自動生成します
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/dashboard/interview/history"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                履歴を見る
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                ← ダッシュボードに戻る
              </Link>
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 設定パネル */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">インタビュー設定</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                コンテンツタイプ
              </label>
              <select
                value={settings.contentType}
                onChange={(e) => setSettings({
                  ...settings,
                  contentType: e.target.value as typeof settings.contentType
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              >
                <option value="service">サービス</option>
                <option value="product">製品</option>
                <option value="faq">FAQ</option>
                <option value="case_study">導入事例</option>
              </select>
            </div>
          </div>
        </div>

        {/* 質問選択 */}
        <QuestionSelector
          axes={axes}
          questions={questions}
          selectedQuestions={selectedQuestions}
          onQuestionToggle={handleQuestionToggle}
        />

        {/* Phase 4-C: Quota警告表示 */}
        {isInterviewDisabledByPlan && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">AIインタビュー機能が無効です</h3>
                <p className="mt-1 text-sm text-red-700">
                  現在のプランではAIインタビュー機能をご利用いただけません。プランをアップグレードしてください。
                </p>
              </div>
            </div>
          </div>
        )}
        
        {isInterviewLimitReached && !isInterviewDisabledByPlan && (
          <div className="mt-8 bg-orange-50 border border-orange-200 rounded-md p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800">AIインタビュー上限に達しました</h3>
                <p className="mt-1 text-sm text-orange-700">
                  {aiInterviewQuota && `${aiInterviewQuota.usedInWindow}/${aiInterviewQuota.limit} のAIインタビューを使用済みです。`}
                  追加でAIインタビューを実行するには、プランをアップグレードしてください。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="mt-8 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedQuestions.length > 0 && (
              <span>{selectedQuestions.length}個の質問を選択中</span>
            )}
          </div>
          <div className="flex space-x-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </Link>
            <DashboardButton
              onClick={handleStartInterview}
              disabled={selectedQuestions.length === 0 || creating || isInterviewLimitReached || isInterviewDisabledByPlan}
              variant="primary"
            >
              {creating ? 'セッション作成中...' : 'インタビューを開始'}
            </DashboardButton>
          </div>
        </div>
      </main>
    </div>
  );
}