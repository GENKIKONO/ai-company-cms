'use client';

/**
 * 人気の埋め込み元サイト表示コンポーネント
 * どのサイトでWidgetが多く使われているかを分析
 */

import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';

interface SourceData {
  url: string;
  count: number;
  percentage: number;
  organizations: string[]; // 使用している組織名
  firstSeen: string;
  lastSeen: string;
}

interface TopSourcesProps {
  organizationId?: string;
  days?: number;
  limit?: number;
}

export function EmbedTopSources({ organizationId, days = 30, limit = 20 }: TopSourcesProps) {
  const [sources, setSources] = useState<SourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'widget' | 'iframe'>('all');

  const fetchTopSources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        days: days.toString(),
        limit: limit.toString(),
        type: selectedFilter
      });
      
      if (organizationId) {
        params.set('organizationId', organizationId);
      }

      const response = await fetch(`/api/admin/embed/top-sources?${params}`);
      
      if (!response.ok) {
        throw new Error('人気サイトデータの取得に失敗しました');
      }

      const result = await response.json();
      setSources(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー');
      logger.error('Failed to fetch top sources:', { data: err });
    } finally {
      setLoading(false);
    }
  }, [organizationId, days, limit, selectedFilter]);

  useEffect(() => {
    fetchTopSources();
  }, [fetchTopSources]);

  const formatUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
    } catch {
      return url;
    }
  };

  const getDomainIcon = (url: string): string => {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      
      // 主要サイト判定
      if (hostname.includes('wordpress') || hostname.includes('wp.')) return '📝';
      if (hostname.includes('wix')) return '🎨';
      if (hostname.includes('shopify')) return '🛒';
      if (hostname.includes('squarespace')) return '🏗️';
      if (hostname.includes('github')) return '💻';
      if (hostname.includes('notion')) return '📓';
      if (hostname.includes('medium')) return '📰';
      
      // 日本のドメイン
      if (hostname.endsWith('.jp')) return '🇯🇵';
      if (hostname.endsWith('.com')) return '🌐';
      
      return '🔗';
    } catch {
      return '🔗';
    }
  };

  const getTrustLevel = (url: string): 'high' | 'medium' | 'low' => {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      
      // 信頼度の高いサイト
      if (hostname.includes('gov.') || hostname.includes('edu.') || 
          hostname.includes('wikipedia') || hostname.includes('github.com')) {
        return 'high';
      }
      
      // 中程度
      if (hostname.endsWith('.jp') || hostname.endsWith('.com') || 
          hostname.endsWith('.org') || hostname.endsWith('.net')) {
        return 'medium';
      }
      
      return 'low';
    } catch {
      return 'low';
    }
  };

  const getTrustColor = (level: 'high' | 'medium' | 'low'): string => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-[var(--aio-primary)] bg-blue-50';
      case 'low': return 'text-yellow-600 bg-yellow-50';
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
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
            onClick={fetchTopSources}
            className="px-4 py-2 bg-[var(--aio-primary)] text-white rounded-md hover:bg-[var(--aio-primary-hover)] transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* フィルタ */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-1">
          {[
            { key: 'all' as const, label: '全体' },
            { key: 'widget' as const, label: 'Widget' },
            { key: 'iframe' as const, label: 'iframe' }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedFilter === filter.key
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        
        <div className="text-sm text-gray-500">
          過去{days}日間・上位{limit}サイト
        </div>
      </div>

      {/* サイト一覧 */}
      {sources.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          表示するデータがありません
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sources.map((source, index) => {
            const trustLevel = getTrustLevel(source.url);
            
            return (
              <div
                key={source.url}
                className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* ランキング */}
                <div className="flex-shrink-0 w-8 text-center">
                  <span className={`text-lg font-bold ${
                    index === 0 ? 'text-yellow-500' :
                    index === 1 ? 'text-gray-400' :
                    index === 2 ? 'text-orange-400' :
                    'text-gray-300'
                  }`}>
                    {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                  </span>
                </div>

                {/* サイト情報 */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xl">{getDomainIcon(source.url)}</span>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-900 hover:text-[var(--aio-primary)] transition-colors"
                    >
                      {formatUrl(source.url)}
                    </a>
                    <span className={`px-2 py-1 text-xs rounded ${getTrustColor(trustLevel)}`}>
                      {trustLevel === 'high' ? '高信頼' : trustLevel === 'medium' ? '中信頼' : '要注意'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {source.organizations.length > 0 && (
                      <span className="mr-4">
                        利用組織: {source.organizations.slice(0, 3).join(', ')}
                        {source.organizations.length > 3 && ` 他${source.organizations.length - 3}社`}
                      </span>
                    )}
                    <span>
                      初回: {new Date(source.firstSeen).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>

                {/* 統計 */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {source.count.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {source.percentage.toFixed(1)}%
                  </div>
                </div>

                {/* プログレスバー */}
                <div className="flex-shrink-0 w-16">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full progress-bar"
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 統計サマリー */}
      <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: 'ユニークサイト数',
            value: sources.length,
            color: 'text-[var(--aio-primary)]'
          },
          {
            label: '総埋め込み数',
            value: sources.reduce((sum, s) => sum + s.count, 0),
            color: 'text-green-600'
          },
          {
            label: '最多利用サイト',
            value: sources[0]?.count || 0,
            color: 'text-purple-600'
          },
          {
            label: '高信頼サイト',
            value: sources.filter(s => getTrustLevel(s.url) === 'high').length,
            color: 'text-orange-600'
          }
        ].map((stat, index) => (
          <div key={index} className="text-center">
            <div className={`text-xl font-bold ${stat.color}`}>
              {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
            </div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* アクション */}
      <div className="mt-6 flex space-x-3">
        <button 
          onClick={fetchTopSources}
          className="px-4 py-2 bg-[var(--aio-primary)] text-white rounded-md hover:bg-[var(--aio-primary-hover)] transition-colors"
        >
          更新
        </button>
        <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
          CSV エクスポート
        </button>
        <button className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors">
          不審サイト報告
        </button>
      </div>
    </div>
  );
}