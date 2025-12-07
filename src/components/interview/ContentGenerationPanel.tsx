/**
 * P2-8: AIインタビューからのコンテンツ生成パネル
 * セッション完了後にブログ・Q&A・ケーススタディを生成
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HIGButton } from '@/design-system';
import { logger } from '@/lib/utils/logger';
import type {
  ContentGenerationType,
  ContentGenerationState,
  GenerateContentApiResponse,
  GenerateContentError
} from '@/types/interview-generated';
import { CONTENT_TYPE_METADATA } from '@/types/interview-generated';

interface Props {
  sessionId: string;
  sessionStatus: 'draft' | 'in_progress' | 'completed';
  className?: string;
}

/**
 * 生成タイプアイコン
 */
function getGenerationTypeIcon(type: ContentGenerationType): string {
  return CONTENT_TYPE_METADATA[type].icon;
}

/**
 * 生成ボタンコンポーネント
 */
function GenerationButton({ 
  type, 
  isGenerating, 
  generatingType, 
  onClick, 
  disabled 
}: {
  type: ContentGenerationType;
  isGenerating: boolean;
  generatingType: ContentGenerationType | null;
  onClick: (type: ContentGenerationType) => void;
  disabled: boolean;
}) {
  const metadata = CONTENT_TYPE_METADATA[type];
  const isThisGenerating = isGenerating && generatingType === type;

  return (
    <Card className={`cursor-pointer transition-all duration-200 hover:shadow-md ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="text-3xl">{metadata.icon}</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{metadata.label}</h3>
            <p className="text-sm text-gray-600 mt-1">{metadata.description}</p>
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <span>推定トークン: {metadata.estimatedTokens}</span>
            </div>
          </div>
          <div className="flex-shrink-0">
            {isThisGenerating ? (
              <div className="flex items-center space-x-2 text-blue-600">
                <LoadingSpinner className="w-4 h-4" />
                <span className="text-sm">生成中...</span>
              </div>
            ) : (
              <Button
                onClick={() => onClick(type)}
                disabled={disabled}
                variant="outline"
                size="sm"
              >
                生成
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 生成成功通知
 */
function GenerationSuccessAlert({ 
  type, 
  contentId, 
  onNavigate 
}: { 
  type: ContentGenerationType; 
  contentId: string; 
  onNavigate: () => void;
}) {
  const metadata = CONTENT_TYPE_METADATA[type];

  return (
    <Alert className="border-green-200 bg-green-50">
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-lg">{metadata.icon}</span>
            <div>
              <p className="font-medium text-green-800">
                {metadata.label}の下書きが生成されました
              </p>
              <p className="text-sm text-green-700">
                CMSダッシュボードで編集・公開できます
              </p>
            </div>
          </div>
          <Button 
            onClick={onNavigate}
            variant="outline"
            size="sm"
            className="border-green-300 text-green-700 hover:bg-green-100"
          >
            編集画面へ
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * 生成エラー通知
 */
function GenerationErrorAlert({ 
  error, 
  onRetry, 
  onDismiss 
}: { 
  error: GenerateContentError; 
  onRetry: () => void; 
  onDismiss: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertDescription>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium">コンテンツ生成に失敗しました</p>
            <p className="text-sm mt-1">{error.message}</p>
            {error.code && (
              <p className="text-xs mt-1 opacity-75">エラーコード: {error.code}</p>
            )}
          </div>
          <div className="flex space-x-2 ml-4">
            <Button onClick={onRetry} size="sm" variant="outline">
              再試行
            </Button>
            <Button onClick={onDismiss} size="sm" variant="ghost">
              閉じる
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export default function ContentGenerationPanel({ sessionId, sessionStatus, className = '' }: Props) {
  const router = useRouter();
  const [generationState, setGenerationState] = useState<ContentGenerationState>({
    isGenerating: false,
    selectedType: null,
    currentJobId: null,
    error: null,
    generatedContent: null
  });

  // セッションが完了していない場合は表示しない
  if (sessionStatus !== 'completed') {
    return null;
  }

  // コンテンツ生成API呼び出し
  const handleGenerate = async (type: ContentGenerationType) => {
    setGenerationState({
      isGenerating: true,
      selectedType: type,
      currentJobId: null,
      error: null,
      generatedContent: null
    });

    try {
      const response = await fetch(`/api/my/interview/${sessionId}/generate-${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result: GenerateContentApiResponse = await response.json();

      if (!result.success) {
        setGenerationState(prev => ({
          ...prev,
          isGenerating: false,
          error: (result as GenerateContentError).message,
          selectedType: null
        }));
        return;
      }

      // 生成成功
      setGenerationState({
        isGenerating: false,
        selectedType: null,
        currentJobId: result.data.job.id,
        error: null,
        generatedContent: result.data.content
      });

      logger.info('Content generation completed successfully', {
        type,
        sessionId,
        contentId: result.data.content.id,
        jobId: result.data.job.id,
        cost: result.data.job.cost_usd
      });

    } catch (error: any) {
      logger.error('Content generation failed', {
        error: error.message,
        type,
        sessionId
      });

      setGenerationState({
        isGenerating: false,
        selectedType: null,
        currentJobId: null,
        error: 'ネットワークエラーが発生しました',
        generatedContent: null
      });
    }
  };

  // 生成されたコンテンツの編集画面に遷移
  const handleNavigateToEdit = () => {
    if (!generationState.generatedContent) return;

    const { tableName, id } = generationState.generatedContent;
    
    // テーブル名に基づいて適切な編集画面に遷移
    switch (tableName) {
      case 'posts':
        router.push(`/dashboard/posts/${id}/edit`);
        break;
      case 'qa_entries':
        router.push(`/dashboard/qa/${id}/edit`);
        break;
      case 'case_studies':
        router.push(`/dashboard/case-studies/${id}/edit`);
        break;
      default:
        // フォールバック：CMS統合ダッシュボードに遷移
        router.push(`/dashboard/admin/contents?filter=ai_generated`);
    }
  };

  // エラーリセット
  const handleRetry = () => {
    if (generationState.selectedType) {
      handleGenerate(generationState.selectedType);
    }
  };

  const handleDismissError = () => {
    setGenerationState(prev => ({
      ...prev,
      error: null,
      selectedType: null
    }));
  };

  const handleDismissSuccess = () => {
    setGenerationState(prev => ({
      ...prev,
      generatedContent: null,
      currentJobId: null
    }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h3 className="text-xl font-bold">コンテンツ生成</h3>
              <p className="text-sm font-normal text-gray-600 mt-1">
                このインタビューからブログ・Q&A・ケーススタディを自動生成
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* エラー通知 */}
          {generationState.error && (
            <GenerationErrorAlert
              error={{
                success: false,
                code: 'GENERATION_ERROR',
                message: generationState.error
              } as GenerateContentError}
              onRetry={handleRetry}
              onDismiss={handleDismissError}
            />
          )}

          {/* 生成成功通知 */}
          {generationState.generatedContent && (
            <div className="space-y-4">
              <GenerationSuccessAlert
                type={generationState.generatedContent.contentType}
                contentId={generationState.generatedContent.id}
                onNavigate={handleNavigateToEdit}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleDismissSuccess}
                  variant="ghost"
                  size="sm"
                >
                  通知を閉じる
                </Button>
              </div>
            </div>
          )}

          {/* 生成中の全体ローディング */}
          {generationState.isGenerating && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription>
                <div className="flex items-center space-x-3">
                  <LoadingSpinner className="w-5 h-5" />
                  <div>
                    <p className="font-medium text-blue-800">
                      {CONTENT_TYPE_METADATA[generationState.selectedType!].label}を生成中...
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      AIがインタビュー内容を分析してコンテンツを作成しています。しばらくお待ちください。
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 生成ボタン一覧 */}
          <div className="space-y-4">
            {(['blog', 'qna', 'case_study'] as ContentGenerationType[]).map((type) => (
              <GenerationButton
                key={type}
                type={type}
                isGenerating={generationState.isGenerating}
                generatingType={generationState.selectedType}
                onClick={handleGenerate}
                disabled={generationState.isGenerating}
              />
            ))}
          </div>

          {/* 使用上の注意 */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p className="font-medium mb-2">💡 ご利用上の注意</p>
            <ul className="space-y-1 text-xs">
              <li>• 生成されたコンテンツは「下書き」として保存されます</li>
              <li>• CMSダッシュボードで内容を確認・編集してから公開してください</li>
              <li>• 生成には OpenAI API を使用するため、少額の費用が発生します</li>
              <li>• 同じセッションから複数回生成すると、それぞれ異なるコンテンツが作成されます</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}