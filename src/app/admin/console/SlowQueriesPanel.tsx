/* eslint-disable no-console */
/**
 * AIOHub P3-1: Super Admin Console - Slow Queries Panel
 * 
 * 将来的に pg_stat_statements からのスロークエリ監視用
 * Edge Function 経由での安全な取得を想定
 */

'use client';

import React from 'react';
import type { SlowQueryStat, AdminSlowQueriesResponse } from '@/types/admin-console';

interface SlowQueriesPanelProps {
  queries: SlowQueryStat[];
  isPreview?: boolean;
}

/**
 * 将来: Edge Function からスロークエリ統計を取得
 * 
 * 設計方針:
 * - Edge Function 内で JWT 検証 + app_users.role チェック
 * - service_role で pg_stat_statements アクセス
 * - クエリ文字列の正規化・マスキング処理
 * - Top N メトリクスのみ返却
 */
async function fetchSlowQueriesForAdmin(): Promise<SlowQueryStat[]> {
  try {
    // TODO: Edge Function エンドポイント呼び出し
    // const response = await fetch('/api/admin/slow-queries', {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Bearer ${getSupabaseJWT()}`, // JWT付与
    //   },
    // });
    // 
    // if (!response.ok) {
    //   throw new Error(`Edge Function error: ${response.status}`);
    // }
    // 
    // const data: AdminSlowQueriesResponse = await response.json();
    // return data.queries;

    // 現在はダミーデータ
    return [];
  } catch (error) {
    console.error('Failed to fetch slow queries:', error);
    return [];
  }
}

export default function SlowQueriesPanel({ queries, isPreview = false }: SlowQueriesPanelProps) {
  // 将来: queriesが空でない場合は実際のデータを表示
  const hasData = queries.length > 0;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isPreview ? 'Recent Slow Queries' : 'Slow Query Monitor'}
            </h3>
            <p className="text-sm text-gray-500">
              {hasData 
                ? `${queries.length} queries monitored`
                : 'Database performance monitoring (coming soon)'
              }
            </p>
          </div>
          {!isPreview && (
            <button 
              className={`px-4 py-2 text-sm font-medium rounded ${
                hasData
                  ? 'text-white bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)]'
                  : 'text-gray-400 bg-gray-100 cursor-not-allowed'
              }`}
              disabled={!hasData}
            >
              {hasData ? 'View Details' : 'Configure pg_stat_statements'}
            </button>
          )}
        </div>
      </div>

      {/* 将来: 実データ表示部分 */}
      {hasData ? (
        <div className="divide-y divide-gray-200">
          {queries.slice(0, isPreview ? 3 : undefined).map((query) => (
            <div key={query.queryId} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {query.fingerprint}
                    </span>
                    <span className="text-xs text-gray-500">
                      {query.meanTimeMs.toFixed(1)}ms avg
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
                    {query.normalizedQuery}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span>Calls: {query.calls.toLocaleString()}</span>
                    <span>Max: {query.maxTimeMs.toFixed(1)}ms</span>
                    <span>Rows: {query.meanRows.toFixed(1)} avg</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // 現在の placeholder UI
        <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h4 className="text-lg font-medium text-gray-900 mb-2">Slow Query Monitoring</h4>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Monitor and analyze database query performance with pg_stat_statements integration. 
          This feature will help identify and optimize slow running queries.
        </p>

        <div className="space-y-4 text-left max-w-lg mx-auto">
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2">Planned Features:</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Query execution time analysis</li>
              <li>• Most frequent slow queries</li>
              <li>• Performance trend monitoring</li>
              <li>• Query optimization suggestions</li>
              <li>• Real-time performance alerts</li>
            </ul>
          </div>

          <div className="bg-[var(--aio-info-surface)] border border-[var(--aio-info-border)] rounded-lg p-4">
            <h5 className="font-medium text-[var(--aio-info)] mb-2">Implementation Status:</h5>
            <div className="text-sm text-[var(--aio-info)]">
              <div className="flex items-center mb-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                <span>pg_stat_statements setup - Pending</span>
              </div>
              <div className="flex items-center mb-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                <span>Query metrics collection - Planned</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                <span>Performance dashboard - Design phase</span>
              </div>
            </div>
          </div>
        </div>

        {isPreview && (
          <div className="mt-6">
            <button className="text-sm font-medium text-[var(--aio-primary)] hover:text-[var(--aio-primary)]">
              Learn More About Slow Query Monitoring
            </button>
          </div>
        )}
        </div>
      )}

      {/* Preview モードでの「View All」ボタン */}
      {isPreview && hasData && queries.length > 3 && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button className="text-sm font-medium text-[var(--aio-primary)] hover:text-[var(--aio-primary)]">
            View All {queries.length} Slow Queries
          </button>
        </div>
      )}
    </div>
  );
}