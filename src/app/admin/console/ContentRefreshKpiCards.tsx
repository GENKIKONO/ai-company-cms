/**
 * Content Refresh KPI Cards
 * P4-8: コンテンツ刷新パイプライン関連のKPI表示
 * 
 * 機能:
 * 1. RLS拒否 Top5表示
 * 2. Edge関数失敗率表示
 * 3. public_*更新遅延表示
 */

'use client';

import React from 'react';
import { AlertTriangle, Zap, Clock, TrendingDown, Database, Shield } from 'lucide-react';
import type { 
  RlsDeniesTop5Item, 
  EdgeFailureStatsItem, 
  PublicTablesFreshnessItem,
  RPCError 
} from '@/lib/supabase/admin-rpc';

interface ContentRefreshKpiCardsProps {
  rlsDenies: RlsDeniesTop5Item[];
  edgeFailures: EdgeFailureStatsItem[];
  publicFreshness: PublicTablesFreshnessItem[];
  errors: RPCError[];
  loading?: boolean;
}

function formatStaleness(stalenessSeconds: number): { value: string; color: string } {
  if (stalenessSeconds < 300) { // 5分未満
    return { value: `${Math.floor(stalenessSeconds)}s`, color: 'text-green-600' };
  } else if (stalenessSeconds < 1800) { // 30分未満
    return { value: `${Math.floor(stalenessSeconds / 60)}m`, color: 'text-yellow-600' };
  } else if (stalenessSeconds < 3600) { // 1時間未満
    return { value: `${Math.floor(stalenessSeconds / 60)}m`, color: 'text-orange-600' };
  } else {
    return { value: `${Math.floor(stalenessSeconds / 3600)}h`, color: 'text-red-600' };
  }
}

function LoadingCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
      <div className="mt-4 space-y-2">
        <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
      </div>
    </div>
  );
}

function ErrorCard({ title, error }: { title: string; error: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
        {error}
      </div>
    </div>
  );
}

export default function ContentRefreshKpiCards({ 
  rlsDenies, 
  edgeFailures, 
  publicFreshness, 
  errors,
  loading = false 
}: ContentRefreshKpiCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LoadingCard 
          title="RLS拒否 Top5" 
          description="権限拒否が多いテーブル・エンドポイント" 
        />
        <LoadingCard 
          title="Edge関数失敗率" 
          description="Edge Function実行の失敗統計" 
        />
        <LoadingCard 
          title="public_*更新遅延" 
          description="公開テーブルの更新状況" 
        />
      </div>
    );
  }

  // エラーがある場合は個別に処理
  const rlsError = errors.find(e => e.message?.includes('rls') || e.message?.includes('admin_get_rls_denies_top5'));
  const edgeError = errors.find(e => e.message?.includes('edge') || e.message?.includes('admin_get_edge_failure_stats'));
  const publicError = errors.find(e => e.message?.includes('public') || e.message?.includes('admin_get_public_tables_freshness'));

  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Content Refresh KPIs</h2>
        <p className="text-gray-600">コンテンツ刷新パイプライン関連の主要指標</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RLS拒否 Top5 */}
        {rlsError ? (
          <ErrorCard title="RLS拒否 Top5" error={rlsError.message} />
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Shield className="h-6 w-6 text-red-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">RLS拒否 Top5</h3>
              </div>
              <span className="text-2xl font-bold text-red-600">
                {rlsDenies.length > 0 ? rlsDenies[0]?.deny_count || 0 : 0}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">権限拒否が多いテーブル・エンドポイント</p>
            
            {rlsDenies.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-green-600">❤️ 権限拒否なし</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rlsDenies.slice(0, 3).map((item, index) => (
                  <div key={`${item.table_name}-${item.endpoint}`} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium">{item.table_name}</span>
                      <span className="text-gray-500 ml-2">{item.endpoint}</span>
                    </div>
                    <span className="text-red-600 font-semibold">{item.deny_count}</span>
                  </div>
                ))}
                {rlsDenies.length > 3 && (
                  <div className="text-xs text-gray-500 text-center pt-2">
                    +{rlsDenies.length - 3} more items
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Edge関数失敗率 */}
        {edgeError ? (
          <ErrorCard title="Edge関数失敗率" error={edgeError.message} />
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Zap className="h-6 w-6 text-yellow-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Edge関数失敗率</h3>
              </div>
              <span className="text-2xl font-bold text-yellow-600">
                {edgeFailures.length > 0 
                  ? `${(Math.max(...edgeFailures.map(f => f.failure_rate)) * 100).toFixed(1)}%`
                  : '0%'
                }
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">Edge Function実行の失敗統計</p>
            
            {edgeFailures.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-green-600">✅ 失敗なし</p>
              </div>
            ) : (
              <div className="space-y-2">
                {edgeFailures
                  .sort((a, b) => b.failure_rate - a.failure_rate)
                  .slice(0, 3)
                  .map((item, index) => (
                    <div key={item.job_name} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-medium">{item.job_name.replace(/^.*\//, '')}</span>
                        <span className="text-gray-500 ml-2">
                          {item.failed_runs}/{item.total_runs}
                        </span>
                      </div>
                      <span className={`font-semibold ${
                        item.failure_rate > 0.1 ? 'text-red-600' : 
                        item.failure_rate > 0.05 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {(item.failure_rate * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )}

        {/* public_*更新遅延 */}
        {publicError ? (
          <ErrorCard title="public_*更新遅延" error={publicError.message} />
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Database className="h-6 w-6 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">public_*更新遅延</h3>
              </div>
              {publicFreshness.length > 0 && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-1" />
                  <span className={`text-xl font-bold ${
                    formatStaleness(Math.max(...publicFreshness.map(f => f.staleness_seconds))).color
                  }`}>
                    {formatStaleness(Math.max(...publicFreshness.map(f => f.staleness_seconds))).value}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">公開テーブルの更新状況</p>
            
            {publicFreshness.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">データがありません</p>
              </div>
            ) : (
              <div className="space-y-2">
                {publicFreshness
                  .sort((a, b) => b.staleness_seconds - a.staleness_seconds)
                  .slice(0, 3)
                  .map((item, index) => {
                    const staleness = formatStaleness(item.staleness_seconds);
                    return (
                      <div key={item.table_name} className="flex justify-between items-center text-sm">
                        <span className="font-medium">{item.table_name.replace('public_', '')}</span>
                        <span className={`font-semibold ${staleness.color}`}>
                          {staleness.value}
                        </span>
                      </div>
                    );
                  })
                }
                {publicFreshness.length > 3 && (
                  <div className="text-xs text-gray-500 text-center pt-2">
                    +{publicFreshness.length - 3} more tables
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}