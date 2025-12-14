'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  HIGCard,
  HIGCardHeader,
  HIGCardTitle,
  HIGCardContent,
  HIGCardGrid
} from '@/components/ui/HIGCard';
import { HIGButton } from '@/components/ui/HIGButton';
import { 
  MessageSquare, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  Building,
  Calendar,
  Eye,
  Filter,
  RefreshCw
} from 'lucide-react';
import type { QuestionWithDetails } from '@/types/domain/questions';;
import { translateQuestionStatus } from '@/lib/qna-stats';
import { logger } from '@/lib/utils/logger';

interface QuestionStats {
  total: number;
  open: number;
  answered: number;
  closed: number;
}

export default function MyQuestionsPage() {
  // State管理
  const [questions, setQuestions] = useState<QuestionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  // 統計計算
  const stats: QuestionStats = {
    total: questions.length,
    open: questions.filter(q => q.status === 'open').length,
    answered: questions.filter(q => q.status === 'answered').length,
    closed: questions.filter(q => q.status === 'closed').length
  };

  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/questions/my?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '質問の取得に失敗しました');
      }

      const result = await response.json();
      setQuestions(result.data || []);
      
    } catch (err) {
      logger.error('Failed to load questions:', { data: err });
      setError(err instanceof Error ? err.message : '質問の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // データ取得
  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const toggleExpanded = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'answered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'answered':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'closed':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredQuestions = questions.filter(question => 
    statusFilter === 'all' || question.status === statusFilter
  );

  // ローディング状態
  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-[var(--color-background-secondary)] rounded w-1/3"></div>
            <HIGCardGrid columns={3} gap="lg">
              {[...Array(3)].map((_, i) => (
                <HIGCard key={i} className="h-24">
                  <div className="h-full bg-[var(--color-background-secondary)] rounded"></div>
                </HIGCard>
              ))}
            </HIGCardGrid>
            <div className="h-96 bg-[var(--color-background-secondary)] rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="hig-text-h1 text-[var(--color-text-primary)] flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-[var(--color-primary)]" />
              投稿した質問
            </h1>
            <p className="hig-text-body text-[var(--color-text-secondary)] mt-2">
              企業に送信した質問と回答を確認できます
            </p>
          </div>
          <div className="flex gap-3">
            <HIGButton
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={loadQuestions}
              loading={loading}
            >
              更新
            </HIGButton>
            <Link href="/qna/ask">
              <HIGButton
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                新しい質問
              </HIGButton>
            </Link>
          </div>
        </div>

        {/* 統計カード */}
        <HIGCardGrid columns={4} gap="lg">
          <HIGCard variant="elevated">
            <HIGCardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="hig-text-caption text-[var(--color-text-secondary)]">総質問数</p>
                  <p className="hig-text-h2 text-[var(--color-primary)] mt-1">
                    {stats.total}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-[var(--color-primary)] opacity-60" />
              </div>
            </HIGCardContent>
          </HIGCard>

          <HIGCard variant="elevated">
            <HIGCardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="hig-text-caption text-[var(--color-text-secondary)]">未回答</p>
                  <p className="hig-text-h2 text-orange-500 mt-1">
                    {stats.open}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500 opacity-60" />
              </div>
            </HIGCardContent>
          </HIGCard>

          <HIGCard variant="elevated">
            <HIGCardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="hig-text-caption text-[var(--color-text-secondary)]">回答済み</p>
                  <p className="hig-text-h2 text-green-500 mt-1">
                    {stats.answered}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-60" />
              </div>
            </HIGCardContent>
          </HIGCard>

          <HIGCard variant="elevated">
            <HIGCardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="hig-text-caption text-[var(--color-text-secondary)]">完了</p>
                  <p className="hig-text-h2 text-gray-500 mt-1">
                    {stats.closed}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-gray-500 opacity-60" />
              </div>
            </HIGCardContent>
          </HIGCard>
        </HIGCardGrid>

        {/* フィルター */}
        <HIGCard>
          <HIGCardHeader>
            <HIGCardTitle level={2}>
              <Filter className="h-5 w-5 inline mr-2" />
              フィルター
            </HIGCardTitle>
          </HIGCardHeader>
          <HIGCardContent>
            <div className="flex gap-2">
              {[
                { value: 'all', label: '全て' },
                { value: 'open', label: '未回答' },
                { value: 'answered', label: '回答済み' },
                { value: 'closed', label: '完了' }
              ].map((filter) => (
                <HIGButton
                  key={filter.value}
                  variant={statusFilter === filter.value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter(filter.value)}
                >
                  {filter.label}
                </HIGButton>
              ))}
            </div>
          </HIGCardContent>
        </HIGCard>

        {/* エラー表示 */}
        {error && (
          <HIGCard variant="filled" className="border-l-4 border-l-[var(--color-error)]">
            <HIGCardContent>
              <p className="text-[var(--color-error)]">{error}</p>
            </HIGCardContent>
          </HIGCard>
        )}

        {/* 質問一覧 */}
        {filteredQuestions.length > 0 ? (
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <HIGCard key={question.id} className="hover:shadow-md transition-shadow">
                <HIGCardContent>
                  
                  {/* 質問ヘッダー */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(question.status)}`}>
                          {getStatusIcon(question.status)}
                          {translateQuestionStatus(question.status)}
                        </span>
                        <span className="hig-text-caption text-[var(--color-text-secondary)] flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {question.company_name}
                        </span>
                        <span className="hig-text-caption text-[var(--color-text-secondary)] flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(question.created_at).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      <p className="hig-text-body text-[var(--color-text-primary)] line-clamp-2">
                        {question.question_text}
                      </p>
                    </div>
                    <HIGButton
                      variant="ghost"
                      size="sm"
                      leftIcon={<Eye className="h-4 w-4" />}
                      onClick={() => toggleExpanded(question.id)}
                    >
                      {expandedQuestions.has(question.id) ? '閉じる' : '詳細'}
                    </HIGButton>
                  </div>

                  {/* 展開時の詳細情報 */}
                  {expandedQuestions.has(question.id) && (
                    <div className="border-t border-[var(--color-border-secondary)] pt-4 space-y-4">
                      
                      {/* 質問全文 */}
                      <div>
                        <h4 className="hig-text-caption font-semibold text-[var(--color-text-secondary)] mb-2">
                          質問内容:
                        </h4>
                        <p className="hig-text-body text-[var(--color-text-primary)] whitespace-pre-wrap bg-[var(--color-background-secondary)] p-3 rounded">
                          {question.question_text}
                        </p>
                      </div>

                      {/* 回答 */}
                      {question.answer_text ? (
                        <div>
                          <h4 className="hig-text-caption font-semibold text-[var(--color-text-secondary)] mb-2">
                            回答:
                          </h4>
                          <div className="bg-green-50 border border-green-200 p-3 rounded">
                            <p className="hig-text-body text-[var(--color-text-primary)] whitespace-pre-wrap">
                              {question.answer_text}
                            </p>
                            {question.answered_at && question.answerer_name && (
                              <div className="mt-3 pt-3 border-t border-green-200">
                                <p className="hig-text-caption text-[var(--color-text-secondary)]">
                                  回答者: {question.answerer_name} • 
                                  回答日: {new Date(question.answered_at).toLocaleDateString('ja-JP')}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-orange-50 border border-orange-200 p-3 rounded">
                          <p className="hig-text-body text-orange-700">
                            まだ回答がありません。企業からの回答をお待ちください。
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </HIGCardContent>
              </HIGCard>
            ))}
          </div>
        ) : (
          <HIGCard>
            <HIGCardContent>
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-[var(--color-text-tertiary)] mx-auto mb-4" />
                <h3 className="hig-text-h3 text-[var(--color-text-secondary)] mb-2">
                  {statusFilter === 'all' ? '質問がありません' : `${statusFilter === 'open' ? '未回答' : statusFilter === 'answered' ? '回答済み' : '完了'}の質問がありません`}
                </h3>
                <p className="hig-text-body text-[var(--color-text-secondary)] mb-6">
                  {statusFilter === 'all' 
                    ? '企業に質問を送って、サービスについて詳しく聞いてみましょう。'
                    : '他のフィルターで質問を確認するか、新しい質問を投稿してみてください。'
                  }
                </p>
                <Link href="/qna/ask">
                  <HIGButton
                    variant="primary"
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    質問を投稿
                  </HIGButton>
                </Link>
              </div>
            </HIGCardContent>
          </HIGCard>
        )}
      </div>
    </div>
  );
}