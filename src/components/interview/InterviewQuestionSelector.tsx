/**
 * P2-4: InterviewQuestionSelector - インタビュー質問選択のメインコンポーネント
 * 3ペインレイアウト（軸・質問・選択済み）とデータ管理
 */

'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AxisSidebar } from './AxisSidebar'
import { QuestionList } from './QuestionList'
import { SelectedQuestionList } from './SelectedQuestionList'
import { useInterviewQuestions } from '@/hooks/useInterviewQuestions'
import type {
  InterviewQuestionSelectorProps,
  AxisGroup,
  InterviewQuestionItem,
  InterviewQuestionSelectorState
} from '@/types/interview'

export function InterviewQuestionSelector({
  contentType,
  lang,
  orgId,
  initialSelectedIds = [],
  onSelectionChange
}: InterviewQuestionSelectorProps) {
  
  // API データ取得
  const { data, isLoading, error, refetch } = useInterviewQuestions({
    contentType,
    lang,
    orgId,
    enabled: true
  });

  // 内部状態管理
  const [state, setState] = useState<InterviewQuestionSelectorState>({
    selectedQuestionIds: initialSelectedIds,
    activeAxisId: null,
    isLoading: false,
    error: null
  });

  // 選択中の軸情報を計算
  const activeAxis = useMemo(() => {
    if (!data || !state.activeAxisId) return null;
    return data.axes.find(axis => axis.axisId === state.activeAxisId) || null;
  }, [data, state.activeAxisId]);

  // 表示用の質問一覧を計算（軸選択時はその軸の質問、未選択時は全質問）
  const displayQuestions = useMemo(() => {
    if (!data) return [];
    
    if (state.activeAxisId) {
      // 特定の軸が選択されている場合
      return activeAxis?.questions || [];
    } else {
      // 全軸表示の場合
      return data.axes.flatMap(axis => axis.questions);
    }
  }, [data, state.activeAxisId, activeAxis]);

  // 選択済み質問の詳細情報を計算
  const selectedQuestions = useMemo(() => {
    if (!data || state.selectedQuestionIds.length === 0) return [];
    
    const allQuestions = data.axes.flatMap(axis => axis.questions);
    return state.selectedQuestionIds
      .map(id => allQuestions.find(q => q.id === id))
      .filter(Boolean) as InterviewQuestionItem[];
  }, [data, state.selectedQuestionIds]);

  // 軸選択ハンドラ
  const handleSelectAxis = useCallback((axisId: string | null) => {
    setState(prev => ({
      ...prev,
      activeAxisId: axisId
    }));
  }, []);

  // 質問選択切り替えハンドラ
  const handleToggleSelect = useCallback((questionId: string) => {
    setState(prev => {
      const newSelectedIds = prev.selectedQuestionIds.includes(questionId)
        ? prev.selectedQuestionIds.filter(id => id !== questionId)
        : [...prev.selectedQuestionIds, questionId];
      
      return {
        ...prev,
        selectedQuestionIds: newSelectedIds
      };
    });
  }, []);

  // 選択済み質問削除ハンドラ
  const handleRemoveSelected = useCallback((questionId: string) => {
    setState(prev => ({
      ...prev,
      selectedQuestionIds: prev.selectedQuestionIds.filter(id => id !== questionId)
    }));
  }, []);

  // 選択済み質問並び替えハンドラ
  const handleReorderSelected = useCallback((fromIndex: number, toIndex: number) => {
    setState(prev => {
      const newIds = [...prev.selectedQuestionIds];
      const [movedId] = newIds.splice(fromIndex, 1);
      newIds.splice(toIndex, 0, movedId);
      
      return {
        ...prev,
        selectedQuestionIds: newIds
      };
    });
  }, []);

  // 選択状態の変更を親コンポーネントに通知
  useEffect(() => {
    onSelectionChange?.(state.selectedQuestionIds);
  }, [state.selectedQuestionIds, onSelectionChange]);

  // エラー状態の表示
  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-[var(--space-lg)]">
          <Alert variant="destructive">
            <AlertDescription>
              質問データの読み込みに失敗しました: {error}
              <button 
                onClick={refetch}
                className="ml-2 underline hover:no-underline"
              >
                再試行
              </button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // ローディング状態の表示
  if (isLoading && !data) {
    return (
      <Card className="w-full">
        <CardContent className="p-[var(--space-lg)]">
          <div className="flex items-center justify-center space-x-4">
            <LoadingSpinner />
            <span className="hig-text-body text-[var(--color-text-secondary)]">
              質問データを読み込んでいます...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* ヘッダー情報 */}
      <div className="hig-space-stack-sm">
        <h2 className="hig-text-h2 hig-jp-heading">インタビュー質問選択</h2>
        <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
          <span>コンテンツタイプ: <strong>{contentType}</strong></span>
          <span>言語: <strong>{lang.toUpperCase()}</strong></span>
          {data && (
            <>
              <span>•</span>
              <span>軸数: <strong>{data.axes.length}</strong></span>
              <span>•</span>
              <span>質問数: <strong>{data.totalCount}</strong></span>
              <span>•</span>
              <span>関連質問: <strong>{data.axes.flatMap(a => a.questions).filter(q => q.matchCount > 0).length}</strong></span>
            </>
          )}
        </div>
      </div>

      {/* 3ペインレイアウト */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左ペイン: 軸リスト */}
        <div className="lg:col-span-3">
          <AxisSidebar
            axes={data?.axes || []}
            activeAxisId={state.activeAxisId}
            onSelectAxis={handleSelectAxis}
            isLoading={isLoading}
          />
        </div>

        {/* 中央ペイン: 質問一覧 */}
        <div className="lg:col-span-5">
          <QuestionList
            axis={state.activeAxisId ? activeAxis : {
              axisId: 'all',
              axisCode: 'all',
              labelJa: 'すべての軸',
              labelEn: 'All Axes',
              descriptionJa: null,
              descriptionEn: null,
              sortOrder: 0,
              questions: displayQuestions
            }}
            selectedQuestionIds={state.selectedQuestionIds}
            onToggleSelect={handleToggleSelect}
            isLoading={isLoading}
          />
        </div>

        {/* 右ペイン: 選択済み質問 */}
        <div className="lg:col-span-4">
          <SelectedQuestionList
            questions={selectedQuestions}
            onRemove={handleRemoveSelected}
            onReorder={handleReorderSelected}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* モバイル用のタブ表示（余裕があれば実装） */}
      <div className="lg:hidden">
        {/* TODO: モバイル用のタブレイアウトを実装 */}
      </div>

      {/* デバッグ情報（開発時のみ表示） */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed border-[var(--color-text-tertiary)]">
          <CardContent className="p-[var(--space-sm)] text-xs">
            <details>
              <summary className="cursor-pointer text-[var(--color-text-secondary)]">
                Debug Info
              </summary>
              <div className="mt-2 space-y-1 text-[var(--color-text-tertiary)]">
                <div>Selected IDs: {JSON.stringify(state.selectedQuestionIds)}</div>
                <div>Active Axis: {state.activeAxisId || 'null'}</div>
                <div>Display Questions: {displayQuestions.length}</div>
                <div>Selected Questions: {selectedQuestions.length}</div>
                <div>API Loading: {isLoading.toString()}</div>
                <div>API Error: {error || 'null'}</div>
              </div>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}