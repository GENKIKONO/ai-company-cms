import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * セキュリティ診断API
 * アプリケーションのセキュリティ設定と脆弱性をチェック
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const headersList = await headers();
    const requestHeaders = Object.fromEntries(headersList.entries());

    // セキュリティヘッダーチェック
    const securityHeaders = {
      'x-frame-options': requestHeaders['x-frame-options'] || null,
      'x-content-type-options': requestHeaders['x-content-type-options'] || null,
      'referrer-policy': requestHeaders['referrer-policy'] || null,
      'x-dns-prefetch-control': requestHeaders['x-dns-prefetch-control'] || null,
      'strict-transport-security': requestHeaders['strict-transport-security'] || null,
      'content-security-policy': requestHeaders['content-security-policy'] || null
    };

    const securityHeadersAssessment = {
      score: 0,
      maxScore: 6,
      checks: [
        {
          header: 'X-Frame-Options',
          present: !!securityHeaders['x-frame-options'],
          value: securityHeaders['x-frame-options'],
          recommendation: securityHeaders['x-frame-options'] ? 'Configured' : 'Set to DENY or SAMEORIGIN'
        },
        {
          header: 'X-Content-Type-Options',
          present: !!securityHeaders['x-content-type-options'],
          value: securityHeaders['x-content-type-options'],
          recommendation: securityHeaders['x-content-type-options'] ? 'Configured' : 'Set to nosniff'
        },
        {
          header: 'Referrer-Policy',
          present: !!securityHeaders['referrer-policy'],
          value: securityHeaders['referrer-policy'],
          recommendation: securityHeaders['referrer-policy'] ? 'Configured' : 'Set appropriate policy'
        },
        {
          header: 'X-DNS-Prefetch-Control',
          present: !!securityHeaders['x-dns-prefetch-control'],
          value: securityHeaders['x-dns-prefetch-control'],
          recommendation: securityHeaders['x-dns-prefetch-control'] ? 'Configured' : 'Set to on or off'
        },
        {
          header: 'Strict-Transport-Security',
          present: !!securityHeaders['strict-transport-security'],
          value: securityHeaders['strict-transport-security'],
          recommendation: securityHeaders['strict-transport-security'] ? 'Configured' : 'Enable HSTS for HTTPS'
        },
        {
          header: 'Content-Security-Policy',
          present: !!securityHeaders['content-security-policy'],
          value: securityHeaders['content-security-policy'],
          recommendation: securityHeaders['content-security-policy'] ? 'Configured' : 'Implement CSP'
        }
      ]
    };

    securityHeadersAssessment.score = securityHeadersAssessment.checks.filter(check => check.present).length;

    // 環境変数セキュリティチェック
    const envSecurityCheck = {
      score: 0,
      maxScore: 5,
      checks: [
        {
          check: 'ADMIN_EMAIL_SET',
          status: !!env.ADMIN_EMAIL,
          recommendation: env.ADMIN_EMAIL ? 'Admin email configured' : 'Set admin email for notifications'
        },
        {
          check: 'ADMIN_OPS_PASSWORD_LENGTH',
          status: env.ADMIN_OPS_PASSWORD && env.ADMIN_OPS_PASSWORD.length >= 20,
          recommendation: env.ADMIN_OPS_PASSWORD && env.ADMIN_OPS_PASSWORD.length >= 20 ? 
            'Strong ops password' : 'Use password ≥20 characters'
        },
        {
          check: 'SUPABASE_SERVICE_KEY_SET',
          status: !!env.SUPABASE_SERVICE_KEY,
          recommendation: env.SUPABASE_SERVICE_KEY ? 'Service key configured' : 'Set service key for admin functions'
        },
        {
          check: 'PRODUCTION_URL_CONFIGURED',
          status: env.APP_URL === 'https://aiohub.jp',
          recommendation: env.APP_URL === 'https://aiohub.jp' ? 
            'Production URL set' : 'Verify APP_URL for production'
        },
        {
          check: 'NODE_ENV_PRODUCTION',
          status: process.env.NODE_ENV === 'production',
          recommendation: process.env.NODE_ENV === 'production' ? 
            'Production mode' : 'Ensure NODE_ENV=production in production'
        }
      ]
    };

    envSecurityCheck.score = envSecurityCheck.checks.filter(check => check.status).length;

    // API セキュリティテスト
    const apiSecurityTests = [];

    // 認証が必要なエンドポイントのテスト
    try {
      const authTestResponse = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/my/organization`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      apiSecurityTests.push({
        test: 'unauthorized_api_access',
        endpoint: '/api/my/organization',
        expectedStatus: 401,
        actualStatus: authTestResponse.status,
        passed: authTestResponse.status === 401,
        description: '認証なしでの保護されたAPIアクセスが適切に拒否されるか'
      });
    } catch (error) {
      apiSecurityTests.push({
        test: 'unauthorized_api_access',
        endpoint: '/api/my/organization',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // CORS設定テスト
    const corsTest = {
      test: 'cors_configuration',
      allowedOrigins: requestHeaders['access-control-allow-origin'] || 'Not set',
      allowedMethods: requestHeaders['access-control-allow-methods'] || 'Not set',
      allowedHeaders: requestHeaders['access-control-allow-headers'] || 'Not set',
      status: 'configured'
    };

    // セキュリティスコア計算
    const totalSecurityScore = securityHeadersAssessment.score + envSecurityCheck.score;
    const maxSecurityScore = securityHeadersAssessment.maxScore + envSecurityCheck.maxScore;
    const securityPercentage = Math.round((totalSecurityScore / maxSecurityScore) * 100);

    // セキュリティレベル判定
    let securityLevel: 'excellent' | 'good' | 'moderate' | 'weak';
    if (securityPercentage >= 90) securityLevel = 'excellent';
    else if (securityPercentage >= 75) securityLevel = 'good';
    else if (securityPercentage >= 60) securityLevel = 'moderate';
    else securityLevel = 'weak';

    // 推奨事項
    const recommendations = [];

    if (securityHeadersAssessment.score < securityHeadersAssessment.maxScore) {
      recommendations.push({
        priority: 'high',
        category: 'headers',
        message: 'セキュリティヘッダーが不足しています',
        action: 'missing headers: ' + 
          securityHeadersAssessment.checks
            .filter(check => !check.present)
            .map(check => check.header)
            .join(', ')
      });
    }

    if (envSecurityCheck.score < envSecurityCheck.maxScore) {
      recommendations.push({
        priority: 'medium',
        category: 'environment',
        message: '環境設定に改善点があります',
        action: 'Review environment security checklist'
      });
    }

    const failedApiTests = apiSecurityTests.filter(test => !test.passed);
    if (failedApiTests.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'api_security',
        message: 'API セキュリティテストで問題が検出されました',
        action: 'Check API authentication and authorization'
      });
    }

    const diagnosticTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      securityLevel,
      score: {
        total: totalSecurityScore,
        maximum: maxSecurityScore,
        percentage: securityPercentage
      },
      diagnostics: {
        securityHeaders: securityHeadersAssessment,
        environment: envSecurityCheck,
        apiSecurity: apiSecurityTests,
        cors: corsTest
      },
      recommendations,
      summary: {
        criticalIssues: recommendations.filter(r => r.priority === 'high').length,
        moderateIssues: recommendations.filter(r => r.priority === 'medium').length,
        minorIssues: recommendations.filter(r => r.priority === 'low').length
      },
      meta: {
        diagnosticTime,
        generatedAt: new Date().toISOString(),
        userAgent: requestHeaders['user-agent'] || 'Unknown',
        diagnosticVersion: '1.0.0'
      }
    });

  } catch (error) {
    console.error('Security diagnostic failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to run security diagnostic',
      diagnosticTime: Date.now() - startTime,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}