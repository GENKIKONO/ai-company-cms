'use client';

/**
 * 埋め込み制限カード表示コンポーネント
 * プラン別制限と使用状況を監視
 */

import React, { useState, useEffect } from 'react';
import { PLAN_NAMES } from '@/config/plans';
import type { PlanType } from '@/config/plans';
import { logger } from '@/lib/utils/logger';

interface OrganizationLimit {
  id: string;
  name: string;
  slug: string;
  plan: PlanType;
  embedCount: number;
  embedLimit: number;
  monthlyViews: number;
  monthlyLimit: number;
  isOverLimit: boolean;
  warningLevel: 'none' | 'warning' | 'critical';
}

interface LimitStats {
  totalOrganizations: number;
  overLimitCount: number;
  warningCount: number;
  totalEmbeds: number;
  totalViews: number;
}

export function EmbedLimitCard() {
  const [limits, setLimits] = useState<OrganizationLimit[]>([]);
  const [stats, setStats] = useState<LimitStats>({
    totalOrganizations: 0,
    overLimitCount: 0,
    warningCount: 0,
    totalEmbeds: 0,
    totalViews: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyWarnings, setShowOnlyWarnings] = useState(false);

  useEffect(() => {
    fetchLimitData();
  }, []);

  const fetchLimitData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/embed/limits');
      
      if (!response.ok) {
        throw new Error('制限情報の取得に失敗しました');
      }

      const result = await response.json();
      setLimits(result.organizations || []);
      setStats(result.stats || stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー');
      logger.error('Failed to fetch limit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLimits = showOnlyWarnings 
    ? limits.filter(org => org.warningLevel !== 'none')
    : limits;

  const getWarningIcon = (level: OrganizationLimit['warningLevel']) => {
    switch (level) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      default: return '✅';
    }
  };

  const getWarningColor = (level: OrganizationLimit['warningLevel']) => {
    switch (level) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-green-50 border-green-200';
    }
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchLimitData}
            className="px-4 py-2 bg-[var(--bg-primary)] text-white rounded-md hover:bg-[var(--bg-primary-hover)] transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* ヘッダー統計 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.totalOrganizations}</div>
          <div className="text-sm text-gray-500">総組織数</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{stats.overLimitCount}</div>
          <div className="text-sm text-gray-500">制限超過</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.warningCount}</div>
          <div className="text-sm text-gray-500">警告レベル</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--bg-primary)]">{stats.totalEmbeds.toLocaleString()}</div>
          <div className="text-sm text-gray-500">総埋め込み数</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.totalViews.toLocaleString()}</div>
          <div className="text-sm text-gray-500">月間ビュー</div>
        </div>
      </div>

      {/* フィルタ */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showOnlyWarnings}
              onChange={(e) => setShowOnlyWarnings(e.target.checked)}
              className="rounded border-gray-300 text-[var(--bg-primary)] focus:ring-[var(--bg-primary)]"
            />
            <span className="text-sm text-gray-700">警告のみ表示</span>
          </label>
        </div>
        
        <div className="text-sm text-gray-500">
          {filteredLimits.length} / {limits.length} 組織
        </div>
      </div>

      {/* 組織一覧 */}
      {filteredLimits.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {showOnlyWarnings ? '警告対象の組織はありません' : '組織データがありません'}
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredLimits.map((org) => {
            const embedPercentage = org.embedLimit === -1 ? 0 : (org.embedCount / org.embedLimit) * 100;
            const viewPercentage = org.monthlyLimit === -1 ? 0 : (org.monthlyViews / org.monthlyLimit) * 100;
            
            return (
              <div
                key={org.id}
                className={`p-4 rounded-lg border transition-colors ${getWarningColor(org.warningLevel)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getWarningIcon(org.warningLevel)}</span>
                      <h3 className="font-semibold text-gray-900">{org.name}</h3>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        {PLAN_NAMES[org.plan]}
                      </span>
                    </div>
                    
                    {/* 埋め込み数制限 */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">埋め込み数</span>
                        <span className="font-medium">
                          {org.embedCount} / {org.embedLimit === -1 ? '無制限' : org.embedLimit}
                        </span>
                      </div>
                      {org.embedLimit !== -1 && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full progress-bar ${getProgressBarColor(embedPercentage)}`}
                            style={{ width: `${Math.min(embedPercentage, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* 月間ビュー制限 */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">月間ビュー</span>
                        <span className="font-medium">
                          {org.monthlyViews.toLocaleString()} / {org.monthlyLimit === -1 ? '無制限' : org.monthlyLimit.toLocaleString()}
                        </span>
                      </div>
                      {org.monthlyLimit !== -1 && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full progress-bar ${getProgressBarColor(viewPercentage)}`}
                            style={{ width: `${Math.min(viewPercentage, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* アクション */}
                  <div className="ml-4 flex flex-col space-y-2">
                    <a
                      href={`/management-console/organizations/${org.id}`}
                      className="px-3 py-1 text-xs bg-[var(--bg-primary)] text-white rounded hover:bg-[var(--bg-primary-hover)] transition-colors"
                    >
                      詳細
                    </a>
                    {org.warningLevel === 'critical' && (
                      <button className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                        制限解除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* アクション */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex space-x-3">
        <button 
          onClick={fetchLimitData}
          className="px-4 py-2 bg-[var(--bg-primary)] text-white rounded-md hover:bg-[var(--bg-primary-hover)] transition-colors"
        >
          更新
        </button>
        <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
          CSV エクスポート
        </button>
        <button className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors">
          警告通知送信
        </button>
      </div>
    </div>
  );
}