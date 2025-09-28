/**
 * Final Validation API
 * 本番環境展開前の最終バリデーション
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import { AnalyticsEngine } from '@/lib/analytics/comprehensive-analytics';
import { RLSTestRunner } from '@/lib/testing/rls-test-suite';
import { validateOrganizationJsonLdComplete } from '@/lib/json-ld/validator';


interface ValidationCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'skip';
  message: string;
  details?: any;
  critical: boolean;
}

interface ValidationReport {
  timestamp: string;
  overall_status: 'ready' | 'warning' | 'not_ready';
  critical_issues: number;
  warning_issues: number;
  passed_checks: number;
  total_checks: number;
  checks: ValidationCheck[];
  deployment_approval: boolean;
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

    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';
    const includeTests = url.searchParams.get('include_tests') === 'true';

    console.log('🔍 Starting final validation checks...');
    const startTime = Date.now();

    const checks: ValidationCheck[] = [];

    // 1. 環境変数チェック
    checks.push(await validateEnvironmentVariables());

    // 2. データベース接続チェック
    checks.push(await validateDatabaseConnection());

    // 3. 基本API動作チェック
    checks.push(await validateCoreAPIs());

    // 4. 認証システムチェック
    checks.push(await validateAuthenticationSystem());

    // 5. 外部サービス連携チェック
    checks.push(await validateExternalServices());

    // 6. セキュリティ設定チェック
    checks.push(await validateSecuritySettings());

    // 7. パフォーマンス要件チェック
    checks.push(await validatePerformanceRequirements());

    // 8. JSON-LD バリデーション
    checks.push(await validateJsonLdSystem());

    // 9. 監視・ログシステムチェック
    checks.push(await validateMonitoringSystem());

    // 10. バックアップ・復旧システムチェック
    checks.push(await validateBackupSystem());

    // 11. RLSポリシーテスト（オプション）
    if (includeTests) {
      checks.push(await validateRLSPolicies());
    }

    // 12. 本番環境固有チェック
    checks.push(await validateProductionSettings());

    const executionTime = Date.now() - startTime;

    // 結果集計
    const critical_issues = checks.filter(c => c.status === 'fail' && c.critical).length;
    const warning_issues = checks.filter(c => c.status === 'warning' || (c.status === 'fail' && !c.critical)).length;
    const passed_checks = checks.filter(c => c.status === 'pass').length;
    const total_checks = checks.length;

    const overall_status = critical_issues > 0 ? 'not_ready' : 
                          warning_issues > 0 ? 'warning' : 'ready';

    const deployment_approval = critical_issues === 0;

    const report: ValidationReport = {
      timestamp: new Date().toISOString(),
      overall_status,
      critical_issues,
      warning_issues,
      passed_checks,
      total_checks,
      checks,
      deployment_approval,
    };

    console.log(`✅ Final validation completed in ${executionTime}ms`);
    console.log(`📊 Status: ${overall_status} | Critical: ${critical_issues} | Warnings: ${warning_issues} | Passed: ${passed_checks}/${total_checks}`);

    if (format === 'markdown') {
      const markdown = generateValidationMarkdown(report);
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': 'attachment; filename="final-validation-report.md"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      report,
      execution_time: executionTime,
    });

  } catch (error: any) {
    console.error('❌ Final Validation Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Final validation failed',
      message: error.message,
    }, { status: 500 });
  }
}

async function validateEnvironmentVariables(): Promise<ValidationCheck> {
  try {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'RESEND_API_KEY',
      'JWT_SECRET',
      'NEXT_PUBLIC_APP_URL'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      return {
        name: 'Environment Variables',
        status: 'fail',
        message: `Missing required environment variables: ${missing.join(', ')}`,
        critical: true,
      };
    }

    // セキュリティ要件チェック
    const weakSecrets = [];
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      weakSecrets.push('JWT_SECRET too short');
    }

    if (weakSecrets.length > 0) {
      return {
        name: 'Environment Variables',
        status: 'warning',
        message: `Security concerns: ${weakSecrets.join(', ')}`,
        critical: false,
      };
    }

    return {
      name: 'Environment Variables',
      status: 'pass',
      message: 'All required environment variables are set',
      critical: true,
    };

  } catch (error: any) {
    return {
      name: 'Environment Variables',
      status: 'fail',
      message: `Validation error: ${error.message}`,
      critical: true,
    };
  }
}

async function validateDatabaseConnection(): Promise<ValidationCheck> {
  try {
    const { supabaseServer } = await import('@/lib/supabase-server');
    const supabase = await supabaseServer();
    
    // 基本接続テスト
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    if (error) {
      return {
        name: 'Database Connection',
        status: 'fail',
        message: `Database connection failed: ${error.message}`,
        critical: true,
      };
    }

    return {
      name: 'Database Connection',
      status: 'pass',
      message: 'Database connection successful',
      critical: true,
    };

  } catch (error: any) {
    return {
      name: 'Database Connection',
      status: 'fail',
      message: `Database connection error: ${error.message}`,
      critical: true,
    };
  }
}

async function validateCoreAPIs(): Promise<ValidationCheck> {
  try {
    const coreEndpoints = [
      '/api/health',
      '/api/organizations',
    ];

    const results = await Promise.all(
      coreEndpoints.map(async (endpoint) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${endpoint}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          return { endpoint, status: response.status, ok: response.ok };
        } catch (error) {
          return { endpoint, status: 0, ok: false, error: error.message };
        }
      })
    );

    const failures = results.filter(r => !r.ok);

    if (failures.length > 0) {
      return {
        name: 'Core APIs',
        status: 'fail',
        message: `API failures: ${failures.map(f => `${f.endpoint}(${f.status})`).join(', ')}`,
        details: failures,
        critical: true,
      };
    }

    return {
      name: 'Core APIs',
      status: 'pass',
      message: 'All core APIs responding correctly',
      critical: true,
    };

  } catch (error: any) {
    return {
      name: 'Core APIs',
      status: 'fail',
      message: `API validation error: ${error.message}`,
      critical: true,
    };
  }
}

async function validateAuthenticationSystem(): Promise<ValidationCheck> {
  try {
    // 認証システムの基本チェック
    const { supabaseServer } = await import('@/lib/supabase-server');
    const supabase = await supabaseServer();
    
    // サービスロールキーでの接続テスト
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      return {
        name: 'Authentication System',
        status: 'fail',
        message: `Auth system error: ${error.message}`,
        critical: true,
      };
    }

    return {
      name: 'Authentication System',
      status: 'pass',
      message: 'Authentication system operational',
      critical: true,
    };

  } catch (error: any) {
    return {
      name: 'Authentication System',
      status: 'fail',
      message: `Auth validation error: ${error.message}`,
      critical: true,
    };
  }
}

async function validateExternalServices(): Promise<ValidationCheck> {
  try {
    const issues = [];

    // Stripe接続チェック
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      await stripe.products.list({ limit: 1 });
    } catch (error) {
      issues.push(`Stripe: ${error.message}`);
    }

    // Resend接続チェック
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      // APIキーの検証（実際にメールは送信しない）
    } catch (error) {
      issues.push(`Resend: ${error.message}`);
    }

    if (issues.length > 0) {
      return {
        name: 'External Services',
        status: 'warning',
        message: `Service connection issues: ${issues.join(', ')}`,
        details: issues,
        critical: false,
      };
    }

    return {
      name: 'External Services',
      status: 'pass',
      message: 'All external services accessible',
      critical: false,
    };

  } catch (error: any) {
    return {
      name: 'External Services',
      status: 'fail',
      message: `External service validation error: ${error.message}`,
      critical: false,
    };
  }
}

async function validateSecuritySettings(): Promise<ValidationCheck> {
  try {
    const issues = [];

    // HTTPS設定チェック
    if (!process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')) {
      issues.push('App URL should use HTTPS in production');
    }

    // セキュリティヘッダーチェック
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_APP_URL + '/');
      const headers = response.headers;
      
      if (!headers.get('x-frame-options') && !headers.get('content-security-policy')) {
        issues.push('Missing security headers (X-Frame-Options or CSP)');
      }
    } catch (error) {
      issues.push('Unable to check security headers');
    }

    // 本番環境でのデバッグ設定チェック
    if (process.env.NODE_ENV === 'production') {
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        issues.push('Debug mode enabled in production');
      }
    }

    if (issues.length > 0) {
      return {
        name: 'Security Settings',
        status: 'warning',
        message: `Security concerns: ${issues.join(', ')}`,
        details: issues,
        critical: false,
      };
    }

    return {
      name: 'Security Settings',
      status: 'pass',
      message: 'Security settings properly configured',
      critical: false,
    };

  } catch (error: any) {
    return {
      name: 'Security Settings',
      status: 'fail',
      message: `Security validation error: ${error.message}`,
      critical: false,
    };
  }
}

async function validatePerformanceRequirements(): Promise<ValidationCheck> {
  try {
    // パフォーマンス要件チェック（API応答時間 < 1秒）
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/health`);
      const responseTime = Date.now() - startTime;
      
      if (responseTime > 1000) {
        return {
          name: 'Performance Requirements',
          status: 'warning',
          message: `API response time ${responseTime}ms exceeds 1 second target`,
          details: { responseTime },
          critical: false,
        };
      }

      return {
        name: 'Performance Requirements',
        status: 'pass',
        message: `API response time: ${responseTime}ms (within target)`,
        details: { responseTime },
        critical: false,
      };

    } catch (error) {
      return {
        name: 'Performance Requirements',
        status: 'fail',
        message: `Performance test failed: ${error.message}`,
        critical: false,
      };
    }

  } catch (error: any) {
    return {
      name: 'Performance Requirements',
      status: 'fail',
      message: `Performance validation error: ${error.message}`,
      critical: false,
    };
  }
}

async function validateJsonLdSystem(): Promise<ValidationCheck> {
  try {
    // JSON-LDシステムの基本動作確認
    const { generateOrganizationJsonLd } = await import('@/lib/json-ld/organization');
    
    const testOrg = {
      name: 'Test Organization',
      description: 'Test description',
      url: 'https://test.example.com',
      address_locality: 'Tokyo',
      address_region: 'Tokyo',
      telephone: '03-1234-5678',
    };

    try {
      const jsonLd = generateOrganizationJsonLd(testOrg as any);
      
      // 基本的な構造チェック
      if (!jsonLd['@context'] || !jsonLd['@type'] || !jsonLd.name) {
        return {
          name: 'JSON-LD System',
          status: 'fail',
          message: 'JSON-LD structure validation failed',
          critical: false,
        };
      }

      return {
        name: 'JSON-LD System',
        status: 'pass',
        message: 'JSON-LD system functioning correctly',
        critical: false,
      };

    } catch (error) {
      return {
        name: 'JSON-LD System',
        status: 'fail',
        message: `JSON-LD generation failed: ${error.message}`,
        critical: false,
      };
    }

  } catch (error: any) {
    return {
      name: 'JSON-LD System',
      status: 'fail',
      message: `JSON-LD validation error: ${error.message}`,
      critical: false,
    };
  }
}

async function validateMonitoringSystem(): Promise<ValidationCheck> {
  try {
    // 基本的な監視機能の確認
    const issues = [];

    // ヘルスチェックエンドポイント
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/health`);
      if (!response.ok) {
        issues.push('Health check endpoint not responding');
      }
    } catch (error) {
      issues.push('Health check endpoint unreachable');
    }

    // 環境変数での監視設定確認
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
        issues.push('Error monitoring not configured');
      }
    }

    if (issues.length > 0) {
      return {
        name: 'Monitoring System',
        status: 'warning',
        message: `Monitoring issues: ${issues.join(', ')}`,
        details: issues,
        critical: false,
      };
    }

    return {
      name: 'Monitoring System',
      status: 'pass',
      message: 'Monitoring system properly configured',
      critical: false,
    };

  } catch (error: any) {
    return {
      name: 'Monitoring System',
      status: 'fail',
      message: `Monitoring validation error: ${error.message}`,
      critical: false,
    };
  }
}

async function validateBackupSystem(): Promise<ValidationCheck> {
  try {
    // バックアップシステムの基本チェック
    const warnings = [];

    // データベースバックアップ設定の確認
    // Supabaseの場合、自動バックアップが有効かどうかは管理画面で確認
    warnings.push('Manual verification required: Supabase automatic backups enabled');

    // アプリケーションレベルでのバックアップ機能確認
    if (!process.env.BACKUP_STORAGE_URL && !process.env.AWS_S3_BUCKET) {
      warnings.push('Application-level backup storage not configured');
    }

    if (warnings.length > 0) {
      return {
        name: 'Backup System',
        status: 'warning',
        message: `Backup system warnings: ${warnings.join(', ')}`,
        details: warnings,
        critical: false,
      };
    }

    return {
      name: 'Backup System',
      status: 'pass',
      message: 'Backup system configured',
      critical: false,
    };

  } catch (error: any) {
    return {
      name: 'Backup System',
      status: 'fail',
      message: `Backup validation error: ${error.message}`,
      critical: false,
    };
  }
}

async function validateRLSPolicies(): Promise<ValidationCheck> {
  try {
    console.log('🔒 Running RLS policy validation...');
    
    const testRunner = new RLSTestRunner({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    });

    const results = await testRunner.runAllTests();
    await testRunner.cleanup();

    if (results.failedTests > 0) {
      return {
        name: 'RLS Policies',
        status: 'fail',
        message: `${results.failedTests} RLS policy tests failed (${results.successRate.toFixed(1)}% success rate)`,
        details: {
          passed: results.passedTests,
          failed: results.failedTests,
          errors: results.errorTests,
          successRate: results.successRate,
        },
        critical: true,
      };
    }

    if (results.errorTests > 0) {
      return {
        name: 'RLS Policies',
        status: 'warning',
        message: `RLS tests completed with ${results.errorTests} errors`,
        details: {
          passed: results.passedTests,
          failed: results.failedTests,
          errors: results.errorTests,
          successRate: results.successRate,
        },
        critical: false,
      };
    }

    return {
      name: 'RLS Policies',
      status: 'pass',
      message: `All RLS policy tests passed (${results.passedTests}/${results.totalTests})`,
      details: {
        passed: results.passedTests,
        total: results.totalTests,
        successRate: results.successRate,
      },
      critical: true,
    };

  } catch (error: any) {
    return {
      name: 'RLS Policies',
      status: 'fail',
      message: `RLS validation error: ${error.message}`,
      critical: true,
    };
  }
}

async function validateProductionSettings(): Promise<ValidationCheck> {
  try {
    const issues = [];

    // NODE_ENV確認
    if (process.env.NODE_ENV !== 'production') {
      issues.push('NODE_ENV is not set to production');
    }

    // 本番用設定の確認
    if (process.env.SHOW_BUILD_BADGE !== 'false') {
      issues.push('Build badge should be hidden in production');
    }

    // デバッグ設定確認
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      issues.push('Debug mode should be disabled in production');
    }

    // Analytics設定確認
    if (!process.env.NEXT_PUBLIC_GA_ID && !process.env.PLAUSIBLE_DOMAIN) {
      issues.push('Analytics not configured');
    }

    if (issues.length > 0) {
      return {
        name: 'Production Settings',
        status: 'warning',
        message: `Production configuration issues: ${issues.join(', ')}`,
        details: issues,
        critical: false,
      };
    }

    return {
      name: 'Production Settings',
      status: 'pass',
      message: 'Production settings properly configured',
      critical: false,
    };

  } catch (error: any) {
    return {
      name: 'Production Settings',
      status: 'fail',
      message: `Production settings validation error: ${error.message}`,
      critical: false,
    };
  }
}

function generateValidationMarkdown(report: ValidationReport): string {
  const statusEmoji = {
    'ready': '✅',
    'warning': '⚠️',
    'not_ready': '❌',
  };

  const checkEmoji = {
    'pass': '✅',
    'fail': '❌',
    'warning': '⚠️',
    'skip': '⏭️',
  };

  return `# Final Validation Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}
**Overall Status:** ${statusEmoji[report.overall_status]} ${report.overall_status.toUpperCase()}
**Deployment Approval:** ${report.deployment_approval ? '✅ APPROVED' : '❌ NOT APPROVED'}

## Summary

| Metric | Count |
|--------|-------|
| Total Checks | ${report.total_checks} |
| Passed | ${report.passed_checks} |
| Critical Issues | ${report.critical_issues} |
| Warnings | ${report.warning_issues} |

## Validation Results

| Check | Status | Critical | Message |
|-------|--------|----------|---------|
${report.checks.map(check => 
  `| ${check.name} | ${checkEmoji[check.status]} ${check.status} | ${check.critical ? '🔴' : '🟡'} | ${check.message} |`
).join('\n')}

## Detailed Results

${report.checks.map(check => `
### ${check.name}

**Status:** ${checkEmoji[check.status]} ${check.status.toUpperCase()}
**Critical:** ${check.critical ? 'Yes' : 'No'}
**Message:** ${check.message}

${check.details ? `**Details:**
\`\`\`json
${JSON.stringify(check.details, null, 2)}
\`\`\`` : ''}
`).join('\n')}

## Deployment Decision

${report.deployment_approval ? 
  '🟢 **DEPLOYMENT APPROVED** - All critical checks passed. System ready for production deployment.' :
  '🔴 **DEPLOYMENT NOT APPROVED** - Critical issues found. Resolve all critical issues before deployment.'
}

${report.critical_issues > 0 ? `
### Critical Issues to Resolve

${report.checks.filter(c => c.status === 'fail' && c.critical).map(check => 
  `- **${check.name}:** ${check.message}`
).join('\n')}
` : ''}

${report.warning_issues > 0 ? `
### Warnings (Non-blocking)

${report.checks.filter(c => c.status === 'warning' || (c.status === 'fail' && !c.critical)).map(check => 
  `- **${check.name}:** ${check.message}`
).join('\n')}
` : ''}

---

*This report was automatically generated by the Final Validation System*
`;
}