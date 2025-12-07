'use client';

import React, { useState, useEffect } from 'react';
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
  Clock, 
  CheckCircle, 
  XCircle,
  User,
  Building,
  Calendar,
  Eye,
  Filter,
  RefreshCw,
  Trash2,
  Send,
  Shield,
  FileText,
  Hash,
  Search
} from 'lucide-react';
import type { QuestionWithDetails } from '@/types/domain/questions';;
import { translateQuestionStatus, generateQuestionsCSV } from '@/lib/qna-stats';
import { logger } from '@/lib/utils/logger';

interface QuestionStats {
  total: number;
  open: number;
  answered: number;
  closed: number;
}

export default function AdminQuestionsPage() {
  // State管理
  const [questions, setQuestions] = useState<QuestionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [answeringQuestion, setAnsweringQuestion] = useState<string | null>(null);
  const [answerTexts, setAnswerTexts] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // 統計計算
  const stats: QuestionStats = {
    total: questions.length,
    open: questions.filter(q => q.status === 'open').length,
    answered: questions.filter(q => q.status === 'answered').length,
    closed: questions.filter(q => q.status === 'closed').length
  };

  // 企業リスト生成
  const companies = [...new Set(questions.map(q => q.company_name).filter(Boolean))].sort();

  // データ取得
  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, companyFilter]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (companyFilter !== 'all') {
        // 企業名から企業IDを取得する必要があるが、簡略化のため名前フィルターをクライアント側で行う
      }
      params.set('limit', '100');

      const response = await fetch(`/api/questions?${params}`);
      
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
  };

  const toggleExpanded = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const startAnswering = (questionId: string) => {
    setAnsweringQuestion(questionId);
    const question = questions.find(q => q.id === questionId);
    if (question && question.answer_text) {
      setAnswerTexts(prev => ({ ...prev, [questionId]: question.answer_text || '' }));
    }
  };

  const cancelAnswering = (questionId: string) => {
    setAnsweringQuestion(null);
    setAnswerTexts(prev => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });
  };

  const submitAnswer = async (questionId: string) => {
    const answerText = answerTexts[questionId]?.trim();
    
    if (!answerText) {
      alert('回答内容を入力してください。');
      return;
    }

    try {
      setSubmitting(questionId);

      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answer_text: answerText,
          status: 'answered'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // 質問リストを更新
        setQuestions(prev => prev.map(q => 
          q.id === questionId ? result.data : q
        ));
        
        // 回答モードを終了
        setAnsweringQuestion(null);
        setAnswerTexts(prev => {
          const updated = { ...prev };
          delete updated[questionId];
          return updated;
        });
      } else {
        const errorData = await response.json();
        alert(errorData.error || '回答の送信に失敗しました');
      }
    } catch (error) {
      logger.error('Answer submission failed', { data: error instanceof Error ? error : new Error(String(error)) });
      alert('回答の送信に失敗しました');
    } finally {
      setSubmitting(null);
    }
  };

  const updateQuestionStatus = async (questionId: string, status: string) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        const result = await response.json();
        
        // 質問リストを更新
        setQuestions(prev => prev.map(q => 
          q.id === questionId ? result.data : q
        ));
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'ステータスの更新に失敗しました');
      }
    } catch (error) {
      logger.error('Status update failed', { data: error instanceof Error ? error : new Error(String(error)) });
      alert('ステータスの更新に失敗しました');
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('この質問を削除してもよろしいですか？この操作は取り消せません。')) {
      return;
    }

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // 質問をリストから削除
        setQuestions(prev => prev.filter(q => q.id !== questionId));
      } else {
        const errorData = await response.json();
        alert(errorData.error || '質問の削除に失敗しました');
      }
    } catch (error) {
      logger.error('Question deletion failed', { data: error instanceof Error ? error : new Error(String(error)) });
      alert('質問の削除に失敗しました');
    }
  };

  const exportQuestions = async () => {
    try {
      setExporting(true);
      
      // フィルタリングされた質問でCSVを生成
      const csvContent = generateQuestionsCSV(filteredQuestions);
      
      // ダウンロード
      const blob = new Blob([csvContent], { type: 'text/csv; charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `質問箱データ_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      logger.error('Export failed', { data: error instanceof Error ? error : new Error(String(error)) });
      alert('エクスポートに失敗しました');
    } finally {
      setExporting(false);
    }
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

  // フィルタリング
  const filteredQuestions = questions.filter(question => {
    // ステータスフィルター
    if (statusFilter !== 'all' && question.status !== statusFilter) {
      return false;
    }
    
    // 企業フィルター
    if (companyFilter !== 'all' && question.company_name !== companyFilter) {
      return false;
    }
    
    // 検索フィルター
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      return question.question_text.toLowerCase().includes(searchLower) ||
             question.user_full_name?.toLowerCase().includes(searchLower) ||
             question.user_email?.toLowerCase().includes(searchLower) ||
             question.company_name?.toLowerCase().includes(searchLower);
    }
    
    return true;
  });

  // ローディング状態
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background-primary)] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-[var(--color-background-secondary)] rounded w-1/3"></div>
            <HIGCardGrid columns={4} gap="lg">
              {[...Array(4)].map((_, i) => (
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
    <div className="min-h-screen bg-[var(--color-background-primary)] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="hig-text-h1 text-[var(--color-text-primary)] flex items-center gap-3">
              <Shield className="h-8 w-8 text-[var(--color-primary)]" />
              質問監視ダッシュボード
            </h1>
            <p className="hig-text-body text-[var(--color-text-secondary)] mt-2">
              全企業の質問を監視・管理できます
            </p>
          </div>
          <div className="flex gap-3">
            <HIGButton
              variant="secondary"
              leftIcon={<FileText className="h-4 w-4" />}
              onClick={exportQuestions}
              loading={exporting}
            >
              CSVエクスポート
            </HIGButton>
            <HIGButton
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={loadQuestions}
              loading={loading}
            >
              更新
            </HIGButton>
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
                <Hash className="h-8 w-8 text-[var(--color-primary)] opacity-60" />
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

        {/* フィルター・検索 */}
        <HIGCard>
          <HIGCardHeader>
            <HIGCardTitle level={2}>
              <Filter className="h-5 w-5 inline mr-2" />
              フィルター・検索
            </HIGCardTitle>
          </HIGCardHeader>
          <HIGCardContent>
            <div className="space-y-4">
              
              {/* ステータスフィルター */}
              <div>
                <label className="hig-text-caption text-[var(--color-text-secondary)] block mb-2">
                  ステータス
                </label>
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
              </div>

              {/* 企業・検索フィルター */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="hig-text-caption text-[var(--color-text-secondary)] block mb-2">
                    企業
                  </label>
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-lg 
                             bg-[var(--color-background)] text-[var(--color-text-primary)]
                             focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  >
                    <option value="all">全企業</option>
                    {companies.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="hig-text-caption text-[var(--color-text-secondary)] block mb-2">
                    検索
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
                    <input
                      type="text"
                      placeholder="質問内容、ユーザー名、企業名で検索..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-[var(--color-border-secondary)] rounded-lg 
                               bg-[var(--color-background)] text-[var(--color-text-primary)]
                               focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
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

        {/* 結果表示 */}
        <div className="flex justify-between items-center">
          <p className="hig-text-body text-[var(--color-text-secondary)]">
            {filteredQuestions.length}件の質問を表示中 (全{questions.length}件)
          </p>
        </div>

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
                          <User className="h-3 w-3" />
                          {question.user_full_name || question.user_email}
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
                    <div className="flex gap-2">
                      <HIGButton
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye className="h-4 w-4" />}
                        onClick={() => toggleExpanded(question.id)}
                      >
                        {expandedQuestions.has(question.id) ? '閉じる' : '詳細'}
                      </HIGButton>
                      <HIGButton
                        variant="ghost"
                        size="sm"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        onClick={() => deleteQuestion(question.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        削除
                      </HIGButton>
                    </div>
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

                      {/* 管理者用回答セクション */}
                      {answeringQuestion === question.id ? (
                        // 回答入力モード
                        <div>
                          <h4 className="hig-text-caption font-semibold text-[var(--color-text-secondary)] mb-2">
                            管理者として回答:
                          </h4>
                          <textarea
                            value={answerTexts[question.id] || ''}
                            onChange={(e) => setAnswerTexts(prev => ({ 
                              ...prev, 
                              [question.id]: e.target.value 
                            }))}
                            placeholder="管理者として質問者への回答を入力してください..."
                            rows={6}
                            className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-lg 
                                     bg-[var(--color-background)] text-[var(--color-text-primary)]
                                     focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-vertical"
                            maxLength={2000}
                          />
                          <div className="flex justify-between items-center mt-2">
                            <p className="hig-text-caption text-[var(--color-text-secondary)]">
                              {answerTexts[question.id]?.length || 0}/2000
                            </p>
                            <div className="flex gap-2">
                              <HIGButton
                                variant="secondary"
                                size="sm"
                                onClick={() => cancelAnswering(question.id)}
                                disabled={submitting === question.id}
                              >
                                キャンセル
                              </HIGButton>
                              <HIGButton
                                variant="primary"
                                size="sm"
                                leftIcon={<Send className="h-4 w-4" />}
                                onClick={() => submitAnswer(question.id)}
                                loading={submitting === question.id}
                                disabled={!answerTexts[question.id]?.trim()}
                              >
                                回答を送信
                              </HIGButton>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // 回答表示・管理モード
                        <div>
                          {question.answer_text ? (
                            <div>
                              <h4 className="hig-text-caption font-semibold text-[var(--color-text-secondary)] mb-2">
                                現在の回答:
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
                              <p className="hig-text-body text-orange-700 mb-3">
                                まだ回答されていません
                              </p>
                            </div>
                          )}
                          
                          {/* 管理者用アクション */}
                          <div className="flex gap-2">
                            <HIGButton
                              variant="secondary"
                              size="sm"
                              leftIcon={<Send className="h-4 w-4" />}
                              onClick={() => startAnswering(question.id)}
                            >
                              {question.answer_text ? '回答を編集' : '管理者として回答'}
                            </HIGButton>
                            
                            {question.status === 'open' && (
                              <HIGButton
                                variant="secondary"
                                size="sm"
                                onClick={() => updateQuestionStatus(question.id, 'answered')}
                              >
                                回答済みにする
                              </HIGButton>
                            )}
                            
                            {question.status !== 'closed' && (
                              <HIGButton
                                variant="secondary"
                                size="sm"
                                onClick={() => updateQuestionStatus(question.id, 'closed')}
                              >
                                完了にする
                              </HIGButton>
                            )}
                          </div>
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
                  {searchTerm || statusFilter !== 'all' || companyFilter !== 'all' 
                    ? '条件に一致する質問がありません' 
                    : '質問がありません'
                  }
                </h3>
                <p className="hig-text-body text-[var(--color-text-secondary)]">
                  {searchTerm || statusFilter !== 'all' || companyFilter !== 'all'
                    ? 'フィルター条件を変更して再度お試しください。'
                    : 'まだユーザーからの質問がありません。'
                  }
                </p>
              </div>
            </HIGCardContent>
          </HIGCard>
        )}
      </div>
    </div>
  );
}