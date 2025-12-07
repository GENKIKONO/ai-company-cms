'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Brain, 
  Calendar, 
  TrendingUp, 
  Users, 
  FileText,
  AlertCircle,
  Crown
} from 'lucide-react';
import { ReportSection } from '../components/ReportSection';
import { PdfDownloadButton } from '../components/PdfDownloadButton';
import { RegenerateButton } from '../components/RegenerateButton';

interface ReportData {
  id: string;
  plan_id: string;
  level: string;
  period_start: string;
  period_end: string;
  status: string;
  summary_text: string;
  metrics: any;
  sections: any;
  suggestions: any[];
  created_at: string;
  updated_at: string;
}

export default function AiReportDetailPage() {
  const params = useParams();
  const period = params?.period as string; // YYYY-MM

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/my/reports/monthly/${period}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('指定された期間のレポートが見つかりません');
        }
        throw new Error('レポートの取得に失敗しました');
      }

      const data = await response.json();
      setReport(data.report);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知のエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (period) {
      fetchReport();
    }
  }, [period, fetchReport]);

  const formatPeriod = (periodStart: string) => {
    const date = new Date(periodStart);
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'light': return 'ライト版';
      case 'detail': return '詳細版';
      case 'advanced': return '高度版';
      case 'custom': return 'カスタム';
      default: return level;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return priority;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h1 className="text-xl font-bold text-neutral-900">エラーが発生しました</h1>
            </div>
            <p className="text-neutral-600 mb-6">{error}</p>
            <div className="flex gap-4">
              <Link 
                href="/dashboard/ai-reports"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                レポート一覧に戻る
              </Link>
              <button
                onClick={fetchReport}
                className="px-4 py-2 bg-[var(--aio-primary)] text-white rounded-lg hover:bg-[var(--aio-primary)]/90 transition-colors"
              >
                再試行
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/dashboard/ai-reports"
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-[var(--aio-primary)]" />
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">
                  {formatPeriod(report.period_start)} AI月次レポート
                </h1>
                <div className="flex items-center gap-4 text-sm text-neutral-600">
                  <span>{getLevelLabel(report.level)}</span>
                  <span>プラン: {report.plan_id.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <RegenerateButton 
                period={period}
                size="md"
                onRegenerated={fetchReport}
              />
              <PdfDownloadButton period={period} />
            </div>
          </div>
        </div>

        {/* AIサマリー */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6 text-[var(--aio-primary)]" />
            <h2 className="text-xl font-semibold text-neutral-900">AIサマリー</h2>
          </div>
          <p className="text-neutral-700 leading-relaxed">{report.summary_text}</p>
        </div>

        {/* 基本KPI */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-[var(--aio-primary)]" />
            <h2 className="text-xl font-semibold text-neutral-900">基本指標</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {report.metrics?.total_page_views?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-blue-800">月間ページビュー</div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {report.metrics?.unique_contents || 0}
              </div>
              <div className="text-sm text-green-800">公開コンテンツ数</div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {report.metrics?.ai_generated_contents || 0}
              </div>
              <div className="text-sm text-purple-800">AI生成コンテンツ</div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {(report.metrics?.services_published || 0) + 
                 (report.metrics?.faqs_published || 0) + 
                 (report.metrics?.case_studies_published || 0)}
              </div>
              <div className="text-sm text-orange-800">主要コンテンツ</div>
            </div>
          </div>
        </div>

        {/* セクション別分析 */}
        {report.sections && Object.entries(report.sections).map(([sectionKey, sectionData]) => (
          <ReportSection 
            key={sectionKey}
            title={sectionKey}
            data={sectionData as any}
            level={report.level}
          />
        ))}

        {/* 改善提案 */}
        {report.suggestions && report.suggestions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Crown className="w-6 h-6 text-yellow-600" />
              <h2 className="text-xl font-semibold text-neutral-900">改善提案</h2>
            </div>

            <div className="space-y-4">
              {report.suggestions.map((suggestion, index) => (
                <div key={suggestion.id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                      優先度: {getPriorityLabel(suggestion.priority)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 mb-2">{suggestion.title}</h3>
                      <p className="text-neutral-700 text-sm">{suggestion.description}</p>
                      {suggestion.category && (
                        <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {suggestion.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* フッター情報 */}
        <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <Calendar className="w-4 h-4" />
            <span>対象期間: {report.period_start} 〜 {report.period_end}</span>
            <span>•</span>
            <span>作成日: {new Date(report.created_at).toLocaleDateString('ja-JP')}</span>
            {report.updated_at !== report.created_at && (
              <>
                <span>•</span>
                <span>更新日: {new Date(report.updated_at).toLocaleDateString('ja-JP')}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}