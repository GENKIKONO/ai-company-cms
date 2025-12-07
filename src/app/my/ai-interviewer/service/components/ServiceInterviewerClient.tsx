'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/utils/logger';
import type { GroupedByAxis, InterviewQuestion } from '@/lib/ai/interviewer-server';
import type { ServerUser } from '@/lib/auth/server';

interface ServiceInterviewerClientProps {
  questionGroups: GroupedByAxis[];
  user: ServerUser;
}

interface AnswerData {
  [questionId: string]: string;
}

export function ServiceInterviewerClient({ questionGroups, user }: ServiceInterviewerClientProps) {
  const [answers, setAnswers] = useState<AnswerData>({});
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // 回答の更新
  const updateAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // セクションの展開/折りたたみ
  const toggleSection = (axisCode: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(axisCode)) {
        newSet.delete(axisCode);
      } else {
        newSet.add(axisCode);
      }
      return newSet;
    });
  };

  // AI要約の実装
  const handleAISummary = async () => {
    try {
      setIsGenerating(true);
      setSummaryError(null);
      
      logger.info('AI Summary requested', {
        component: 'ServiceInterviewerClient',
        userId: user.id,
        totalAnswers: getTotalAnsweredCount()
      });

      // API呼び出し
      const response = await fetch('/api/my/ai-interviewer/service/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.errorMessage || `HTTP ${response.status}: AI要約の取得に失敗しました`);
      }

      if (result.ok && result.summaryText) {
        setAiSummary(result.summaryText);
        logger.info('AI Summary generated successfully', {
          component: 'ServiceInterviewerClient',
          userId: user.id,
          summaryLength: result.summaryText.length
        });
      } else {
        throw new Error(result.errorMessage || 'AI要約の取得に失敗しました');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'AI要約の取得中にエラーが発生しました';
      setSummaryError(errorMessage);
      logger.error('AI Summary generation failed', {
        component: 'ServiceInterviewerClient',
        userId: user.id,
        error: errorMessage
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 質問IDから質問オブジェクトを検索
  const findQuestionById = (questionId: string): InterviewQuestion | undefined => {
    for (const group of questionGroups) {
      const question = group.questions.find(q => q.id === questionId);
      if (question) return question;
    }
    return undefined;
  };

  // 入力済み回答数を計算
  const getTotalAnsweredCount = () => {
    return Object.values(answers).filter(value => value.trim()).length;
  };

  const getTotalQuestionCount = () => {
    return questionGroups.reduce((sum, group) => sum + group.questions.length, 0);
  };

  if (questionGroups.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">
            現在、サービス向けの質問が登録されていません。
            <br />
            管理者にお問い合わせください。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 進捗表示 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-500">回答済み</span>
              <div className="text-lg font-semibold">
                {getTotalAnsweredCount()} / {getTotalQuestionCount()} 問
              </div>
            </div>
            <Badge variant="outline">
              {Math.round((getTotalAnsweredCount() / getTotalQuestionCount()) * 100)}% 完了
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 質問セクション */}
      {questionGroups.map((group) => {
        const isCollapsed = collapsedSections.has(group.axisCode);
        const answeredInSection = group.questions.filter(q => answers[q.id]?.trim()).length;

        return (
          <Card key={group.axisCode}>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection(group.axisCode)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {group.axisLabel}
                  <Badge variant="outline" className="ml-2">
                    {answeredInSection}/{group.questions.length}
                  </Badge>
                </CardTitle>
                {isCollapsed ? (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </CardHeader>

            {!isCollapsed && (
              <CardContent className="space-y-4">
                {group.questions.map((question) => (
                  <div key={question.id} className="space-y-2">
                    <label 
                      htmlFor={question.id}
                      className="block text-sm font-medium text-gray-700"
                    >
                      {question.questionText}
                    </label>
                    <Textarea
                      id={question.id}
                      placeholder="ご回答をお聞かせください..."
                      value={answers[question.id] || ''}
                      onChange={(e) => updateAnswer(question.id, e.target.value)}
                      rows={3}
                      className="w-full"
                    />
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* AI要約ボタン */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">AI要約・生成</h3>
            <p className="text-sm text-gray-600">
              入力いただいた回答をもとに、AIがサービス紹介文やFAQの候補を生成します。
            </p>
            <Button
              onClick={handleAISummary}
              disabled={isGenerating || getTotalAnsweredCount() === 0}
              size="lg"
              className="w-full max-w-md"
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
                  AI処理中...
                </>
              ) : (
                `AI要約を実行する（${getTotalAnsweredCount()}件の回答）`
              )}
            </Button>
            {getTotalAnsweredCount() === 0 && (
              <p className="text-xs text-gray-500">
                ※ まずは質問にご回答ください
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI要約結果表示 */}
      {aiSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-green-700">
              ✨ AIからの下書き案
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-normal">
                {aiSummary}
              </pre>
            </div>
            <div className="text-xs text-gray-500">
              ※ この内容は参考用の下書きです。必要に応じて編集してご利用ください。
            </div>
          </CardContent>
        </Card>
      )}

      {/* エラー表示 */}
      {summaryError && (
        <Card>
          <CardContent className="p-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="text-red-500">⚠️</div>
                <div className="text-red-700 text-sm font-medium">
                  エラーが発生しました
                </div>
              </div>
              <p className="text-red-600 text-sm mt-2">
                {summaryError}
              </p>
              <Button
                onClick={() => setSummaryError(null)}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                閉じる
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}