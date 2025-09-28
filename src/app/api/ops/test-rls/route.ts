/**
 * RLS Policy Test API
 * Row Level Security ポリシーの自動テスト実行
 */

import { NextRequest, NextResponse } from 'next/server';
import { RLSTestRunner, formatRLSTestResults } from '@/lib/testing/rls-test-suite';
import { requireAdminAuth } from '@/lib/auth/admin-auth';

export async function POST(request: NextRequest) {
  try {
    // Admin権限チェック (development mode skip)
    if (process.env.NODE_ENV === 'production') {
      const adminCheck = await requireAdminAuth(request);
      if (!adminCheck.success) {
        return NextResponse.json({
          error: adminCheck.error,
        }, { status: 401 });
      }
    }

    // 環境変数チェック
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        error: 'Missing required environment variables',
        details: 'SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are required'
      }, { status: 500 });
    }

    // リクエストボディからオプション取得
    const body = await request.json().catch(() => ({}));
    const { cleanup = true, format = 'json' } = body;

    // RLSテスト実行
    const testRunner = new RLSTestRunner({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    });

    console.log('🔒 Starting RLS Policy Tests...');
    const startTime = Date.now();
    
    const results = await testRunner.runAllTests();
    
    // クリーンアップ実行
    if (cleanup) {
      console.log('🧹 Cleaning up test data...');
      await testRunner.cleanup();
    }

    const totalTime = Date.now() - startTime;
    
    console.log(`✅ RLS Tests completed in ${totalTime}ms`);
    console.log(`📊 Results: ${results.passedTests}/${results.totalTests} passed (${results.successRate.toFixed(1)}%)`);

    // フォーマット別レスポンス
    if (format === 'markdown') {
      const markdownReport = formatRLSTestResults(results);
      return new NextResponse(markdownReport, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': 'attachment; filename="rls-test-results.md"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalTests: results.totalTests,
        passedTests: results.passedTests,
        failedTests: results.failedTests,
        errorTests: results.errorTests,
        successRate: results.successRate,
        executionTime: totalTime,
      },
      results: results.results,
      failedResults: results.failedResults,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ RLS Test Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'RLS test execution failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Admin権限チェック (development mode skip)
    if (process.env.NODE_ENV === 'production') {
      const adminCheck = await requireAdminAuth(request);
      if (!adminCheck.success) {
        return NextResponse.json({
          error: adminCheck.error,
        }, { status: 401 });
      }
    }

    return NextResponse.json({
      message: 'RLS Policy Test Endpoint',
      usage: {
        'POST /api/ops/test-rls': 'Run RLS policy tests',
        'Parameters': {
          'cleanup': 'boolean - Whether to cleanup test data after testing (default: true)',
          'format': 'string - Response format: "json" or "markdown" (default: "json")',
        },
        'Response': {
          'json': 'Detailed test results in JSON format',
          'markdown': 'Formatted markdown report for download',
        },
      },
      status: 'Ready',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to get RLS test endpoint info',
      message: error.message,
    }, { status: 500 });
  }
}