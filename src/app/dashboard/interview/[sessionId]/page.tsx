'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardPageShell } from '@/components/dashboard';
import { DashboardButton } from '@/components/dashboard/ui';
import ContentGenerationPanel from '@/components/interview/ContentGenerationPanel';
import type { InterviewQuestion } from '@/types/interview-session';
import { logger } from '@/lib/utils/logger';
import { useAutoSaveDiffInterviewAnswers, type DiffAutoSaveStatus } from '@/hooks/useAutoSaveDiffInterviewAnswers';
import ConflictDialog from '@/components/interview/ConflictDialog';
import { ClipboardIcon, SearchIcon, BulbIcon, DocumentIcon } from '@/components/icons/HIGIcons';

interface SessionData {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  content_type: string;
  status: 'draft' | 'in_progress' | 'completed';
  answers: Record<string, unknown>;
  generated_content?: string | null;
  generated_content_json?: any | null; // Phase 2-3: 構造化コンテンツ
  created_at: string;
  updated_at: string;
  version: number;
}

// Phase 2-3: AI生成の状態管理（確定仕様対応）
type GenerationState = 'idle' | 'generating' | 'generated' | 'error';

interface GenerationError {
  code: string;
  message: string;
  detail?: any;
}

// Phase 2-3: 生成結果の一時保存用
interface GenerationResult {
  content: string;
  citations: Array<{
    type: string;
    sourceId?: string;
    title?: string;
    snippet?: string;
    meta?: any;
  }>;
  usedModel: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  structured?: {
    sections?: Array<{
      key: string;
      title?: string;
      content: string;
      meta?: any;
    }>;
  };
}

// Phase 2-3: 確定仕様準拠の構造化コンテンツ表示
interface ContentSectionProps {
  sections: Array<{
    key: string;
    title?: string;
    content: string;
    meta?: any;
  }>;
}

function StructuredContent({ sections }: ContentSectionProps) {
  const getSectionIcon = (key: string) => {
    switch (key) {
      case 'summary': return <ClipboardIcon className="w-5 h-5 text-[var(--aio-info)]" aria-hidden />;
      case 'analysis': return <SearchIcon className="w-5 h-5 text-[var(--aio-success)]" aria-hidden />;
      case 'recommendation': return <BulbIcon className="w-5 h-5 text-[var(--aio-warning)]" aria-hidden />;
      default: return <DocumentIcon className="w-5 h-5 text-[var(--color-text-secondary)]" aria-hidden />;
    }
  };

  const getSectionColor = (key: string) => {
    switch (key) {
      case 'summary': return 'bg-[var(--aio-muted)] border-[var(--aio-primary)]/30';
      case 'analysis': return 'bg-[var(--aio-success-muted)] border-[var(--aio-success)]';
      case 'recommendation': return 'bg-[var(--aio-pending-muted)] border-[var(--aio-pending)]';
      default: return 'bg-[var(--aio-surface)] border-[var(--dashboard-card-border)]';
    }
  };

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div 
          key={section.key} 
          className={`rounded-lg border p-6 ${getSectionColor(section.key)}`}
        >
          <div className="flex items-center mb-3">
            <span className="text-xl mr-2">{getSectionIcon(section.key)}</span>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{section.title || section.key}</h3>
          </div>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-[var(--color-text-secondary)] leading-relaxed">
              {section.content}
            </div>
          </div>
        </div>
      ))}
      
    </div>
  );
}

// EPIC 2-2: 差分保存対応の自動保存ステータス表示コンポーネント
interface AutoSaveStatusProps {
  status: DiffAutoSaveStatus;
  errorMessage?: string;
  isCompact?: boolean; // 生成中は小さく表示
  conflictLatest?: {
    id: string;
    version: number;
    updated_at: string;
    answers: Record<string, unknown>;
  };
  onResolveConflict?: (useLatest: boolean) => void;
}

function AutoSaveStatus({ status, errorMessage, isCompact, conflictLatest, onResolveConflict }: AutoSaveStatusProps) {
  if (status === 'idle') return null;

  if (status === 'saving') {
    return (
      <div className={`flex items-center space-x-2 text-[var(--aio-primary)] ${isCompact ? 'text-xs' : ''}`}>
        <div className={`border-2 border-[var(--aio-primary)] border-t-transparent rounded-full animate-spin ${isCompact ? 'w-3 h-3' : 'w-4 h-4'}`}></div>
        <span className={isCompact ? 'text-xs' : 'text-sm'}>保存中...</span>
      </div>
    );
  }

  if (status === 'saved') {
    return (
      <div className={`flex items-center space-x-2 text-[var(--aio-success)] ${isCompact ? 'text-xs' : ''}`}>
        <svg className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className={isCompact ? 'text-xs' : 'text-sm'}>保存済み</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={`bg-[var(--aio-danger-muted)] border border-[var(--aio-danger)] rounded-md p-4 ${isCompact ? 'p-2' : ''}`}>
        <div className="flex">
          <svg className={`text-[var(--aio-danger)] ${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <h3 className={`font-medium text-[var(--aio-danger)] ${isCompact ? 'text-xs' : 'text-sm'}`}>自動保存エラー</h3>
            <p className={`text-[var(--aio-danger)] mt-1 ${isCompact ? 'text-xs' : 'text-sm'}`}>{errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'conflict') {
    return (
      <div className={`flex items-center space-x-2 text-[var(--aio-pending)] ${isCompact ? 'text-xs' : ''}`}>
        <svg className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span className={isCompact ? 'text-xs' : 'text-sm'}>競合発生</span>
      </div>
    );
  }

  return null;
}

// Phase 2-3: エラーバナーコンポーネント
interface ErrorBannerProps {
  error: GenerationError;
  onRetry: () => void;
  onDismiss: () => void;
}

function ErrorBanner({ error, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <div className="mb-6 bg-[var(--aio-danger-muted)] border border-[var(--aio-danger)] rounded-lg p-4">
      <div className="flex items-start">
        <svg className="w-5 h-5 text-[var(--aio-danger)] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-[var(--aio-danger)]">AI生成エラー</h3>
          <p className="text-sm text-[var(--aio-danger)] mt-1">{error.message}</p>
          {error.code && (
            <p className="text-xs text-[var(--aio-danger)] mt-1">エラーコード: {error.code}</p>
          )}
        </div>
        <div className="ml-3 flex space-x-2">
          <button
            onClick={onRetry}
            className="px-3 py-1 bg-[var(--aio-danger-muted)] text-[var(--aio-danger)] rounded text-sm hover:opacity-80 transition-colors"
          >
            再試行
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-1 bg-[var(--aio-surface)] text-[var(--color-text-secondary)] rounded text-sm hover:bg-[var(--dashboard-card-border)] transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

interface QuestionNavigatorProps {
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  answers: Record<string, unknown>;
  onQuestionChange: (index: number) => void;
}

function QuestionNavigator({ questions, currentQuestionIndex, answers, onQuestionChange }: QuestionNavigatorProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-[var(--dashboard-card-border)] p-4 mb-6">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">質問一覧</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {questions.map((question, index) => {
          const answerValue = answers[question.id];
          const isAnswered = answerValue !== undefined && answerValue !== null && String(answerValue).trim() !== '';
          const isCurrent = index === currentQuestionIndex;
          
          return (
            <button
              key={question.id}
              onClick={() => onQuestionChange(index)}
              className={`p-2 text-left rounded-lg border text-sm ${
                isCurrent
                  ? 'bg-[var(--aio-primary)] text-white border-[var(--aio-primary)]'
                  : isAnswered
                  ? 'bg-[var(--aio-success-muted)] text-[var(--aio-success)] border-[var(--aio-success)] hover:bg-[var(--aio-success-muted)]'
                  : 'bg-[var(--aio-surface)] text-[var(--color-text-secondary)] border-[var(--dashboard-card-border)] hover:bg-[var(--aio-surface)]'
              }`}
            >
              <div className="font-medium">質問 {index + 1}</div>
              <div className="truncate opacity-75">
                {question.question_text.substring(0, 30)}...
              </div>
              {isAnswered && (
                <div className="text-xs mt-1 opacity-75">✓ 回答済み</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface AnswerEditorProps {
  question: InterviewQuestion;
  answer: unknown;
  onAnswerChange: (answer: string) => void;
  autoSaveStatus: DiffAutoSaveStatus;
  autoSaveError?: string;
  isGenerating: boolean; // Phase 2-3: 生成中はコンパクト表示
}

function AnswerEditor({ question, answer, onAnswerChange, autoSaveStatus, autoSaveError, isGenerating }: AnswerEditorProps) {
  const answerString = String(answer || '');
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-[var(--dashboard-card-border)] p-6">
      <div className="mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              {question.question_text}
            </h2>
            {question.content_type && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--aio-muted)] text-[var(--aio-primary)]">
                {question.content_type}
              </span>
            )}
          </div>
          {/* 自動保存ステータス表示 (Phase 2-3: 生成中はコンパクト) */}
          <div className="ml-4">
            <AutoSaveStatus 
              status={autoSaveStatus} 
              errorMessage={autoSaveError}
              isCompact={isGenerating}
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="answer" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
          回答（自動保存）
        </label>
        <textarea
          id="answer"
          value={answerString}
          onChange={(e) => onAnswerChange(e.target.value)}
          rows={6}
          disabled={isGenerating} // Phase 2-3: 生成中は編集不可
          className={`w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)] focus:border-transparent resize-vertical ${isGenerating ? 'bg-[var(--aio-surface)] cursor-not-allowed' : ''}`}
          placeholder="こちらに回答を入力してください（1秒後に自動保存されます）..."
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            {answerString.length} 文字 (最大 5000 文字)
          </p>
          {!isGenerating && (
            <>
              {autoSaveStatus === 'saving' && (
                <p className="text-xs text-[var(--aio-info)]">保存中...</p>
              )}
              {autoSaveStatus === 'saved' && (
                <p className="text-xs text-[var(--aio-success)]">✓ 保存済み</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InterviewSessionPage() {
  return (
    <DashboardPageShell title="AIインタビューセッション" requiredRole="viewer">
      <InterviewSessionContent />
    </DashboardPageShell>
  );
}

function InterviewSessionContent() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Phase 2-3: AI生成状態管理
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [generationError, setGenerationError] = useState<GenerationError | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  // EPIC 2-2: 差分保存フックの初期化
  const autoSave = useAutoSaveDiffInterviewAnswers({
    sessionId: session?.id || sessionId,
    initialAnswers: session?.answers || {},
    initialUpdatedAt: session?.updated_at || new Date().toISOString(),
    debounceMs: 1000, // 差分保存は高速なのでより短く
  });

  // セッション初期データ読み込み
  const loadSessionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // セッション情報を取得
      const sessionResponse = await fetch(`/api/my/interview/sessions/${sessionId}`);
      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load session');
      }

      const sessionResult = await sessionResponse.json().catch(() => ({ data: null }));
      if (!sessionResult.data) {
        throw new Error('Failed to load session data');
      }

      const sessionData = sessionResult.data;
      const sessionWithVersion = {
        ...sessionData,
        version: sessionData.version ?? 0,
      };
      setSession(sessionWithVersion);

      // 質問一覧を取得
      const params = new URLSearchParams({
        content_type: sessionData.content_type,
        lang: 'ja'
      });

      if (sessionData.organization_id) {
        params.set('organization_id', sessionData.organization_id);
      }

      const questionsResponse = await fetch(`/api/my/interview-questions?${params}`);
      if (!questionsResponse.ok) {
        const errorData = await questionsResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load questions');
      }

      const questionsResult = await questionsResponse.json().catch(() => ({ data: { questions: [] } }));
      const questionsList = questionsResult.data?.questions || [];
      setQuestions(questionsList);

      // 完了済みの場合は生成完了状態に設定
      if (sessionData.status === 'completed') {
        setGenerationState('generated');
        setCurrentQuestionIndex(Math.max(0, questionsList.length - 1));
      }

    } catch (err) {
      logger.error('Failed to load session data:', { data: err });
      setError(err instanceof Error ? err.message : 'Failed to load session data');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId, loadSessionData]);

  // Phase 2-3: AI生成実行
  const handleFinalize = useCallback(async () => {
    if (!session) return;

    const currentAnswers = autoSave?.answers || {};
    const answeredCount = Object.values(currentAnswers).filter(answer => 
      answer !== undefined && answer !== null && String(answer).trim() !== ''
    ).length;

    if (answeredCount === 0) {
      alert('少なくとも1つの質問に回答してください。');
      return;
    }

    const isConfirmed = window.confirm(
      `${answeredCount}個の回答でAIにまとめてもらいますか？\n完了後は回答を変更できません。`
    );

    if (!isConfirmed) return;

    try {
      setGenerationState('generating');
      setGenerationError(null);

      const response = await fetch(`/api/my/interview/sessions/${sessionId}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }), // Phase 2-3: セッションIDをbodyに含める
      });

      const result = await response.json().catch(() => ({ success: false, message: 'Invalid response format' }));

      // Phase 2-3: 統一エラーレスポンス処理
      if (!result.success) {
        setGenerationError({
          code: result.code || 'UNKNOWN_ERROR',
          message: result.message || 'AI生成に失敗しました',
          detail: result.detail
        });
        setGenerationState('error');
        return;
      }

      // Phase 2-3: 成功時の処理（確定仕様対応）
      setSession(prev => prev ? {
        ...prev,
        status: 'completed',
        generated_content: result.content,
        generated_content_json: null // 確定仕様：structured形式は別管理
      } : prev);

      // 生成結果を一時保存（構造化コンテンツ表示のため）
      setGenerationResult({
        content: result.content,
        citations: result.citations || [],
        usedModel: result.usedModel,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        durationMs: result.durationMs,
        structured: result.structured // APIレスポンスから一時的に取得
      });

      setGenerationState('generated');

      logger.info('Interview session finalized successfully', {
        data: {
          sessionId,
          model: result.usedModel,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          durationMs: result.durationMs,
          citationsCount: result.citations?.length || 0,
          contentLength: result.content.length
        }
      });

    } catch (err) {
      logger.error('Failed to finalize session:', { data: err });
      setGenerationError({
        code: 'NETWORK_ERROR',
        message: 'ネットワークエラーが発生しました',
        detail: err instanceof Error ? err.message : err
      });
      setGenerationState('error');
    }
  }, [session, autoSave?.answers, sessionId]);

  // Phase 2-3: エラー処理
  const handleRetry = useCallback(() => {
    setGenerationError(null);
    setGenerationState('idle');
  }, []);

  const handleDismissError = useCallback(() => {
    setGenerationError(null);
    setGenerationState('idle');
  }, []);

  // 回答変更（自動保存フック経由）
  const handleAnswerChange = useCallback((answer: string) => {
    if (!questions[currentQuestionIndex] || !autoSave) return;

    const questionId = questions[currentQuestionIndex].id;
    autoSave.setAnswer(questionId, answer);
  }, [questions, currentQuestionIndex, autoSave]);

  // 質問ナビゲーション
  const handleQuestionChange = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
  }, []);

  // 進捗計算
  const currentAnswers = autoSave?.answers || {};
  const answeredCount = Object.values(currentAnswers).filter(answer => 
    answer !== undefined && answer !== null && String(answer).trim() !== ''
  ).length;
  const progressPercentage = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const isGenerating = generationState === 'generating';
  const isGenerated = generationState === 'generated';

  // EPIC 2-2: 競合解決ハンドラー
  const handleConflictResolve = useCallback((useLatest: boolean) => {
    autoSave.resolveConflict(useLatest);
  }, [autoSave]);

  // EPIC 2-2: 競合ダイアログ用の情報
  const conflictInfo = autoSave.conflictLatest ? {
    currentAnswerCount: Object.values(autoSave.answers).filter(answer => 
      answer !== undefined && answer !== null && String(answer).trim() !== ''
    ).length,
    latestAnswerCount: Object.values(autoSave.conflictLatest.answers).filter(answer => 
      answer !== undefined && answer !== null && String(answer).trim() !== ''
    ).length,
    lastUpdated: autoSave.conflictLatest.updated_at
  } : null;

  if (loading) {
    return (
      <div className="">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--dashboard-card-border)] rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="h-6 bg-[var(--dashboard-card-border)] rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-[var(--dashboard-card-border)] rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Link
              href="/dashboard/interview"
              className="inline-flex items-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4"
            >
              ← インタビューに戻る
            </Link>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">エラーが発生しました</h1>
          </div>
          <div className="bg-[var(--aio-danger-muted)] border border-[var(--aio-danger)] rounded-md p-4">
            <p className="text-[var(--aio-danger)]">{error}</p>
            <div className="mt-4">
              <Link
                href="/dashboard/interview"
                className="px-4 py-2 bg-[var(--aio-danger-muted)] text-[var(--aio-danger)] rounded hover:opacity-80 inline-block"
              >
                質問選択に戻る
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">セッションが見つかりません</h1>
            <Link href="/dashboard/interview" className="text-[var(--aio-primary)] hover:text-[var(--aio-primary)]">
              新しいインタビューを開始
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion && autoSave ? autoSave.answers[currentQuestion.id] : '';

  return (
    <div className="">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard/interview"
                className="inline-flex items-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4"
              >
                ← インタビューに戻る
              </Link>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">AIインタビュー</h1>
              <p className="text-lg text-[var(--color-text-secondary)] mt-2">
                質問に答えてAIにまとめてもらいましょう
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-[var(--color-text-tertiary)]">進捗</div>
              <div className="text-2xl font-bold text-[var(--aio-primary)]">
                {progressPercentage}%
              </div>
              <div className="text-sm text-[var(--color-text-tertiary)]">
                {answeredCount} / {questions.length} 完了
              </div>
            </div>
          </div>
        </div>

        {/* Phase 2-3: 生成中ステータス */}
        {isGenerating && (
          <div className="mb-8 bg-[var(--aio-muted)] border border-[var(--aio-primary)]/30 rounded-lg p-6">
            <div className="flex items-center">
              <div className="w-6 h-6 border-3 border-[var(--aio-primary)] border-t-transparent rounded-full animate-spin mr-4"></div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--aio-primary)] mb-1">
                  AIが文章を生成しています...
                </h2>
                <p className="text-[var(--aio-primary)]">
                  回答内容を分析し、包括的なレポートを作成中です。しばらくお待ちください。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Phase 2-3: エラーバナー */}
        {generationState === 'error' && generationError && (
          <ErrorBanner
            error={generationError}
            onRetry={handleFinalize}
            onDismiss={handleDismissError}
          />
        )}

        {/* Phase 2-3: 生成結果表示 */}
        {isGenerated && (generationResult?.content || session.generated_content) && (
          <div className="mb-8 bg-[var(--aio-success-muted)] border border-[var(--aio-success)] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[var(--aio-success)] mb-4">
              ✅ AIまとめ生成完了
            </h2>
            
            {/* Phase 2-3: 生成メタデータ表示 */}
            {generationResult && (
              <div className="mb-4 text-sm text-[var(--color-text-secondary)] flex items-center space-x-4">
                <span>モデル: {generationResult.usedModel}</span>
                {generationResult.citations && generationResult.citations.length > 0 && (
                  <span>引用: {generationResult.citations.length}件</span>
                )}
              </div>
            )}
            
            {/* Phase 2-3: 構造化コンテンツがある場合は構造化表示 */}
            {generationResult?.structured?.sections ? (
              <div className="bg-white rounded-lg p-6 border">
                <StructuredContent
                  sections={generationResult.structured.sections}
                />
              </div>
            ) : session.generated_content_json?.sections ? (
              <div className="bg-white rounded-lg p-6 border">
                <StructuredContent
                  sections={session.generated_content_json.sections}
                />
              </div>
            ) : (
              /* プレーンテキストの場合は従来通り */
              <div className="bg-white rounded p-4 border">
                <pre className="whitespace-pre-wrap text-[var(--color-text-primary)] text-sm leading-relaxed">
                  {generationResult?.content || session.generated_content}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* P2-8: コンテンツ生成パネル */}
        <ContentGenerationPanel
          sessionId={sessionId}
          sessionStatus={session.status}
          className="mb-8"
        />

        {/* 自動保存の競合解決UI */}
        {autoSave && autoSave.status === 'conflict' && autoSave.conflictLatest && (
          <div className="mb-6">
            <AutoSaveStatus 
              status={autoSave.status}
              errorMessage={autoSave.errorMessage}
              conflictLatest={autoSave.conflictLatest}
              onResolveConflict={autoSave.resolveConflict}
            />
          </div>
        )}

        {/* 質問ナビゲーター */}
        <QuestionNavigator
          questions={questions}
          currentQuestionIndex={currentQuestionIndex}
          answers={currentAnswers}
          onQuestionChange={handleQuestionChange}
        />

        {/* 現在の質問 */}
        {currentQuestion && !isGenerated && autoSave && (
          <div className="mb-6">
            <AnswerEditor
              question={currentQuestion}
              answer={currentAnswer}
              onAnswerChange={handleAnswerChange}
              autoSaveStatus={autoSave.status}
              autoSaveError={autoSave.errorMessage}
              isGenerating={isGenerating} // Phase 2-3: 生成中フラグ
            />
          </div>
        )}

        {/* ナビゲーション・アクションボタン */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <button
              onClick={() => handleQuestionChange(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0 || isGenerated || isGenerating}
              className="px-4 py-2 border border-[var(--input-border)] rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--aio-surface)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前の質問
            </button>
            <button
              onClick={() => handleQuestionChange(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              disabled={currentQuestionIndex === questions.length - 1 || isGenerated || isGenerating}
              className="px-4 py-2 border border-[var(--input-border)] rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--aio-surface)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次の質問
            </button>
          </div>

          <div className="flex space-x-4">
            {!isGenerated && (
              <DashboardButton
                onClick={handleFinalize}
                disabled={isGenerating || answeredCount === 0}
                variant="primary"
                className="min-w-[200px] relative"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    AIが生成中...
                  </div>
                ) : (
                  `AIにまとめてもらう (${answeredCount}問回答済み)`
                )}
              </DashboardButton>
            )}
            {isGenerated && (
              <Link
                href="/dashboard/interview"
                className="px-6 py-2 bg-[var(--aio-primary)] text-white rounded-md hover:opacity-90"
              >
                新しいインタビューを開始
              </Link>
            )}
          </div>
        </div>

        {/* EPIC 2-2: 競合ダイアログ */}
        {conflictInfo && (
          <ConflictDialog
            isOpen={autoSave.status === 'conflict'}
            onResolve={handleConflictResolve}
            conflictInfo={conflictInfo}
          />
        )}
      </main>
    </div>
  );
}