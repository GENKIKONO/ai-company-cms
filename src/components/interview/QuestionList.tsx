/**
 * P2-4: QuestionList - 質問一覧（中央ペイン）
 * 選択中の軸に属する質問一覧とチェックボックス選択
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Checkbox } from '@/components/ui/checkbox'
import type { QuestionListProps, InterviewQuestionItem } from '@/types/interview'

interface QuestionItemProps {
  question: InterviewQuestionItem
  isSelected: boolean
  onToggleSelect: (questionId: string) => void
}

function QuestionItem({ question, isSelected, onToggleSelect }: QuestionItemProps) {
  const hasKeywordMatch = question.matchCount > 0;

  return (
    <Card className={cn(
      "transition-all hover:border-[var(--color-primary-alpha-30)]",
      isSelected && "border-[var(--color-primary)] bg-[var(--color-primary-alpha-5)]"
    )}>
      <CardContent className="p-[var(--space-md)]">
        <div className="flex items-start gap-3">
          {/* 選択チェックボックス */}
          <div className="pt-1">
            <Checkbox
              id={`question-${question.id}`}
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(question.id)}
            />
          </div>

          {/* 質問内容 */}
          <div className="flex-1 min-w-0">
            <label 
              htmlFor={`question-${question.id}`}
              className="block cursor-pointer"
            >
              <div className="space-y-2">
                {/* 質問テキスト */}
                <p className="hig-text-body hig-jp-body leading-relaxed">
                  {question.questionText}
                </p>

                {/* メタ情報 */}
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="text-xs">
                    {question.contentType}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {question.lang.toUpperCase()}
                  </Badge>
                  {hasKeywordMatch && (
                    <Badge variant="default" className="text-xs bg-[var(--color-primary)]">
                      キーワード {question.matchCount} 一致
                    </Badge>
                  )}
                </div>

                {/* キーワード表示 */}
                {question.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {question.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className={cn(
                          "px-2 py-1 text-xs rounded-md border",
                          hasKeywordMatch && question.keywords.includes(keyword)
                            ? "bg-[var(--color-primary-alpha-10)] border-[var(--color-primary)] text-[var(--color-primary)]"
                            : "bg-[var(--color-background-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)]"
                        )}
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* 関連度インジケータ */}
          {hasKeywordMatch && (
            <div className="pt-1">
              <div className="w-3 h-3 bg-[var(--color-primary)] rounded-full"></div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function QuestionList({
  axis,
  selectedQuestionIds,
  onToggleSelect,
  isLoading = false
}: QuestionListProps) {

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // 軸が選択されていない場合は全質問を表示
  const questions = axis?.questions || [];
  const axisTitle = axis ? (axis.labelJa || axis.labelEn || axis.axisCode) : 'すべての軸';
  const matchingQuestions = questions.filter(q => q.matchCount > 0);

  // 質問をソート：マッチ数 DESC → ソート順 ASC
  const sortedQuestions = [...questions].sort((a, b) => {
    if (a.matchCount !== b.matchCount) {
      return b.matchCount - a.matchCount;
    }
    return a.sortOrder - b.sortOrder;
  });

  return (
    <div className="w-full space-y-4">
      {/* ヘッダー */}
      <div className="hig-space-stack-sm">
        <h3 className="hig-text-h3 hig-jp-heading">{axisTitle}</h3>
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <span>{questions.length} 質問</span>
          {matchingQuestions.length > 0 && (
            <>
              <span>•</span>
              <span className="text-[var(--color-primary)] font-medium">
                {matchingQuestions.length} 関連質問
              </span>
            </>
          )}
          {selectedQuestionIds.length > 0 && (
            <>
              <span>•</span>
              <span className="font-medium">
                {selectedQuestionIds.filter(id => questions.some(q => q.id === id)).length} 選択済み
              </span>
            </>
          )}
        </div>
        
        {axis?.descriptionJa && (
          <p className="hig-text-caption text-[var(--color-text-secondary)] hig-jp-body">
            {axis.descriptionJa}
          </p>
        )}
      </div>

      {/* 質問一覧 */}
      <div className="space-y-3">
        {sortedQuestions.length > 0 ? (
          sortedQuestions.map((question) => (
            <QuestionItem
              key={question.id}
              question={question}
              isSelected={selectedQuestionIds.includes(question.id)}
              onToggleSelect={onToggleSelect}
            />
          ))
        ) : (
          <Card>
            <CardContent className="p-[var(--space-lg)] text-center">
              <div className="space-y-2">
                <p className="hig-text-body text-[var(--color-text-secondary)]">
                  質問が見つかりません
                </p>
                <p className="hig-text-caption text-[var(--color-text-tertiary)]">
                  {axis ? '他の軸を選択してください' : '条件を変更して再度お試しください'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 関連質問がある場合のヒント */}
      {matchingQuestions.length > 0 && (
        <Card className="border-[var(--color-primary-alpha-30)] bg-[var(--color-primary-alpha-5)]">
          <CardContent className="p-[var(--space-md)]">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 text-[var(--color-primary)]">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="hig-text-caption text-[var(--color-text-primary)] hig-jp-body">
                  組織キーワードに関連する質問が {matchingQuestions.length} 件見つかりました。
                  上部に優先表示されています。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}