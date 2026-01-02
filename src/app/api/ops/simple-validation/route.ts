/**
 * Simple Validation API
 * 基本的な本番環境バリデーション
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

/** チェック結果ステータス */
type CheckStatus = 'pass' | 'fail' | 'warning' | 'skip';

/** 個別チェック結果 */
interface ValidationCheck {
  name: string;
  status: CheckStatus;
  message: string;
  critical: boolean;
}

/** 全体ステータス */
type OverallStatus = 'ready' | 'warning' | 'not_ready';

/** バリデーションレポート */
interface ValidationReport {
  timestamp: string;
  overall_status: OverallStatus;
  critical_issues: number;
  warning_issues: number;
  passed_checks: number;
  total_checks: number;
  checks: ValidationCheck[];
  deployment_approval: boolean;
  execution_time: number;
}

/** エラーメッセージ取得ヘルパー */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';

    logger.debug('🔍 Starting simplified validation checks...');
    const startTime = Date.now();

    const checks: ValidationCheck[] = [];

    // 1. 環境変数チェック
    checks.push(await validateEnvironmentVariables());

    // 2. データベース接続チェック
    checks.push(await validateDatabaseConnection());

    // 3. 基本API動作チェック
    checks.push(await validateHealthAPI());

    // 4. JSON-LD システムチェック
    checks.push(await validateJsonLdSystem());

    const executionTime = Date.now() - startTime;

    // 結果集計
    const critical_issues = checks.filter(c => c.status === 'fail' && c.critical).length;
    const warning_issues = checks.filter(c => c.status === 'warning' || (c.status === 'fail' && !c.critical)).length;
    const passed_checks = checks.filter(c => c.status === 'pass').length;
    const total_checks = checks.length;

    const overall_status: OverallStatus = critical_issues > 0 ? 'not_ready' :
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
      execution_time: executionTime,
    };

    logger.debug(`✅ Validation completed in ${executionTime}ms`);
    logger.debug(`📊 Status: ${overall_status} | Critical: ${critical_issues} | Warnings: ${warning_issues} | Passed: ${passed_checks}/${total_checks}`);

    if (format === 'markdown') {
      const markdown = generateValidationMarkdown(report);
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': 'attachment; filename="validation-report.md"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      report,
    });

  } catch (error) {
    logger.error('❌ Validation Error', { data: error instanceof Error ? error : new Error(String(error)) });

    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      message: getErrorMessage(error),
    }, { status: 500 });
  }
}

async function validateEnvironmentVariables(): Promise<ValidationCheck> {
  try {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
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

    return {
      name: 'Environment Variables',
      status: 'pass',
      message: 'All required environment variables are set',
      critical: true,
    };

  } catch (error) {
    return {
      name: 'Environment Variables',
      status: 'fail' as const,
      message: `Validation error: ${getErrorMessage(error)}`,
      critical: true,
    };
  }
}

async function validateDatabaseConnection(): Promise<ValidationCheck> {
  try {
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const supabase = await createServerClient();

    // 基本接続テスト
    const { error } = await supabase
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

  } catch (error) {
    return {
      name: 'Database Connection',
      status: 'fail' as const,
      message: `Database connection error: ${getErrorMessage(error)}`,
      critical: true,
    };
  }
}

async function validateHealthAPI(): Promise<ValidationCheck> {
  try {
    // Try to fetch health endpoint locally
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

    try {
      const response = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          name: 'Health API',
          status: 'fail',
          message: `Health API returned status ${response.status}`,
          critical: true,
        };
      }

      return {
        name: 'Health API',
        status: 'pass',
        message: 'Health API responding correctly',
        critical: true,
      };

    } catch (error) {
      return {
        name: 'Health API',
        status: 'warning',
        message: `Health API not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: false,
      };
    }

  } catch (error) {
    return {
      name: 'Health API',
      status: 'fail' as const,
      message: `Health API validation error: ${getErrorMessage(error)}`,
      critical: false,
    };
  }
}

async function validateJsonLdSystem(): Promise<ValidationCheck> {
  try {
    // JSON-LDシステムの基本動作確認
    const { generateOrganizationJsonLd } = await import('@/lib/json-ld/organization');

    // 最小限のテスト用Organization型（必須フィールドのみ）
    // Parameters<typeof fn>[0] で関数の引数型を取得
    type TestOrganization = Parameters<typeof generateOrganizationJsonLd>[0];
    const testOrg: Partial<TestOrganization> & { name: string } = {
      name: 'Test Organization',
      description: 'Test description',
      url: 'https://test.example.com',
      address_locality: 'Tokyo',
      address_region: 'Tokyo',
      telephone: '03-1234-5678',
    };

    try {
      // 型安全にキャスト
      const jsonLd = generateOrganizationJsonLd(testOrg as TestOrganization);
      
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
        message: `JSON-LD generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: false,
      };
    }

  } catch (error) {
    return {
      name: 'JSON-LD System',
      status: 'fail' as const,
      message: `JSON-LD validation error: ${getErrorMessage(error)}`,
      critical: false,
    };
  }
}

function generateValidationMarkdown(report: ValidationReport): string {
  const statusEmoji: Record<OverallStatus, string> = {
    'ready': '✅',
    'warning': '⚠️',
    'not_ready': '❌',
  };

  const checkEmoji: Record<CheckStatus, string> = {
    'pass': '✅',
    'fail': '❌',
    'warning': '⚠️',
    'skip': '⏭️',
  };

  return `# System Validation Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}
**Overall Status:** ${statusEmoji[report.overall_status] || '❓'} ${report.overall_status.toUpperCase()}
**Deployment Approval:** ${report.deployment_approval ? '✅ APPROVED' : '❌ NOT APPROVED'}
**Execution Time:** ${report.execution_time}ms

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
${report.checks.map((check) =>
  `| ${check.name} | ${checkEmoji[check.status] || '❓'} ${check.status} | ${check.critical ? '🔴' : '🟡'} | ${check.message} |`
).join('\n')}

## Deployment Decision

${report.deployment_approval ?
  '🟢 **DEPLOYMENT APPROVED** - All critical checks passed. System ready for production deployment.' :
  '🔴 **DEPLOYMENT NOT APPROVED** - Critical issues found. Resolve all critical issues before deployment.'
}

${report.critical_issues > 0 ? `
### Critical Issues to Resolve

${report.checks.filter((c) => c.status === 'fail' && c.critical).map((check) =>
  `- **${check.name}:** ${check.message}`
).join('\n')}
` : ''}

${report.warning_issues > 0 ? `
### Warnings (Non-blocking)

${report.checks.filter((c) => c.status === 'warning' || (c.status === 'fail' && !c.critical)).map((check) =>
  `- **${check.name}:** ${check.message}`
).join('\n')}
` : ''}

---

*This report was automatically generated by the System Validation*
`;
}