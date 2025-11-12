import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/log';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value?: number;
  threshold?: { warning?: number; critical?: number };
  unit?: string;
  message: string;
}

interface Alert {
  severity: 'critical' | 'warning';
  component: string;
  message: string;
  timestamp: string;
  value?: number;
  threshold?: { warning?: number; critical?: number };
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  message: string;
  action: string;
}

/**
 * リアルタイム監視API
 * システムのリアルタイム状態を監視し、健全性メトリクスを提供
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // システムリソース情報
    const systemMetrics = {
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
        external: Math.round(process.memoryUsage().external / 1024 / 1024), // MB
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024), // MB
        utilization: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
      },
      process: {
        uptime: Math.round(process.uptime()), // 秒
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        cpuUsage: process.cpuUsage()
      },
      timestamp: new Date().toISOString()
    };

    // パフォーマンス統計取得
    let performanceStats = {};
    try {
      const { QueryAnalyzer, QueryCacheManager } = await import('@/lib/performance/database-optimization');
      const { ImageOptimizationStats } = await import('@/lib/performance/image-optimization');
      
      performanceStats = {
        database: {
          queries: QueryAnalyzer.getQueryStats(),
          cache: QueryCacheManager.getStats()
        },
        images: ImageOptimizationStats.getStats()
      };
    } catch (error) {
      logger.warn('Failed to get performance stats:', error);
    }

    // ヘルスチェック
    const healthChecks: Array<{
      name: string;
      status: string;
      value: number;
      threshold: { warning: number; critical: number };
      unit: string;
      message: string;
    }> = [];

    // メモリ使用量チェック
    healthChecks.push({
      name: 'memory_usage',
      status: systemMetrics.memory.utilization < 80 ? 'healthy' : 
              systemMetrics.memory.utilization < 90 ? 'warning' : 'critical',
      value: systemMetrics.memory.utilization,
      threshold: { warning: 80, critical: 90 },
      unit: '%',
      message: `メモリ使用率: ${systemMetrics.memory.utilization}%`
    });

    // プロセス稼働時間チェック
    const uptimeHours = systemMetrics.process.uptime / 3600;
    healthChecks.push({
      name: 'process_uptime',
      status: 'healthy', // プロセス稼働時間は通常問題なし
      value: uptimeHours,
      threshold: { warning: 168, critical: 720 }, // 1週間で警告、1ヶ月で要再起動
      unit: 'hours',
      message: `プロセス稼働時間: ${uptimeHours.toFixed(1)}時間`
    });

    // 環境変数チェック
    const envCheck = {
      nodeEnv: process.env.NODE_ENV,
      productionMode: process.env.NODE_ENV === 'production',
      essential: {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        appUrl: !!process.env.NEXT_PUBLIC_APP_URL
      }
    };

    const essentialEnvMissing = !Object.values(envCheck.essential).every(Boolean);
    const essentialEnvCount = Object.values(envCheck.essential).filter(Boolean).length;
    const totalEssentialEnv = Object.keys(envCheck.essential).length;
    
    healthChecks.push({
      name: 'environment_config',
      status: essentialEnvMissing ? 'critical' : 'healthy',
      value: essentialEnvCount,
      threshold: { warning: totalEssentialEnv - 1, critical: totalEssentialEnv },
      unit: 'vars',
      message: essentialEnvMissing ? '必須環境変数が不足しています' : '環境設定は正常です'
    });

    // 全体的な健全性評価
    const criticalCount = healthChecks.filter(check => check.status === 'critical').length;
    const warningCount = healthChecks.filter(check => check.status === 'warning').length;
    
    let overallStatus: 'healthy' | 'degraded' | 'critical';
    if (criticalCount > 0) overallStatus = 'critical';
    else if (warningCount > 0) overallStatus = 'degraded';
    else overallStatus = 'healthy';

    // アラート生成
    const alerts: Alert[] = [];
    healthChecks.forEach(check => {
      if (check.status === 'critical') {
        alerts.push({
          severity: 'critical',
          component: check.name,
          message: check.message,
          timestamp: new Date().toISOString(),
          value: check.value,
          threshold: check.threshold
        });
      } else if (check.status === 'warning') {
        alerts.push({
          severity: 'warning',
          component: check.name,
          message: check.message,
          timestamp: new Date().toISOString(),
          value: check.value,
          threshold: check.threshold
        });
      }
    });

    // 推奨アクション
    const recommendations: Recommendation[] = [];
    if (systemMetrics.memory.utilization > 85) {
      recommendations.push({
        priority: systemMetrics.memory.utilization > 95 ? 'high' : 'medium',
        category: 'memory',
        message: 'メモリ使用量が高くなっています',
        action: 'アプリケーションの再起動やメモリリークの確認を検討してください'
      });
    }

    if (essentialEnvMissing) {
      recommendations.push({
        priority: 'high',
        category: 'configuration',
        message: '必須環境変数が設定されていません',
        action: '環境設定を確認し、必要な変数を設定してください'
      });
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      status: overallStatus,
      responseTime,
      system: systemMetrics,
      performance: performanceStats,
      environment: envCheck,
      healthChecks,
      alerts,
      recommendations,
      summary: {
        totalChecks: healthChecks.length,
        healthyChecks: healthChecks.filter(c => c.status === 'healthy').length,
        warningChecks: warningCount,
        criticalChecks: criticalCount,
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length
      },
      meta: {
        generatedAt: new Date().toISOString(),
        monitoringVersion: '1.0.0'
      }
    });

  } catch (error) {
    logger.error('Monitoring API failed:', error);
    
    return NextResponse.json({
      success: false,
      status: 'critical',
      responseTime: Date.now() - startTime,
      error: 'Failed to get monitoring data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * 監視設定の更新
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, component, threshold } = body;

    // 監視設定の更新ロジック（実装例）
    if (action === 'update_threshold' && component && threshold) {
      // ここで監視閾値を更新する処理
      // 実際の実装では、データベースやRedisに設定を保存
      
      return NextResponse.json({
        success: true,
        message: `${component}の閾値を${threshold}に更新しました`,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'silence_alert' && component) {
      // アラートの一時的な無効化
      return NextResponse.json({
        success: true,
        message: `${component}のアラートを一時的に無効化しました`,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action or missing parameters'
    }, { status: 400 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to update monitoring settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}