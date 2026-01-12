'use client';

/**
 * Test Interview Page - 新アーキテクチャ版
 */

import { useState } from 'react';
import { DashboardPageShell } from '@/components/dashboard';
import { DashboardPageHeader, DashboardCard, DashboardCardHeader, DashboardCardContent, DashboardButton, DashboardAlert } from '@/components/dashboard/ui';
import { logger } from '@/lib/utils/logger';

interface TestResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export default function TestInterviewPage() {
  return (
    <DashboardPageShell
      title="AIインタビュー E2Eテスト"
      requiredRole="admin"
    >
      <TestInterviewContent />
    </DashboardPageShell>
  );
}

function TestInterviewContent() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const addResult = (step: string, success: boolean, data?: any, error?: string) => {
    const result: TestResult = {
      step,
      success,
      data,
      error,
      timestamp: new Date().toLocaleString('ja-JP')
    };
    setResults(prev => [...prev, result]);
    return result;
  };

  const runEndToEndTest = async () => {
    setTesting(true);
    setResults([]);

    try {
      // Step 1: 質問一覧取得テスト
      addResult('質問一覧取得開始', true);
      
      const questionsResponse = await fetch('/api/my/interview-questions?content_type=service&lang=ja');
      if (!questionsResponse.ok) {
        const errorData = await questionsResponse.json();
        addResult('質問一覧取得', false, null, errorData.error);
        return;
      }

      const questionsResult = await questionsResponse.json();
      const questions = questionsResult.data?.questions || [];
      addResult('質問一覧取得', true, { questionsCount: questions.length });

      if (questions.length === 0) {
        addResult('質問データ確認', false, null, '質問データが存在しません');
        return;
      }

      // Step 2: セッション作成テスト
      const questionIds = questions.slice(0, 2).map((q: any) => q.id); // 最初の2問だけ使用
      
      const createSessionResponse = await fetch('/api/my/interview/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: null,
          contentType: 'service',
          questionIds
        })
      });

      if (!createSessionResponse.ok) {
        const errorData = await createSessionResponse.json();
        addResult('セッション作成', false, null, errorData.error);
        return;
      }

      const createResult = await createSessionResponse.json();
      if (!createResult.success) {
        addResult('セッション作成', false, null, createResult.error);
        return;
      }

      const sessionId = createResult.sessionId;
      addResult('セッション作成', true, { sessionId });

      // Step 3: セッション詳細取得テスト
      const getSessionResponse = await fetch(`/api/my/interview/sessions/${sessionId}`);
      if (!getSessionResponse.ok) {
        const errorData = await getSessionResponse.json();
        addResult('セッション詳細取得', false, null, errorData.error);
        return;
      }

      const sessionResult = await getSessionResponse.json();
      if (!sessionResult.success) {
        addResult('セッション詳細取得', false, null, sessionResult.error);
        return;
      }

      addResult('セッション詳細取得', true, { 
        status: sessionResult.data.status,
        answerCount: Object.keys(sessionResult.data.answers).length 
      });

      // Step 4: 回答保存テスト
      const testAnswers = [
        { questionId: questionIds[0], answer: 'これはテスト回答1です。サービスの主要機能について説明します。' },
        { questionId: questionIds[1], answer: 'これはテスト回答2です。顧客が得られるメリットについて詳しく説明します。' }
      ];

      for (let i = 0; i < testAnswers.length; i++) {
        const { questionId, answer } = testAnswers[i];
        
        const saveAnswerResponse = await fetch(`/api/my/interview/sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            answers: { [questionId]: answer }, 
            clientVersion: 0 
          })
        });

        if (!saveAnswerResponse.ok) {
          const errorData = await saveAnswerResponse.json();
          addResult(`回答${i + 1}保存`, false, null, errorData.message || errorData.error);
          return;
        }

        const saveResult = await saveAnswerResponse.json();
        if (!saveResult.ok) {
          addResult(`回答${i + 1}保存`, false, null, 'Auto-save failed');
          return;
        }

        addResult(`回答${i + 1}保存`, true, { 
          version: saveResult.newVersion,
          updatedAt: saveResult.updatedAt
        });
      }

      // Step 5: セッション完了・AI生成テスト
      addResult('AI生成開始', true);
      
      const finalizeResponse = await fetch(`/api/my/interview/sessions/${sessionId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!finalizeResponse.ok) {
        const errorData = await finalizeResponse.json();
        addResult('AI生成・セッション完了', false, null, errorData.error);
        return;
      }

      const finalizeResult = await finalizeResponse.json();
      if (!finalizeResult.success) {
        addResult('AI生成・セッション完了', false, null, finalizeResult.error);
        return;
      }

      addResult('AI生成・セッション完了', true, { 
        contentLength: finalizeResult.generatedContent?.length || 0,
        hasContent: !!finalizeResult.generatedContent 
      });

      // Step 6: 完了後のセッション状態確認
      const finalSessionResponse = await fetch(`/api/my/interview/sessions/${sessionId}`);
      if (finalSessionResponse.ok) {
        const finalSessionResult = await finalSessionResponse.json();
        if (finalSessionResult.success) {
          addResult('最終セッション状態確認', true, { 
            status: finalSessionResult.data.status,
            hasGeneratedContent: !!finalSessionResult.data.generated_content 
          });
        }
      }

      addResult("End-to-Endテスト完了", true, {
        sessionId,
        totalSteps: results.length + 1
      });

    } catch (error) {
      logger.error('E2E Test Error:', { data: error });
      addResult('テスト実行エラー', false, null, error instanceof Error ? error.message : String(error));
    } finally {
      setTesting(false);
    }
  };

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return (
    <>
      <DashboardPageHeader
        title="AIインタビュー E2Eテスト"
        description="認証済みユーザーでのエンドツーエンド動作確認"
        backLink={{ href: '/dashboard', label: 'ダッシュボード' }}
      />

      <DashboardCard className="mb-6">
        <DashboardCardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">テスト実行</h2>
            <DashboardButton
              onClick={runEndToEndTest}
              loading={testing}
              variant="primary"
            >
              E2Eテスト開始
            </DashboardButton>
          </div>
        </DashboardCardHeader>
        <DashboardCardContent>

          {results.length > 0 && (
            <div className="mb-4 p-4 bg-[var(--aio-surface)] rounded-lg">
              <div className="flex space-x-4 text-sm">
                <span className="text-[var(--aio-success)] font-medium">成功: {successCount}</span>
                <span className="text-[var(--aio-danger)] font-medium">失敗: {failCount}</span>
                <span className="text-[var(--color-text-secondary)]">合計: {results.length}</span>
              </div>
            </div>
          )}

          <div className="text-sm text-[var(--color-text-secondary)]">
            <p><strong>テスト項目:</strong></p>
            <ol className="list-decimal list-inside ml-4">
              <li>質問一覧取得 (GET /api/my/interview-questions)</li>
              <li>セッション作成 (POST /api/my/interview/sessions)</li>
              <li>セッション詳細取得 (GET /api/my/interview/sessions/[id])</li>
              <li>回答保存 × 2回 (PATCH /api/my/interview/sessions/[id] - 自動保存)</li>
              <li>AI生成・完了 (POST /api/my/interview/sessions/[id]/finalize)</li>
              <li>最終状態確認</li>
            </ol>
          </div>
        </DashboardCardContent>
      </DashboardCard>

      <DashboardCard className="mb-6">
        <DashboardCardHeader>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">テスト結果</h3>
        </DashboardCardHeader>
        <DashboardCardContent>
          {results.length === 0 ? (
            <p className="text-[var(--color-text-secondary)] text-center py-8">
              テストを実行してください
            </p>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    result.success
                      ? 'bg-[var(--status-success-bg)] border-[var(--status-success)]'
                      : 'bg-[var(--status-error-bg)] border-[var(--status-error)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${
                        result.success ? 'text-[var(--status-success)]' : 'text-[var(--status-error)]'
                      }`}>
                        {result.success ? '✅' : '❌'} {result.step}
                      </span>
                      <span className="text-xs text-[var(--color-text-tertiary)] ml-2">
                        {result.timestamp}
                      </span>
                    </div>
                  </div>

                  {result.data && (
                    <div className="mt-2">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-[var(--color-text-secondary)]">データ詳細</summary>
                        <pre className="mt-2 bg-[var(--aio-muted)] p-2 rounded text-[var(--color-text-primary)] overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}

                  {result.error && (
                    <div className="mt-2 text-sm text-[var(--status-error)]">
                      <strong>エラー:</strong> {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DashboardCardContent>
      </DashboardCard>

      <DashboardAlert variant="warning">
        <h4 className="text-sm font-medium text-[var(--status-warning)] mb-2">注意事項</h4>
        <ul className="text-xs text-[var(--color-text-secondary)] space-y-1">
          <li>• このテストは認証済みユーザーでのみ実行可能です</li>
          <li>• テストデータとして実際のセッションが作成されます</li>
          <li>• OpenAI API キーが設定されていない場合、フォールバック生成が使用されます</li>
          <li>• 失敗した場合は、各ステップのエラー詳細を確認してください</li>
        </ul>
      </DashboardAlert>
    </>
  );
}