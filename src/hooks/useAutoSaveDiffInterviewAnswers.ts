import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/utils/logger';
import type { SaveAnswerDiffResponse } from '@/types/interview-session';

export type DiffAutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

export interface UseAutoSaveDiffInterviewAnswersOptions {
  sessionId: string;
  initialAnswers: Record<string, unknown>;
  initialUpdatedAt: string;
  debounceMs?: number; // デフォルト 1000ms（差分保存は高速なのでより短く）
}

export interface UseAutoSaveDiffInterviewAnswersResult {
  answers: Record<string, unknown>;
  setAnswer: (questionId: string, value: unknown) => void;
  status: DiffAutoSaveStatus;
  errorMessage?: string;
  conflictLatest?: {
    id: string;
    version: number;
    updated_at: string;
    answers: Record<string, unknown>;
  };
  // 手動での競合解決用
  resolveConflict: (useLatest: boolean) => void;
  // 現在の更新日時取得（デバッグ用）
  currentUpdatedAt: string;
}

/**
 * EPIC 2-2: 差分保存 & 楽観ロック対応のインタビュー回答自動保存フック
 * 
 * 【楽観ロックの理由】
 * - 「後から保存した方が必ず勝つ」ではなく、「最新状態を持っているクライアントだけが保存できる」ルール
 * - 複数タブや複数ユーザーでの同時編集競合を検知
 * 
 * 【差分保存の利点】
 * - ネットワーク通信量の削減
 * - 保存速度の向上
 * - 特定質問の編集競合をピンポイントで検知
 * 
 * 【競合時の挙動】
 * - 409 Conflict 時は UI でダイアログ表示: 「他の画面で更新されました。再読み込みして最新の内容を確認してください」
 * - 自動マージは行わず、ユーザーに選択を委ねる
 */
export function useAutoSaveDiffInterviewAnswers(
  options: UseAutoSaveDiffInterviewAnswersOptions
): UseAutoSaveDiffInterviewAnswersResult {
  const { sessionId, initialAnswers, initialUpdatedAt, debounceMs = 1000 } = options;

  // 状態管理
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers);
  const [status, setStatus] = useState<DiffAutoSaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [conflictLatest, setConflictLatest] = useState<{
    id: string;
    version: number;
    updated_at: string;
    answers: Record<string, unknown>;
  } | undefined>();

  // サーバーから返ってきた最新の updated_at を保持
  const [currentUpdatedAt, setCurrentUpdatedAt] = useState<string>(initialUpdatedAt);

  // 保存待ちのキューと実行中フラグ
  const pendingChangesRef = useRef<Set<string>>(new Set());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  // 差分保存実行関数
  const performDiffSave = useCallback(async (questionId: string, newAnswer: unknown, previousUpdatedAt: string) => {
    try {
      logger.debug('Performing diff save:', { sessionId, questionId, previousUpdatedAt });

      const response = await fetch(`/api/my/interview/sessions/${sessionId}/answers/diff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          newAnswer: newAnswer === undefined ? null : newAnswer,
          previousUpdatedAt,
        }),
      });

      const data: SaveAnswerDiffResponse = await response.json();

      if (response.ok && 'ok' in data && data.ok) {
        // 保存成功
        setCurrentUpdatedAt(data.updatedAt);
        setStatus('saved');
        setConflictLatest(undefined);
        
        logger.info('Diff save successful:', {
          sessionId,
          questionId,
          newUpdatedAt: data.updatedAt,
          newVersion: data.version
        });

        // 1秒後に状態をidleに戻す（差分保存は高速なので短く）
        setTimeout(() => {
          setStatus(prev => prev === 'saved' ? 'idle' : prev);
        }, 1000);

        return true;

      } else if (response.status === 409 && 'success' in data && data.success === false && data.code === 'conflict') {
        // 競合発生
        setStatus('conflict');
        // Type guard: conflict responseの場合のみlatest プロパティが存在
        if ('latest' in data) {
          setConflictLatest(data.latest);
        }

        logger.warn('Diff save conflict detected:', {
          sessionId,
          questionId,
          clientUpdatedAt: previousUpdatedAt,
          serverUpdatedAt: 'latest' in data ? data.latest.updated_at : 'unknown'
        });

        return false;

      } else {
        // その他のエラー
        const message = 'message' in data ? data.message : `HTTP ${response.status}`;
        setStatus('error');
        setErrorMessage(message);
        
        logger.error('Diff save failed:', {
          sessionId,
          questionId,
          status: response.status,
          message
        });

        return false;
      }

    } catch (error) {
      setStatus('error');
      setErrorMessage('Network error or unexpected failure');
      
      logger.error('Diff save network error:', { 
        sessionId, 
        questionId,
        error: error instanceof Error ? error.message : String(error)
      });

      return false;
    }
  }, [sessionId]);

  // 保存キューの処理
  const processSaveQueue = useCallback(async () => {
    if (isSavingRef.current || pendingChangesRef.current.size === 0 || status === 'conflict') {
      return;
    }

    isSavingRef.current = true;
    setStatus('saving');
    setErrorMessage(undefined);

    // キューから1つずつ処理（順次実行で競合を最小化）
    const pendingQuestionIds = Array.from(pendingChangesRef.current);
    pendingChangesRef.current.clear();

    for (const questionId of pendingQuestionIds) {
      const success = await performDiffSave(questionId, answers[questionId], currentUpdatedAt);
      
      if (!success) {
        // 失敗した場合は残りの保存をスキップ
        break;
      }
    }

    isSavingRef.current = false;
  }, [answers, currentUpdatedAt, performDiffSave, status]);

  // debounced保存のスケジューリング
  const scheduleSave = useCallback((questionId: string) => {
    // 変更をキューに追加
    pendingChangesRef.current.add(questionId);

    // 既存のタイマーをクリア
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 新しいタイマーをセット
    saveTimeoutRef.current = setTimeout(() => {
      if (!isSavingRef.current && status !== 'conflict') {
        processSaveQueue();
      }
    }, debounceMs);
  }, [debounceMs, processSaveQueue, status]);

  // 回答更新関数
  const setAnswer = useCallback((questionId: string, value: unknown) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      
      if (value === undefined || value === null || value === '') {
        // 空の場合は削除
        delete newAnswers[questionId];
      } else {
        // 値を設定
        newAnswers[questionId] = value;
      }

      return newAnswers;
    });

    // 競合状態でない場合のみ保存をスケジュール
    if (status !== 'conflict') {
      scheduleSave(questionId);
    }
  }, [status, scheduleSave]);

  // コンポーネントunmount時のクリーンアップ
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // 競合解決関数
  const resolveConflict = useCallback((useLatest: boolean) => {
    if (!conflictLatest) {
      return;
    }

    if (useLatest) {
      // 最新データで上書き
      setAnswers(conflictLatest.answers);
      setCurrentUpdatedAt(conflictLatest.updated_at);
      
      logger.info('Conflict resolved with latest data:', {
        sessionId,
        newVersion: conflictLatest.version,
        newUpdatedAt: conflictLatest.updated_at
      });
    } else {
      // 現在のデータを保持して、メタデータだけ更新
      setCurrentUpdatedAt(conflictLatest.updated_at);
      
      logger.info('Conflict resolved with current data:', {
        sessionId,
        newVersion: conflictLatest.version,
        newUpdatedAt: conflictLatest.updated_at
      });
    }

    // 競合状態をクリア
    setConflictLatest(undefined);
    setStatus('idle');
    
    // 保留中の変更をクリア
    pendingChangesRef.current.clear();
  }, [conflictLatest, sessionId]);

  return {
    answers,
    setAnswer,
    status,
    errorMessage,
    conflictLatest,
    resolveConflict,
    currentUpdatedAt,
  };
}

// デバッグ用のヘルパー関数（開発時のみ使用）
export function logDiffAutoSaveState(result: UseAutoSaveDiffInterviewAnswersResult) {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('DiffAutoSave State:', {
      status: result.status,
      errorMessage: result.errorMessage,
      hasConflict: !!result.conflictLatest,
      answersCount: Object.keys(result.answers).length,
      currentUpdatedAt: result.currentUpdatedAt,
    });
  }
}