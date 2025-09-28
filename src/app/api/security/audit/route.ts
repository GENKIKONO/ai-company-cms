/**
 * Security Audit API
 * セキュリティ監査実行エンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { runSecurityAudit, generateSecurityReport } from '@/lib/security/audit';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';
    
    // Admin 認証チェック（基本認証）
    const authHeader = request.headers.get('authorization');
    if (!isValidAdminAuth(authHeader)) {
      return NextResponse.json(
        { error: 'Unauthorized access to security audit' },
        { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Security Audit"' } }
      );
    }

    console.log('🔐 Starting security audit...');
    const auditResult = await runSecurityAudit(request);
    
    // ログ出力
    console.log(`🔐 Security audit completed: Score ${auditResult.score}/100`);
    if (!auditResult.passed) {
      console.warn('⚠️ Security audit failed - critical issues detected');
    }

    // Markdown形式での出力
    if (format === 'markdown') {
      const markdown = generateSecurityReport(auditResult);
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': 'attachment; filename="security-audit.md"',
        },
      });
    }

    // JSON形式での出力
    return NextResponse.json(auditResult, {
      status: auditResult.passed ? 200 : 206, // 206 = Partial Content (警告あり)
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('❌ Security audit error:', error);
    
    return NextResponse.json({
      error: 'Security audit failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

/**
 * 管理者認証チェック
 */
function isValidAdminAuth(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  try {
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');
    
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_OPS_PASSWORD;
    
    return email === adminEmail && password === adminPassword;
  } catch {
    return false;
  }
}

/**
 * セキュリティ監査のスケジュール実行（POST）
 */
export async function POST(request: NextRequest) {
  try {
    // Admin 認証チェック
    const authHeader = request.headers.get('authorization');
    if (!isValidAdminAuth(authHeader)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action = 'run' } = body;

    if (action === 'run') {
      // 監査実行
      const auditResult = await runSecurityAudit(request);
      
      // 重大な問題がある場合はアラート
      if (auditResult.summary.critical > 0) {
        console.error('🚨 CRITICAL SECURITY ISSUES DETECTED:');
        auditResult.checks
          .filter(c => c.severity === 'critical' && !c.passed)
          .forEach(check => {
            console.error(`  - ${check.name}: ${check.message}`);
          });
      }

      return NextResponse.json({
        success: true,
        message: 'Security audit completed',
        summary: auditResult.summary,
        score: auditResult.score,
        passed: auditResult.passed,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Security audit POST error:', error);
    
    return NextResponse.json({
      error: 'Security audit failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}