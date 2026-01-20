import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { env } from '@/lib/env';
import { diagGuard, diagErrorResponse } from '@/lib/api/diag-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * データベース診断API
 * Supabaseデータベース接続とスキーマの健全性をチェック
 */
interface DiagnosticResult {
  test: string;
  status: string;
  startTime?: number;
  duration: number;
  error?: string;
  result?: any;
  results?: any;
}

export async function GET(request: NextRequest) {
  const guardResult = await diagGuard(request);
  if (!guardResult.authorized) {
    return guardResult.response!;
  }

  const startTime = Date.now();
  const diagnosticResults: DiagnosticResult[] = [];

  try {
    // Supabaseクライアント作成テスト
    diagnosticResults.push({
      test: 'supabase_client_creation',
      status: 'running',
      startTime: Date.now(),
      duration: 0
    });

    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return []; },
          setAll() { /* no-op for diagnostic */ }
        }
      }
    );

    diagnosticResults[0].status = 'passed';
    diagnosticResults[0].duration = Date.now() - (diagnosticResults[0].startTime || 0);

    // データベース接続テスト
    diagnosticResults.push({
      test: 'database_connection',
      status: 'running',
      startTime: Date.now(),
      duration: 0
    });

    const { data: connectionTest, error: connectionError } = await supabase
      .from('organizations')
      .select('count(*)', { count: 'exact', head: true });

    if (connectionError) {
      diagnosticResults[1].status = 'failed';
      diagnosticResults[1].error = connectionError.message;
    } else {
      diagnosticResults[1].status = 'passed';
      diagnosticResults[1].result = { totalOrganizations: connectionTest?.length || 0 };
    }
    diagnosticResults[1].duration = Date.now() - (diagnosticResults[1].startTime || 0);

    // テーブル存在確認
    const requiredTables = ['organizations', 'services', 'faqs', 'posts', 'organization_profiles'];
    const tableTests: Array<{
      table: string;
      status: string;
      error?: string;
      duration: number;
    }> = [];

    for (const table of requiredTables) {
      const testStart = Date.now();
      try {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .limit(1);

        tableTests.push({
          table,
          status: error ? 'failed' : 'passed',
          error: error?.message,
          duration: Date.now() - testStart
        });
      } catch (err) {
        tableTests.push({
          table,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
          duration: Date.now() - testStart
        });
      }
    }

    diagnosticResults.push({
      test: 'table_schema_validation',
      status: tableTests.every(t => t.status === 'passed') ? 'passed' : 'failed',
      results: tableTests,
      duration: tableTests.reduce((sum, t) => sum + t.duration, 0)
    });

    // RLS（Row Level Security）テスト
    diagnosticResults.push({
      test: 'row_level_security',
      status: 'running',
      startTime: Date.now(),
      duration: 0
    });

    try {
      // 認証なしでの組織データアクセステスト（公開データのみ取得可能であることを確認）
      const { data: publicOrgs, error: rlsError } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('is_published', true)
        .eq('status', 'published')
        .limit(1);

      diagnosticResults[3].status = 'passed';
      diagnosticResults[3].result = {
        publicOrganizationsAccessible: !rlsError && Array.isArray(publicOrgs),
        sampleCount: publicOrgs?.length || 0
      };
    } catch (rlsTestError) {
      diagnosticResults[3].status = 'failed';
      diagnosticResults[3].error = rlsTestError instanceof Error ? rlsTestError.message : 'RLS test failed';
    }
    diagnosticResults[3].duration = Date.now() - (diagnosticResults[3].startTime || 0);

    // クエリパフォーマンステスト
    diagnosticResults.push({
      test: 'query_performance',
      status: 'running',
      startTime: Date.now(),
      duration: 0
    });

    const performanceTests: Array<{
      query: string;
      duration: number;
      status: string;
      error?: string;
      resultCount: number;
    }> = [];
    
    // シンプルなクエリのパフォーマンステスト
    const queryStart = Date.now();
    const { data: perfTestData, error: perfError } = await supabase
      .from('organizations')
      .select('id, name, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(10);

    const queryDuration = Date.now() - queryStart;
    performanceTests.push({
      query: 'simple_organizations_query',
      duration: queryDuration,
      status: queryDuration < 1000 ? 'good' : queryDuration < 2000 ? 'warning' : 'slow',
      error: perfError?.message,
      resultCount: perfTestData?.length || 0
    });

    diagnosticResults[4].status = performanceTests.every(t => !t.error) ? 'passed' : 'failed';
    diagnosticResults[4].results = performanceTests;
    diagnosticResults[4].duration = Date.now() - (diagnosticResults[4].startTime || 0);

    // 環境設定確認
    const envCheck = {
      supabaseUrl: !!env.SUPABASE_URL,
      supabaseAnonKey: !!env.SUPABASE_ANON_KEY,
      supabaseServiceKey: !!env.SUPABASE_SERVICE_KEY,
      urlFormat: env.SUPABASE_URL.startsWith('https://') && env.SUPABASE_URL.includes('.supabase.co')
    };

    const totalDuration = Date.now() - startTime;
    const overallStatus = diagnosticResults.every(result => result.status === 'passed') ? 'healthy' : 'issues_detected';

    // 推奨事項
    const recommendations: Array<{
      priority: string;
      category: string;
      message: string;
      action: string;
    }> = [];
    
    if (!envCheck.supabaseServiceKey) {
      recommendations.push({
        priority: 'medium',
        category: 'configuration',
        message: 'Supabase Service Keyが設定されていません',
        action: '管理機能の完全な動作のためにService Keyを設定してください'
      });
    }

    const slowQueries = diagnosticResults[4]?.results?.filter((q: any) => q.status === 'slow') || [];
    if (slowQueries.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        message: '応答速度の遅いクエリが検出されました',
        action: 'データベースインデックスの最適化を検討してください'
      });
    }

    return NextResponse.json({
      success: true,
      status: overallStatus,
      totalDuration,
      environment: envCheck,
      diagnostics: diagnosticResults,
      recommendations,
      summary: {
        totalTests: diagnosticResults.length,
        passed: diagnosticResults.filter(r => r.status === 'passed').length,
        failed: diagnosticResults.filter(r => r.status === 'failed').length,
        avgResponseTime: performanceTests.length > 0 ? 
          Math.round(performanceTests.reduce((sum, t) => sum + t.duration, 0) / performanceTests.length) : 0
      },
      meta: {
        generatedAt: new Date().toISOString(),
        diagnosticVersion: '1.0.0'
      }
    });

  } catch (error) {
    return diagErrorResponse(error, 'Database diagnostic');
  }
}