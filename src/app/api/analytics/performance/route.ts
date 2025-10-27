/**
 * パフォーマンス分析API (I2)
 * Web Vitals とユーザー体験データの収集
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
// 認証は動的インポートで処理

interface PerformanceData {
  webVitals: {
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
  };
  webVitalsScore: {
    score: number;
    rating: 'good' | 'needs-improvement' | 'poor';
  };
  resources: {
    totalCount: number;
    totalSize: number;
    totalDuration: number;
    byType: Record<string, { count: number; size: number; duration: number }>;
  };
  interactions: {
    totalInteractions: number;
    mostInteracted: Array<{ target: string; count: number }>;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  } | null;
  timestamp: number;
  // 追加のコンテキスト情報
  page?: string;
  userAgent?: string;
  connectionType?: string;
  deviceMemory?: number;
}

export async function POST(request: NextRequest) {
  try {
    // パフォーマンスデータの収集は認証不要（匿名データ）
    let userId: string | undefined;
    try {
      const { getCurrentUser } = await import('@/lib/auth');
      const user = await getCurrentUser();
      userId = user?.id;
    } catch {
      // 認証エラーは無視（匿名データとして処理）
      userId = undefined;
    }

    const data: PerformanceData = await request.json();

    // データ検証
    if (!data.timestamp || typeof data.timestamp !== 'number') {
      return NextResponse.json(
        { error: 'Invalid timestamp' },
        { status: 400 }
      );
    }

    // 環境情報の取得
    const userAgent = request.headers.get('User-Agent') || '';
    const page = request.headers.get('Referer') || data.page || '';

    // パフォーマンスデータの集計・保存は環境に応じて実装
    // 本実装では基本的な検証と応答のみ
    
    // Web Vitals スコア判定
    const { webVitalsScore } = data;
    
    // パフォーマンス問題の検出
    const issues = detectPerformanceIssues(data);

    // 推奨事項の生成
    const recommendations = generateRecommendations(data);

    // ログ出力（本番環境では構造化ログに送信）
    if (issues.length > 0) {
      console.warn('Performance issues detected:', {
        page,
        userId,
        score: webVitalsScore.score,
        rating: webVitalsScore.rating,
        issues: issues.map(i => i.type),
        timestamp: new Date(data.timestamp).toISOString()
      });
    } else {
      console.info('Performance data received:', {
        page,
        userId,
        score: webVitalsScore.score,
        rating: webVitalsScore.rating,
        timestamp: new Date(data.timestamp).toISOString()
      });
    }

    // Slack通知（重大なパフォーマンス問題時）
    if (issues.some(issue => issue.severity === 'critical')) {
      await notifyPerformanceIssues(page, issues, data);
    }

    return NextResponse.json({
      success: true,
      message: 'Performance data recorded',
      analysis: {
        score: webVitalsScore.score,
        rating: webVitalsScore.rating,
        issues,
        recommendations
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Performance API error', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to process performance data'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // パフォーマンス統計の取得（認証必要）
    let user;
    try {
      const { getCurrentUser } = await import('@/lib/auth');
      user = await getCurrentUser();
    } catch {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '24h';
    const page = searchParams.get('page');

    // 簡易的な統計データ（実際の実装では外部ストレージから取得）
    const stats = generateMockStats(period, page);

    return NextResponse.json({
      data: stats,
      period,
      page,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Performance stats API error', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to fetch performance stats'
      },
      { status: 500 }
    );
  }
}

/**
 * パフォーマンス問題の検出
 */
function detectPerformanceIssues(data: PerformanceData): Array<{
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value?: number;
  threshold?: number;
}> {
  const issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    value?: number;
    threshold?: number;
  }> = [];
  const { webVitals, resources, memory } = data;

  // LCP (Largest Contentful Paint) チェック
  if (webVitals.lcp) {
    if (webVitals.lcp > 4000) {
      issues.push({
        type: 'lcp_poor',
        severity: 'high' as const,
        message: 'Largest Contentful Paint is too slow',
        value: webVitals.lcp,
        threshold: 2500
      });
    } else if (webVitals.lcp > 2500) {
      issues.push({
        type: 'lcp_needs_improvement',
        severity: 'medium' as const,
        message: 'Largest Contentful Paint needs improvement',
        value: webVitals.lcp,
        threshold: 2500
      });
    }
  }

  // FID (First Input Delay) チェック
  if (webVitals.fid) {
    if (webVitals.fid > 300) {
      issues.push({
        type: 'fid_poor',
        severity: 'high' as const,
        message: 'First Input Delay is too high',
        value: webVitals.fid,
        threshold: 100
      });
    } else if (webVitals.fid > 100) {
      issues.push({
        type: 'fid_needs_improvement',
        severity: 'medium' as const,
        message: 'First Input Delay needs improvement',
        value: webVitals.fid,
        threshold: 100
      });
    }
  }

  // CLS (Cumulative Layout Shift) チェック
  if (webVitals.cls) {
    if (webVitals.cls > 0.25) {
      issues.push({
        type: 'cls_poor',
        severity: 'high' as const,
        message: 'Cumulative Layout Shift is too high',
        value: webVitals.cls,
        threshold: 0.1
      });
    } else if (webVitals.cls > 0.1) {
      issues.push({
        type: 'cls_needs_improvement',
        severity: 'medium' as const,
        message: 'Cumulative Layout Shift needs improvement',
        value: webVitals.cls,
        threshold: 0.1
      });
    }
  }

  // リソースサイズチェック
  if (resources.totalSize > 5 * 1024 * 1024) { // 5MB
    issues.push({
      type: 'large_bundle_size',
      severity: 'medium' as const,
      message: 'Total resource size is too large',
      value: resources.totalSize,
      threshold: 3 * 1024 * 1024
    });
  }

  // リソース数チェック
  if (resources.totalCount > 100) {
    issues.push({
      type: 'too_many_resources',
      severity: 'medium' as const,
      message: 'Too many resources loaded',
      value: resources.totalCount,
      threshold: 50
    });
  }

  // メモリ使用量チェック
  if (memory && memory.percentage > 80) {
    issues.push({
      type: 'high_memory_usage',
      severity: memory.percentage > 90 ? 'critical' as const : 'high' as const,
      message: 'High memory usage detected',
      value: memory.percentage,
      threshold: 70
    });
  }

  return issues;
}

/**
 * パフォーマンス改善推奨事項の生成
 */
function generateRecommendations(data: PerformanceData): Array<{
  type: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  impact: string;
}> {
  const recommendations: Array<{
    type: string;
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    impact: string;
  }> = [];
  const { webVitals, resources } = data;

  // LCP改善推奨
  if (webVitals.lcp && webVitals.lcp > 2500) {
    recommendations.push({
      type: 'optimize_lcp',
      priority: webVitals.lcp > 4000 ? 'high' as const : 'medium' as const,
      title: 'Optimize Largest Contentful Paint',
      description: '画像の最適化、重要なリソースのプリロード、サーバーレスポンス時間の改善を検討してください',
      impact: 'ページ読み込み体験の大幅改善'
    });
  }

  // 画像最適化推奨
  const imageResources = Object.entries(resources.byType).find(([type]) => type === 'image');
  if (imageResources && imageResources[1].size > 1024 * 1024) { // 1MB
    recommendations.push({
      type: 'optimize_images',
      priority: 'high' as const,
      title: 'Optimize Images',
      description: 'WebP/AVIF形式の使用、適切なサイズへのリサイズ、遅延読み込みの実装を検討してください',
      impact: 'ページサイズとLCPの改善'
    });
  }

  // バンドルサイズ最適化推奨
  if (resources.totalSize > 3 * 1024 * 1024) { // 3MB
    recommendations.push({
      type: 'reduce_bundle_size',
      priority: 'medium' as const,
      title: 'Reduce Bundle Size',
      description: 'コード分割、未使用コードの削除、圧縮の改善を検討してください',
      impact: 'ページ読み込み速度の改善'
    });
  }

  // キャッシュ最適化推奨
  recommendations.push({
    type: 'optimize_caching',
    priority: 'medium' as const,
    title: 'Optimize Caching Strategy',
    description: 'ブラウザキャッシュ、CDNキャッシュ、Service Workerの活用を検討してください',
    impact: 'リピート訪問時のパフォーマンス改善'
  });

  return recommendations;
}

/**
 * 重大なパフォーマンス問題をSlackに通知
 */
async function notifyPerformanceIssues(
  page: string, 
  issues: Array<{ type: string; severity: string; message: string; value?: number }>,
  data: PerformanceData
) {
  try {
    const { slackNotifier } = await import('@/lib/utils/slack-notifier');
    
    const criticalIssues = issues.filter(issue => issue.severity === 'critical');
    
    await slackNotifier.notifyPerformanceAlert({
      page,
      issues: criticalIssues,
      score: data.webVitalsScore.score,
      rating: data.webVitalsScore.rating,
      timestamp: new Date(data.timestamp).toISOString()
    });
  } catch (error) {
    logger.error('Failed to send Slack notification', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * モック統計データ生成（実際の実装では外部ストレージから取得）
 */
function generateMockStats(period: string, page?: string | null) {
  return {
    summary: {
      averageLCP: 2100 + Math.random() * 1000,
      averageFID: 80 + Math.random() * 50,
      averageCLS: 0.05 + Math.random() * 0.1,
      averageScore: 75 + Math.random() * 20,
      totalPageViews: Math.floor(Math.random() * 10000) + 1000
    },
    trends: {
      scores: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        score: 70 + Math.random() * 30
      }))
    },
    topIssues: [
      { type: 'lcp_poor', count: Math.floor(Math.random() * 100) },
      { type: 'cls_needs_improvement', count: Math.floor(Math.random() * 80) },
      { type: 'large_bundle_size', count: Math.floor(Math.random() * 60) }
    ],
    recommendations: [
      {
        type: 'optimize_images',
        priority: 'high',
        estimatedImpact: '15-25% LCP improvement'
      },
      {
        type: 'reduce_bundle_size',
        priority: 'medium',
        estimatedImpact: '10-15% load time improvement'
      }
    ]
  };
}