'use client';

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Search, Eye, Download, RefreshCw } from 'lucide-react';
import type { Organization } from '@/types/database';
import { logger } from '@/lib/utils/logger';

interface AIVisibilityMetrics {
  structuredDataScore: number;
  aiDiscoverabilityIndex: number;
  searchVisibilityScore: number;
  brandMentions: number;
  competitorAnalysis: {
    ranking: number;
    totalCompetitors: number;
    strongerAreas: string[];
    improvementAreas: string[];
  };
  recommendations: string[];
  lastUpdated: string;
}

interface AIVisibilityReportProps {
  organization: Organization;
  className?: string;
}

export function AIVisibilityReport({ organization, className = '' }: AIVisibilityReportProps) {
  const [metrics, setMetrics] = useState<AIVisibilityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    generateReport();
  }, [organization.id]);

  const generateReport = async () => {
    setGenerating(true);
    try {
      // モック実装 - 実際の実装ではClaude APIやOpenAI APIを使用
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒のローディング

      const mockMetrics: AIVisibilityMetrics = {
        structuredDataScore: Math.floor(Math.random() * 40) + 60, // 60-100
        aiDiscoverabilityIndex: Math.floor(Math.random() * 30) + 70, // 70-100
        searchVisibilityScore: Math.floor(Math.random() * 50) + 50, // 50-100
        brandMentions: Math.floor(Math.random() * 50) + 10,
        competitorAnalysis: {
          ranking: Math.floor(Math.random() * 10) + 1,
          totalCompetitors: 15,
          strongerAreas: ['技術力', 'サービス多様性'],
          improvementAreas: ['ブランド認知', 'コンテンツマーケティング']
        },
        recommendations: [
          '専門技術キーワードでのSEO強化',
          '導入事例の詳細化（業界・規模別）',
          'FAQ項目の拡充（月次更新推奨）',
          'サービス説明の構造化データ最適化',
          '競合他社分析に基づくポジショニング改善'
        ],
        lastUpdated: new Date().toISOString()
      };

      setMetrics(mockMetrics);
    } catch (error) {
      logger.error('Failed to generate AI visibility report', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading || !metrics) {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-neutral-900">AI Visibilityレポート</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-4" />
              <p className="text-neutral-600">AI分析レポートを生成中...</p>
              <p className="text-sm text-neutral-500 mt-2">
                企業情報の構造化データを分析しています
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-neutral-900">AI Visibilityレポート</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateReport}
            disabled={generating}
            className="btn btn-secondary btn-small"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            更新
          </button>
          <button className="btn btn-primary btn-small">
            <Download className="w-4 h-4" />
            PDF出力
          </button>
        </div>
      </div>

      {/* メトリクス概要 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">AI発見可能性</span>
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(metrics.aiDiscoverabilityIndex)}`}>
            {metrics.aiDiscoverabilityIndex}/100
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <Search className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">検索可視性</span>
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(metrics.searchVisibilityScore)}`}>
            {metrics.searchVisibilityScore}/100
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-green-100">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">ブランド言及</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {metrics.brandMentions}件
          </div>
        </div>
      </div>

      {/* 競合分析 */}
      <div className="mb-6 p-4 rounded-lg bg-slate-50">
        <h4 className="font-medium text-neutral-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          競合分析
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-neutral-600 mb-1">業界内ランキング</div>
            <div className="text-lg font-bold text-neutral-900">
              {metrics.competitorAnalysis.ranking}位 / {metrics.competitorAnalysis.totalCompetitors}社
            </div>
          </div>
          
          <div>
            <div className="text-sm text-neutral-600 mb-1">強み領域</div>
            <div className="flex flex-wrap gap-1">
              {metrics.competitorAnalysis.strongerAreas.map((area, index) => (
                <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="text-sm text-neutral-600 mb-1">改善領域</div>
          <div className="flex flex-wrap gap-1">
            {metrics.competitorAnalysis.improvementAreas.map((area, index) => (
              <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                {area}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 推奨アクション */}
      <div className="mb-6">
        <h4 className="font-medium text-neutral-900 mb-3">推奨アクション</h4>
        <div className="space-y-2">
          {metrics.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">{index + 1}</span>
              </div>
              <span className="text-sm text-neutral-700">{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* フッター */}
      <div className="text-xs text-neutral-500 border-t pt-4">
        最終更新: {new Date(metrics.lastUpdated).toLocaleString('ja-JP')}
        <br />
        ※ このレポートはAI分析に基づく推定値です。実際の検索結果とは異なる場合があります。
      </div>
    </div>
  );
}

export default AIVisibilityReport;