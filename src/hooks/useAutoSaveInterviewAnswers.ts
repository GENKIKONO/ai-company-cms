import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/utils/logger';
import type { SaveAnswersResponse } from '@/types/interview-session';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

export interface UseAutoSaveInterviewAnswersOptions {
  sessionId: string;
  initialAnswers: Record<string, unknown>;
  initialVersion: number;
  debounceMs?: number; // デフォルト 1500ms
}

export interface UseAutoSaveInterviewAnswersResult {
  answers: Record<string, unknown>;
  setAnswer: (questionId: string, value: unknown) => void;
  status: AutoSaveStatus;
  errorMessage?: string;
  conflictLatest?: {
    version: number;
    updatedAt: string;
    answers: Record<string, unknown>;
  };
  // 手動での競合解決用
  resolveConflict: (useLatest: boolean) => void;
}

export function useAutoSaveInterviewAnswers(
  options: UseAutoSaveInterviewAnswersOptions
): UseAutoSaveInterviewAnswersResult {
  const { sessionId, initialAnswers, initialVersion, debounceMs = 1500 } = options;

  // 状態管理
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers);
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [conflictLatest, setConflictLatest] = useState<{
    version: number;
    updatedAt: string;
    answers: Record<string, unknown>;
  } | undefined>();

  // サーバーから返ってきたversionを保持
  const [serverVersion, setServerVersion] = useState<number>(initialVersion);

  // タイマー管理用のref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  // 保存実行関数
  const performSave = useCallback(async (answersToSave: Record<string, unknown>, currentVersion: number) => {
    if (isSavingRef.current) {
      logger.warn('Save already in progress, skipping');
      return;
    }

    try {
      isSavingRef.current = true;
      setStatus('saving');
      setErrorMessage(undefined);

      const response = await fetch(`/api/my/interview/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: answersToSave,
          clientVersion: currentVersion,
        }),
      });

      const data: SaveAnswersResponse = await response.json();

      if (response.ok && 'ok' in data && data.ok) {
        // 保存成功
        setServerVersion(data.newVersion);
        setStatus('saved');
        setConflictLatest(undefined);
        
        logger.info('Auto-save successful:', {
          sessionId,
          oldVersion: currentVersion,
          newVersion: data.newVersion
        });

        // 2秒後に状態をidleに戻す
        setTimeout(() => {
          setStatus('idle');
        }, 2000);

      } else if (response.status === 409 && 'conflict' in data) {
        // 競合発生
        setStatus('conflict');
        setConflictLatest({
          version: data.latest.version,
          updatedAt: data.latest.updated_at,
          answers: data.latest.answers,
        });

        logger.warn('Auto-save conflict detected:', {
          sessionId,
          clientVersion: currentVersion,
          serverVersion: data.latest.version
        });

        // TODO: 将来的に、差分マージ or ユーザー選択のUIを入れる
        // 現時点では警告表示のみで、ユーザーに選択を委ねる

      } else {
        // その他のエラー
        const message = 'message' in data ? data.message : `HTTP ${response.status}`;
        setStatus('error');
        setErrorMessage(message);
        
        logger.error('Auto-save failed:', {
          sessionId,
          status: response.status,
          message
        });
      }

    } catch (error) {
      setStatus('error');
      setErrorMessage('Network error or unexpected failure');
      
      logger.error('Auto-save network error:', { 
        sessionId, 
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      isSavingRef.current = false;
    }
  }, [sessionId]);

  // debounced保存のスケジューリング
  const scheduleSave = useCallback(() => {
    // 既存のタイマーをクリア
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 新しいタイマーをセット
    saveTimeoutRef.current = setTimeout(() => {
      if (!isSavingRef.current && status !== 'conflict') {
        performSave(answers, serverVersion);
      }
    }, debounceMs);
  }, [answers, serverVersion, debounceMs, performSave, status]);

  // answers変更時の自動保存
  useEffect(() => {
    // 初期状態では保存しない
    if (JSON.stringify(answers) === JSON.stringify(initialAnswers)) {
      return;
    }

    // 競合状態の場合は自動保存しない
    if (status === 'conflict') {
      return;
    }

    scheduleSave();

    // クリーンアップ
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [answers, status, scheduleSave, initialAnswers]);

  // コンポーネントunmount時のクリーンアップ
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // 回答更新関数
  const setAnswer = useCallback((questionId: string, value: unknown) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  }, []);

  // 競合解決関数
  const resolveConflict = useCallback((useLatest: boolean) => {
    if (!conflictLatest) {
      return;
    }

    if (useLatest) {
      // 最新データで上書き
      setAnswers(conflictLatest.answers);
      setServerVersion(conflictLatest.version);
    } else {
      // 現在のデータを保持して、サーバーバージョンだけ更新
      setServerVersion(conflictLatest.version);
    }

    // 競合状態をクリア
    setConflictLatest(undefined);
    setStatus('idle');

    logger.info('Conflict resolved:', {
      sessionId,
      useLatest,
      newVersion: conflictLatest.version
    });
  }, [conflictLatest, sessionId]);

  return {
    answers,
    setAnswer,
    status,
    errorMessage,
    conflictLatest,
    resolveConflict,
  };
}

// デバッグ用のヘルパー関数（開発時のみ使用）
export function logAutoSaveState(result: UseAutoSaveInterviewAnswersResult) {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('AutoSave State:', {
      status: result.status,
      errorMessage: result.errorMessage,
      hasConflict: !!result.conflictLatest,
      answersCount: Object.keys(result.answers).length,
    });
  }
}