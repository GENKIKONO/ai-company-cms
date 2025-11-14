'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  Calendar,
  BarChart3,
  Clock,
  Loader2
} from 'lucide-react';
import { 
  HIGCard,
  HIGCardHeader,
  HIGCardTitle,
  HIGCardContent
} from '@/components/ui/HIGCard';

interface ViolationStats {
  total_violations: number;
  violations_3y: number;
  violations_2y: number;
  violations_1y: number;
  violations_6m: number;
  high_violations_1y: number;
  last_violation_at: string | null;
  last_violation_rule: string | null;
}

interface EnforcementRecommendation {
  level: 'none' | 'warn' | 'suspend';
  reason: string;
  stats?: {
    total_violations: number;
    violations_1y: number;
    high_violations_1y: number;
    last_violation_rule: string;
  };
}

interface ViolationStatsData {
  user: {
    id: string;
    email: string;
    account_status: string;
  };
  violationStats: ViolationStats;
  recommendation: EnforcementRecommendation | null;
}

interface ViolationStatsPanelProps {
  userId: string | null;
  onRecommendationChange?: (recommendation: EnforcementRecommendation | null) => void;
}

export default function ViolationStatsPanel({ 
  userId, 
  onRecommendationChange 
}: ViolationStatsPanelProps) {
  const [data, setData] = useState<ViolationStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadViolationStats(userId);
    } else {
      setData(null);
      setError(null);
    }
  }, [userId]);

  useEffect(() => {
    if (onRecommendationChange) {
      onRecommendationChange(data?.recommendation || null);
    }
  }, [data?.recommendation, onRecommendationChange]);

  const loadViolationStats = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/enforcement/users/${id}/violations-summary`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '違反統計の取得に失敗しました');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '違反統計の取得に失敗しました');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationBadgeStyle = (level: string) => {
    switch (level) {
      case 'none':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warn':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suspend':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRecommendationIcon = (level: string) => {
    switch (level) {
      case 'none':
        return <Shield className="h-4 w-4" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4" />;
      case 'suspend':
        return <Clock className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  if (!userId) {
    return (
      <HIGCard>
        <HIGCardContent className="text-center py-8">
          <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">ユーザーを選択してください</p>
        </HIGCardContent>
      </HIGCard>
    );
  }

  if (loading) {
    return (
      <HIGCard>
        <HIGCardContent className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">違反統計を読み込み中...</p>
        </HIGCardContent>
      </HIGCard>
    );
  }

  if (error) {
    return (
      <HIGCard>
        <HIGCardContent className="text-center py-8">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 mb-2">{error}</p>
          <button 
            onClick={() => userId && loadViolationStats(userId)}
            className="text-sm text-primary hover:underline"
          >
            再読み込み
          </button>
        </HIGCardContent>
      </HIGCard>
    );
  }

  if (!data) {
    return (
      <HIGCard>
        <HIGCardContent className="text-center py-8">
          <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">データが見つかりません</p>
        </HIGCardContent>
      </HIGCard>
    );
  }

  const { violationStats, recommendation } = data;

  return (
    <HIGCard>
      <HIGCardHeader>
        <HIGCardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          違反統計 & 推奨制裁レベル
        </HIGCardTitle>
      </HIGCardHeader>
      <HIGCardContent>
        <div className="space-y-6">
          {/* 推奨制裁レベル */}
          {recommendation && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">推奨制裁レベル</h4>
                <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center gap-1 ${getRecommendationBadgeStyle(recommendation.level)}`}>
                  {getRecommendationIcon(recommendation.level)}
                  {recommendation.level.toUpperCase()}
                </div>
              </div>
              <p className="text-sm text-gray-700">{recommendation.reason}</p>
            </div>
          )}

          {/* 違反統計グリッド */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{violationStats.total_violations}</div>
              <div className="text-xs text-blue-700">総違反数</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{violationStats.violations_1y}</div>
              <div className="text-xs text-green-700">過去12ヶ月</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{violationStats.violations_6m}</div>
              <div className="text-xs text-yellow-700">過去6ヶ月</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{violationStats.high_violations_1y}</div>
              <div className="text-xs text-orange-700">重大違反(1年)</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{violationStats.violations_2y}</div>
              <div className="text-xs text-purple-700">過去2年</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{violationStats.violations_3y}</div>
              <div className="text-xs text-gray-700">過去3年</div>
            </div>
          </div>

          {/* 最新違反情報 */}
          {violationStats.last_violation_at && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                最新違反
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>
                  日時: {new Date(violationStats.last_violation_at).toLocaleString('ja-JP')}
                </div>
                {violationStats.last_violation_rule && (
                  <div>
                    ルール: {violationStats.last_violation_rule}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </HIGCardContent>
    </HIGCard>
  );
}