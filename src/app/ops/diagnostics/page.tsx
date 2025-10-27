'use client';

import React, { useState, useEffect } from 'react';
import { HIGButton } from '@/design-system';
import { logger } from '@/lib/utils/logger';

interface Issue {
  component: string;
  severity: 'critical' | 'warning';
  message: string;
  details?: any[];
}

interface Error {
  type: string;
  error: string;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  message: string;
  action: string;
  component?: string;
}

interface ComponentStatus {
  status: 'healthy' | 'degraded' | 'critical' | 'error';
  score: number;
}

interface DiagnosticResult {
  success: boolean;
  overall?: 'healthy' | 'degraded' | 'critical';
  totalScore?: number;
  diagnosticTime?: number;
  components?: {
    [key: string]: ComponentStatus;
  };
  issues?: {
    critical: Issue[];
    warnings: Issue[];
    errors: Error[];
  };
  recommendations?: Recommendation[];
  summary?: {
    totalComponents: number;
    healthyComponents: number;
    degradedComponents: number;
    criticalComponents: number;
    totalRecommendations: number;
    highPriorityRecommendations: number;
  };
}

export default function DiagnosticsPage() {
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/diag/comprehensive');
      const result = await response.json();
      setDiagnosticResult(result);
      setLastRun(new Date());
    } catch (error) {
      logger.error('診断の実行に失敗しました', error instanceof Error ? error : new Error(String(error)));
      setDiagnosticResult({
        success: false,
        overall: 'critical',
        components: {},
        issues: { critical: [], warnings: [], errors: [{ type: 'system', error: '診断APIに接続できませんでした' }] }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      case 'error': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'critical': return '❌';
      case 'error': return '❓';
      default: return '❓';
    }
  };

  const componentNames = {
    basic: '基本設定',
    performance: 'パフォーマンス',
    database: 'データベース',
    security: 'セキュリティ',
    auth: '認証',
    session: 'セッション'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">システム診断ダッシュボード</h1>
              <p className="mt-2 text-gray-600">
                アプリケーションの健全性を包括的に診断します
              </p>
              {lastRun && (
                <p className="text-sm text-gray-500 mt-1">
                  最終実行: {lastRun.toLocaleString('ja-JP')}
                </p>
              )}
            </div>
            <HIGButton
              onClick={runDiagnostics}
              disabled={loading}
              variant="primary"
              size="medium"
            >
              {loading ? '診断中...' : '診断実行'}
            </HIGButton>
          </div>
        </div>

        {loading && !diagnosticResult && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">システム診断を実行中...</p>
          </div>
        )}

        {diagnosticResult && (
          <div className="space-y-8">
            {/* 総合スコア */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">総合健全性スコア</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    診断時間: {diagnosticResult.diagnosticTime}ms
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-bold ${ 
                    diagnosticResult.overall === 'healthy' ? 'text-green-600' :
                    diagnosticResult.overall === 'degraded' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {diagnosticResult.totalScore || 0}%
                  </div>
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    getStatusColor(diagnosticResult.overall || 'error')
                  }`}>
                    {diagnosticResult.overall === 'healthy' ? '健全' :
                     diagnosticResult.overall === 'degraded' ? '注意' : '危険'}
                  </div>
                </div>
              </div>
            </div>

            {/* コンポーネント別ステータス */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">コンポーネント別ステータス</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {diagnosticResult.components && Object.entries(diagnosticResult.components).map(([key, component]) => (
                  <div 
                    key={key} 
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedComponent(selectedComponent === key ? null : key)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {componentNames[key as keyof typeof componentNames] || key}
                        </h3>
                        <div className={`text-sm font-medium ${getStatusColor(component.status).replace('bg-', 'text-').replace('-100', '-600')}`}>
                          {getStatusIcon(component.status)} {component.status}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {component.score}%
                        </div>
                        <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full progress-bar ${
                              component.score >= 85 ? 'bg-green-500' :
                              component.score >= 70 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${component.score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 重要な問題 */}
            {diagnosticResult.issues && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 重大な問題 */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    重大な問題 ({diagnosticResult.issues.critical.length})
                  </h2>
                  <div className="space-y-3">
                    {diagnosticResult.issues.critical.length > 0 ? (
                      diagnosticResult.issues.critical.map((issue, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start">
                            <div className="text-red-600 mr-3">❌</div>
                            <div>
                              <h4 className="font-medium text-red-800">{issue.component}</h4>
                              <p className="text-sm text-red-700 mt-1">{issue.message}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">重大な問題はありません</p>
                    )}
                  </div>
                </div>

                {/* 警告 */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    警告 ({diagnosticResult.issues.warnings.length})
                  </h2>
                  <div className="space-y-3">
                    {diagnosticResult.issues.warnings.length > 0 ? (
                      diagnosticResult.issues.warnings.map((warning, index) => (
                        <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-start">
                            <div className="text-yellow-600 mr-3">⚠️</div>
                            <div>
                              <h4 className="font-medium text-yellow-800">{warning.component}</h4>
                              <p className="text-sm text-yellow-700 mt-1">{warning.message}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">警告はありません</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 推奨事項 */}
            {diagnosticResult.recommendations && diagnosticResult.recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">推奨事項</h2>
                <div className="space-y-4">
                  {diagnosticResult.recommendations.slice(0, 8).map((rec, index) => (
                    <div key={index} className="border-l-4 border-blue-500 bg-blue-50 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mr-3 ${
                              rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {rec.priority === 'high' ? '高' :
                               rec.priority === 'medium' ? '中' : '低'}
                            </span>
                            <span className="text-sm font-medium text-gray-600">{rec.component}</span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">{rec.message}</h4>
                          <p className="text-sm text-gray-600">{rec.action}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* サマリー統計 */}
            {diagnosticResult.summary && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">診断サマリー</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {diagnosticResult.summary.healthyComponents}
                    </div>
                    <div className="text-sm text-gray-600">健全なコンポーネント</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {diagnosticResult.summary.degradedComponents}
                    </div>
                    <div className="text-sm text-gray-600">注意が必要</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {diagnosticResult.summary.criticalComponents}
                    </div>
                    <div className="text-sm text-gray-600">危険な状態</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {diagnosticResult.summary.highPriorityRecommendations}
                    </div>
                    <div className="text-sm text-gray-600">重要な推奨事項</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && !diagnosticResult && (
          <div className="text-center py-12">
            <p className="text-gray-600">診断を実行してシステムの健全性を確認してください</p>
          </div>
        )}
      </div>
    </div>
  );
}