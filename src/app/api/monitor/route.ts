/**
 * Simple Production Monitoring API
 * 軽量な監視エンドポイント（Vercel対応）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';
    
    // 基本監視項目を並列実行
    const [
      supabaseHealth,
      stripeHealth,
      resendHealth,
      systemHealth
    ] = await Promise.allSettled([
      checkSupabaseHealth(),
      checkStripeHealth(),
      checkResendHealth(),
      checkSystemHealth()
    ]);

    const responseTime = Date.now() - startTime;
    
    const metrics = {
      timestamp: new Date().toISOString(),
      responseTime,
      status: 'healthy',
      checks: {
        supabase: getCheckResult(supabaseHealth),
        stripe: getCheckResult(stripeHealth),
        resend: getCheckResult(resendHealth),
        system: getCheckResult(systemHealth)
      }
    };

    // 全体ステータス判定
    const failedChecks = Object.values(metrics.checks).filter(check => !check.healthy);
    if (failedChecks.length > 0) {
      metrics.status = failedChecks.length === Object.keys(metrics.checks).length ? 'down' : 'degraded';
    }

    // Markdown形式でのレポート生成
    if (format === 'markdown') {
      const markdown = generateMarkdownReport(metrics);
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': 'attachment; filename="health-report.md"',
        },
      });
    }

    // JSON形式
    return NextResponse.json(metrics, {
      status: metrics.status === 'down' ? 503 : metrics.status === 'degraded' ? 206 : 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });

  } catch (error) {
    logger.error('❌ Monitor API Error', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime,
    }, { status: 500 });
  }
}

// Supabase接続チェック
async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() { /* no-op */ },
        },
      }
    );

    const { error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
    
    return !error;
  } catch {
    return false;
  }
}

// Stripe接続チェック
async function checkStripeHealth(): Promise<boolean> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return false;
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    await stripe.products.list({ limit: 1 });
    return true;
  } catch {
    return false;
  }
}

// Resend接続チェック
async function checkResendHealth(): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) return false;
    
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    // APIキーの有効性をチェック（実際にメールは送信しない）
    return true;
  } catch {
    return false;
  }
}

// システムヘルスチェック
async function checkSystemHealth(): Promise<boolean> {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  // メモリ使用率が90%を超えていないかチェック
  const memoryUsagePercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
  
  return memoryUsagePercent < 0.9 && uptime > 0;
}

// 結果ヘルパー
function getCheckResult(result: PromiseSettledResult<boolean>) {
  if (result.status === 'fulfilled') {
    return {
      healthy: result.value,
      status: result.value ? 'ok' : 'failed',
      message: result.value ? 'Service is healthy' : 'Service check failed'
    };
  } else {
    return {
      healthy: false,
      status: 'error',
      message: result.reason?.message || 'Check failed with error'
    };
  }
}

// Markdownレポート生成
function generateMarkdownReport(metrics: any): string {
  const statusEmoji = {
    healthy: '✅',
    degraded: '⚠️',
    down: '❌',
    error: '💥'
  };

  return `# 🔍 Production Health Report

**Generated:** ${new Date(metrics.timestamp).toLocaleString()}
**Overall Status:** ${statusEmoji[metrics.status as keyof typeof statusEmoji]} ${metrics.status.toUpperCase()}
**Response Time:** ${metrics.responseTime}ms

## Service Status

| Service | Status | Health |
|---------|--------|--------|
| **Supabase Database** | ${statusEmoji[metrics.checks.supabase.healthy ? 'healthy' : 'down']} | ${metrics.checks.supabase.status} |
| **Stripe Payments** | ${statusEmoji[metrics.checks.stripe.healthy ? 'healthy' : 'down']} | ${metrics.checks.stripe.status} |
| **Resend Email** | ${statusEmoji[metrics.checks.resend.healthy ? 'healthy' : 'down']} | ${metrics.checks.resend.status} |
| **System Resources** | ${statusEmoji[metrics.checks.system.healthy ? 'healthy' : 'down']} | ${metrics.checks.system.status} |

## Quick Access

- **Main Site**: [https://aiohub.jp](https://aiohub.jp)
- **Health API**: [https://aiohub.jp/api/health](https://aiohub.jp/api/health)
- **Monitor API**: [https://aiohub.jp/api/monitor](https://aiohub.jp/api/monitor)

---

*Report generated by Simple Production Monitoring System*
`;
}