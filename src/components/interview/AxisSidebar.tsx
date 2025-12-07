/**
 * P2-4: AxisSidebar - 質問軸リスト（左ペイン）
 * 軸ごとのグルーピング表示とフィルタリング機能
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { AxisSidebarProps } from '@/types/interview'

export function AxisSidebar({
  axes,
  activeAxisId,
  onSelectAxis,
  isLoading = false
}: AxisSidebarProps) {
  
  const handleAxisClick = (axisId: string) => {
    onSelectAxis(activeAxisId === axisId ? null : axisId);
  };

  const handleAllClick = () => {
    onSelectAxis(null);
  };

  const totalQuestions = axes.reduce((sum, axis) => sum + axis.questions.length, 0);
  const totalMatchingQuestions = axes.reduce((sum, axis) => 
    sum + axis.questions.filter(q => q.matchCount > 0).length, 0);

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* ヘッダー */}
      <div className="hig-space-stack-sm">
        <h3 className="hig-text-h3 hig-jp-heading">質問軸</h3>
        <p className="hig-text-caption text-[var(--color-text-secondary)] hig-jp-body">
          全 {axes.length} 軸 · {totalQuestions} 質問 · マッチ {totalMatchingQuestions} 件
        </p>
      </div>

      {/* 全て表示オプション */}
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:border-[var(--color-primary)]",
          activeAxisId === null && "border-[var(--color-primary)] bg-[var(--color-primary-alpha-10)]"
        )}
        onClick={handleAllClick}
      >
        <CardContent className="p-[var(--space-md)]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="hig-text-body-bold hig-jp-body">すべての軸</span>
              <span className="hig-text-caption text-[var(--color-text-secondary)]">
                全質問を表示
              </span>
            </div>
            <Badge variant="outline" className="ml-2">
              {totalQuestions}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 軸リスト */}
      <div className="space-y-2">
        {axes.map((axis) => {
          const isActive = activeAxisId === axis.axisId;
          const hasMatchingQuestions = axis.questions.some(q => q.matchCount > 0);
          
          return (
            <Card
              key={axis.axisId}
              className={cn(
                "cursor-pointer transition-all hover:border-[var(--color-primary)]",
                isActive && "border-[var(--color-primary)] bg-[var(--color-primary-alpha-10)]"
              )}
              onClick={() => handleAxisClick(axis.axisId)}
            >
              <CardContent className="p-[var(--space-md)]">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="hig-text-body-bold hig-jp-body">
                        {axis.labelJa || axis.labelEn || axis.axisCode}
                      </span>
                      {hasMatchingQuestions && (
                        <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full"></div>
                      )}
                    </div>
                    
                    <span className="hig-text-code text-[var(--color-text-secondary)] text-xs mb-2">
                      {axis.axisCode}
                    </span>
                    
                    {axis.descriptionJa && (
                      <p className="hig-text-caption text-[var(--color-text-secondary)] hig-jp-body line-clamp-2">
                        {axis.descriptionJa}
                      </p>
                    )}
                    
                    {/* マッチング情報 */}
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="text-[var(--color-text-secondary)]">
                        {axis.questions.length} 質問
                      </span>
                      {hasMatchingQuestions && (
                        <>
                          <span className="text-[var(--color-text-secondary)]">•</span>
                          <span className="text-[var(--color-primary)] font-medium">
                            {axis.questions.filter(q => q.matchCount > 0).length} マッチ
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 ml-2">
                    <Badge variant="outline">
                      {axis.questions.length}
                    </Badge>
                    {hasMatchingQuestions && (
                      <Badge variant="default" className="text-xs">
                        {axis.questions.filter(q => q.matchCount > 0).length}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 空状態 */}
      {axes.length === 0 && (
        <Card>
          <CardContent className="p-[var(--space-lg)] text-center">
            <div className="space-y-2">
              <p className="hig-text-body text-[var(--color-text-secondary)]">
                質問軸が見つかりません
              </p>
              <p className="hig-text-caption text-[var(--color-text-tertiary)]">
                条件を変更して再度お試しください
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}