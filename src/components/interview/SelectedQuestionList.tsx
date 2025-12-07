/**
 * P2-4: SelectedQuestionList - 選択済み質問一覧（右ペイン）
 * 選択済み質問の表示、削除、並び替え機能
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { SelectedQuestionListProps, InterviewQuestionItem } from '@/types/interview'

interface SelectedQuestionItemProps {
  question: InterviewQuestionItem
  index: number
  onRemove: (questionId: string) => void
  onReorder?: (fromIndex: number, toIndex: number) => void
  canMoveUp: boolean
  canMoveDown: boolean
}

function SelectedQuestionItem({ 
  question, 
  index, 
  onRemove, 
  onReorder,
  canMoveUp,
  canMoveDown
}: SelectedQuestionItemProps) {
  const handleMoveUp = () => {
    if (onReorder && canMoveUp) {
      onReorder(index, index - 1);
    }
  };

  const handleMoveDown = () => {
    if (onReorder && canMoveDown) {
      onReorder(index, index + 1);
    }
  };

  const hasKeywordMatch = question.matchCount > 0;

  return (
    <Card className="transition-all hover:border-[var(--color-primary-alpha-30)]">
      <CardContent className="p-[var(--space-md)]">
        <div className="space-y-3">
          {/* ヘッダー行：順序 + アクション */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="hig-text-caption text-[var(--color-text-secondary)] font-mono">
                #{index + 1}
              </span>
              {hasKeywordMatch && (
                <Badge variant="default" className="text-xs">
                  マッチ {question.matchCount}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {/* 並び替えボタン */}
              {onReorder && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMoveUp}
                    disabled={!canMoveUp}
                    className="h-6 w-6 p-0"
                    title="上に移動"
                  >
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMoveDown}
                    disabled={!canMoveDown}
                    className="h-6 w-6 p-0"
                    title="下に移動"
                  >
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Button>
                </div>
              )}
              
              {/* 削除ボタン */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(question.id)}
                className="h-6 w-6 p-0 text-[var(--color-danger)] hover:bg-[var(--color-danger-alpha-10)]"
                title="削除"
              >
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Button>
            </div>
          </div>

          {/* 質問テキスト */}
          <p className="hig-text-body hig-jp-body leading-relaxed text-sm">
            {question.questionText}
          </p>

          {/* メタ情報 */}
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="text-xs">
              {question.contentType}
            </Badge>
            {question.keywords.length > 0 && (
              <span className="text-[var(--color-text-secondary)]">
                {question.keywords.length} キーワード
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SelectedQuestionList({
  questions,
  onRemove,
  onReorder,
  isLoading = false
}: SelectedQuestionListProps) {

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const totalMatchingQuestions = questions.filter(q => q.matchCount > 0).length;

  return (
    <div className="w-full space-y-4">
      {/* ヘッダー */}
      <div className="hig-space-stack-sm">
        <h3 className="hig-text-h3 hig-jp-heading">選択済み質問</h3>
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <span>{questions.length} 質問</span>
          {totalMatchingQuestions > 0 && (
            <>
              <span>•</span>
              <span className="text-[var(--color-primary)] font-medium">
                {totalMatchingQuestions} 関連質問
              </span>
            </>
          )}
        </div>
      </div>

      {/* 質問一覧 */}
      <div className="space-y-3">
        {questions.length > 0 ? (
          questions.map((question, index) => (
            <SelectedQuestionItem
              key={question.id}
              question={question}
              index={index}
              onRemove={onRemove}
              onReorder={onReorder}
              canMoveUp={index > 0}
              canMoveDown={index < questions.length - 1}
            />
          ))
        ) : (
          <Card>
            <CardContent className="p-[var(--space-lg)] text-center">
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto text-[var(--color-text-tertiary)]">
                  <svg fill="currentColor" viewBox="0 0 48 48">
                    <path d="M12 8c-2.2 0-4 1.8-4 4v24c0 2.2 1.8 4 4 4h24c2.2 0 4-1.8 4-4V12c0-2.2-1.8-4-4-4H12zm0 2h24c1.1 0 2 .9 2 2v24c0 1.1-.9 2-2 2H12c-1.1 0-2-.9-2-2V12c0-1.1.9-2 2-2zm10 4c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3zm0 2c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm-8 10v2h16v-2H14zm0 4v2h12v-2H14z"/>
                  </svg>
                </div>
                <div>
                  <p className="hig-text-body text-[var(--color-text-secondary)]">
                    質問が選択されていません
                  </p>
                  <p className="hig-text-caption text-[var(--color-text-tertiary)] mt-1">
                    左の軸から質問を選んでインタビューセットを作成しましょう
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* アクションエリア */}
      {questions.length > 0 && (
        <Card className="border-[var(--color-primary-alpha-30)] bg-[var(--color-primary-alpha-5)]">
          <CardContent className="p-[var(--space-md)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="hig-text-caption text-[var(--color-text-primary)] hig-jp-body">
                  {questions.length} 質問を選択中
                </p>
                {totalMatchingQuestions > 0 && (
                  <p className="hig-text-caption text-[var(--color-text-secondary)] mt-1">
                    うち {totalMatchingQuestions} 件が組織に関連する質問です
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    questions.forEach(q => onRemove(q.id));
                  }}
                  disabled={questions.length === 0}
                >
                  すべて削除
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}