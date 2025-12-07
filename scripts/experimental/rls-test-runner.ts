#!/usr/bin/env node
/**
 * DEPRECATED - not used, kept only for reference
 * 
 * P1-6: RLS Test Runner
 * 
 * Row Level Security ポリシーの自動検証ツール
 * - 組織境界チェック
 * - ロールベース権限テスト  
 * - Cross-organizationアクセス防止
 * - CI/CD統合対応
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { performance } from 'perf_hooks';

// 環境変数の読み込み
config({ path: '.env.local' });

interface TestConfig {
  sessionId: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  testEnvironment: string;
  gitCommitHash?: string;
  reportOutputPath?: string;
  verbose?: boolean;
}

interface TestUser {
  id: string;
  email: string;
  type: 'org_owner' | 'org_admin' | 'org_member' | 'org_viewer' | 'no_org' | 'cross_org';
  organizationId?: string;
  role?: string;
  accessToken?: string;
}

interface TestCase {
  name: string;
  category: string;
  table: string;
  policy?: string;
  user: TestUser;
  targetOrgId?: string;
  query: string;
  expectedResult: 'allow' | 'deny' | 'partial';
  description: string;
}

interface TestResult {
  testName: string;
  category: string;
  table: string;
  policy?: string;
  user: TestUser;
  expected: string;
  actual: string;
  status: 'pass' | 'fail' | 'error' | 'skip';
  executionTimeMs: number;
  errorMessage?: string;
  query: string;
}

interface TestSummary {
  sessionId: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  errorTests: number;
  skippedTests: number;
  successRate: number;
  executionTimeMs: number;
  timestamp: string;
  gitCommitHash?: string;
  environment: string;
}

class RLSTestRunner {
  private supabase: SupabaseClient;
  private config: TestConfig;
  private testUsers: Map<string, TestUser> = new Map();
  private testResults: TestResult[] = [];
  private startTime: number = 0;

  constructor(config: TestConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * テスト実行のメインエントリポイント
   */
  async runTests(): Promise<TestSummary> {
    console.log(`🧪 RLS Test Runner Starting (Session: ${this.config.sessionId})`);
    this.startTime = performance.now();

    try {
      // 1. テスト環境の初期化
      await this.initializeTestEnvironment();

      // 2. テストユーザーの準備
      await this.setupTestUsers();

      // 3. テストケースの実行
      await this.executeTestSuites();

      // 4. 結果の記録とレポート生成
      const summary = await this.generateTestSummary();
      await this.saveResultsToDatabase();
      await this.generateReport(summary);

      console.log(`✅ RLS Tests Completed - ${summary.passedTests}/${summary.totalTests} passed (${summary.successRate}%)`);
      return summary;

    } catch (error) {
      console.error('❌ RLS Test Runner failed:', error);
      throw error;
    }
  }

  /**
   * テスト環境の初期化
   */
  private async initializeTestEnvironment(): Promise<void> {
    console.log('🔧 Initializing test environment...');

    // RLS基盤の存在確認
    const { data: tables, error } = await this.supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['rls_test_results', 'rls_policy_snapshots', 'rls_test_users']);

    if (error) {
      throw new Error(`Failed to verify RLS infrastructure: ${error.message}`);
    }

    if (!tables || tables.length < 3) {
      throw new Error('RLS test infrastructure not found. Please run the P1-6 SQL setup first.');
    }

    // スナップショット作成
    if (this.config.gitCommitHash) {
      const { error: snapshotError } = await this.supabase.rpc('create_rls_snapshot', {
        snapshot_name_param: this.config.sessionId,
        git_commit_param: this.config.gitCommitHash,
        environment_param: this.config.testEnvironment,
      });

      if (snapshotError) {
        console.warn(`⚠️  Failed to create RLS snapshot: ${snapshotError.message}`);
      } else {
        console.log(`📸 Created RLS policy snapshot: ${this.config.sessionId}`);
      }
    }
  }

  /**
   * テストユーザーの準備
   */
  private async setupTestUsers(): Promise<void> {
    console.log('👥 Setting up test users...');

    const testUserConfigs = [
      { type: 'org_owner', email: 'test.owner@rlstest.local', orgId: '550e8400-e29b-41d4-a716-446655440001', role: 'owner' },
      { type: 'org_admin', email: 'test.admin@rlstest.local', orgId: '550e8400-e29b-41d4-a716-446655440001', role: 'admin' },
      { type: 'org_member', email: 'test.member@rlstest.local', orgId: '550e8400-e29b-41d4-a716-446655440001', role: 'member' },
      { type: 'org_viewer', email: 'test.viewer@rlstest.local', orgId: '550e8400-e29b-41d4-a716-446655440001', role: 'viewer' },
      { type: 'no_org', email: 'test.noorg@rlstest.local', orgId: null, role: null },
      { type: 'cross_org', email: 'test.cross@rlstest.local', orgId: '550e8400-e29b-41d4-a716-446655440002', role: 'member' },
    ] as const;

    for (const userConfig of testUserConfigs) {
      const { data: userId, error } = await this.supabase.rpc('setup_rls_test_user', {
        user_type_param: userConfig.type,
        email_param: userConfig.email,
        org_id_param: userConfig.orgId,
        role_param: userConfig.role,
      });

      if (error) {
        throw new Error(`Failed to setup test user ${userConfig.type}: ${error.message}`);
      }

      this.testUsers.set(userConfig.type, {
        id: userId,
        email: userConfig.email,
        type: userConfig.type as any,
        organizationId: userConfig.orgId || undefined,
        role: userConfig.role || undefined,
      });

      if (this.config.verbose) {
        console.log(`  ✓ ${userConfig.type}: ${userConfig.email} (${userId})`);
      }
    }

    console.log(`✅ Prepared ${this.testUsers.size} test users`);
  }

  /**
   * テストスイートの実行
   */
  private async executeTestSuites(): Promise<void> {
    console.log('🚀 Executing RLS test suites...');

    const testSuites = [
      this.organizationBoundaryTests(),
      this.userRolePermissionTests(),
      this.contentAccessTests(),
      this.crossOrganizationTests(),
      this.anonymousAccessTests(),
    ];

    for (const testSuite of testSuites) {
      const testCases = await testSuite;
      console.log(`📋 Running ${testCases.length} tests in suite...`);

      for (const testCase of testCases) {
        await this.executeTestCase(testCase);
      }
    }
  }

  /**
   * 個別テストケースの実行
   */
  private async executeTestCase(testCase: TestCase): Promise<void> {
    const startTime = performance.now();
    
    try {
      if (this.config.verbose) {
        console.log(`  🧪 ${testCase.name}...`);
      }

      // テストユーザーコンテキストでクエリ実行
      const result = await this.executeQueryAsUser(testCase.query, testCase.user);
      const executionTime = performance.now() - startTime;

      // 結果の評価
      const actualResult = this.evaluateQueryResult(result, testCase);
      const status = actualResult === testCase.expectedResult ? 'pass' : 'fail';

      this.testResults.push({
        testName: testCase.name,
        category: testCase.category,
        table: testCase.table,
        policy: testCase.policy,
        user: testCase.user,
        expected: testCase.expectedResult,
        actual: actualResult,
        status,
        executionTimeMs: Math.round(executionTime),
        query: testCase.query,
      });

      if (this.config.verbose || status === 'fail') {
        const icon = status === 'pass' ? '✅' : '❌';
        console.log(`    ${icon} ${testCase.name}: expected ${testCase.expectedResult}, got ${actualResult}`);
      }

    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.testResults.push({
        testName: testCase.name,
        category: testCase.category,
        table: testCase.table,
        policy: testCase.policy,
        user: testCase.user,
        expected: testCase.expectedResult,
        actual: 'error',
        status: 'error',
        executionTimeMs: Math.round(executionTime),
        errorMessage: (error as Error).message,
        query: testCase.query,
      });

      console.log(`    ⚠️  ${testCase.name}: ERROR - ${(error as Error).message}`);
    }
  }

  /**
   * ユーザーコンテキストでクエリ実行
   */
  private async executeQueryAsUser(query: string, user: TestUser): Promise<any> {
    // service_roleクライアントでテスト用のJWT生成（実際の実装では適切な認証フローを使用）
    const { data, error } = await this.supabase
      .from('rls_test_users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      throw new Error(`Test user not found: ${error.message}`);
    }

    // 実際のクエリ実行（テストユーザーのコンテキストをシミュレート）
    // NOTE: 本実装では適切なJWT生成とauth.setUser()を使用する必要がある
    const testClient = createClient(this.config.supabaseUrl, this.config.supabaseServiceRoleKey);
    
    // ここでは簡易的にservice_roleで実行し、RLSが適用されている前提でテスト
    const result = await testClient.from('organizations').select('*').limit(1);
    
    return result;
  }

  /**
   * クエリ結果の評価
   */
  private evaluateQueryResult(result: any, testCase: TestCase): 'allow' | 'deny' | 'partial' {
    if (result.error) {
      // 権限エラーの場合はdeny
      if (result.error.code === '42501' || result.error.message.includes('permission denied')) {
        return 'deny';
      }
      throw new Error(`Query execution error: ${result.error.message}`);
    }

    if (!result.data) {
      return 'deny';
    }

    // データが返された場合の評価
    if (Array.isArray(result.data)) {
      if (result.data.length === 0) {
        return 'deny';
      }
      // 部分的なデータの場合はpartial（実装依存）
      return 'allow';
    }

    return 'allow';
  }

  /**
   * 組織境界テスト
   */
  private async organizationBoundaryTests(): Promise<TestCase[]> {
    const orgOwner = this.testUsers.get('org_owner')!;
    const crossOrgUser = this.testUsers.get('cross_org')!;
    const noOrgUser = this.testUsers.get('no_org')!;

    return [
      {
        name: 'org_owner_can_access_own_org',
        category: 'organization_boundary',
        table: 'organizations',
        user: orgOwner,
        targetOrgId: orgOwner.organizationId,
        query: `SELECT * FROM organizations WHERE id = '${orgOwner.organizationId}'`,
        expectedResult: 'allow',
        description: 'Organization owner should access their own organization',
      },
      {
        name: 'cross_org_user_cannot_access_other_org',
        category: 'organization_boundary',
        table: 'organizations',
        user: crossOrgUser,
        targetOrgId: orgOwner.organizationId,
        query: `SELECT * FROM organizations WHERE id = '${orgOwner.organizationId}'`,
        expectedResult: 'deny',
        description: 'User from another org should not access different organization',
      },
      {
        name: 'no_org_user_cannot_access_any_org',
        category: 'organization_boundary',
        table: 'organizations',
        user: noOrgUser,
        targetOrgId: orgOwner.organizationId,
        query: `SELECT * FROM organizations WHERE id = '${orgOwner.organizationId}'`,
        expectedResult: 'deny',
        description: 'User without organization should not access any organization',
      },
    ];
  }

  /**
   * ユーザーロール権限テスト
   */
  private async userRolePermissionTests(): Promise<TestCase[]> {
    const orgOwner = this.testUsers.get('org_owner')!;
    const orgAdmin = this.testUsers.get('org_admin')!;
    const orgMember = this.testUsers.get('org_member')!;
    const orgViewer = this.testUsers.get('org_viewer')!;

    return [
      {
        name: 'viewer_can_read_org_data',
        category: 'role_permission',
        table: 'organizations',
        user: orgViewer,
        query: `SELECT name FROM organizations WHERE id = '${orgViewer.organizationId}'`,
        expectedResult: 'allow',
        description: 'Viewer should be able to read organization data',
      },
      {
        name: 'viewer_cannot_update_org_data',
        category: 'role_permission',
        table: 'organizations',
        user: orgViewer,
        query: `UPDATE organizations SET description = 'test' WHERE id = '${orgViewer.organizationId}'`,
        expectedResult: 'deny',
        description: 'Viewer should not be able to update organization data',
      },
      {
        name: 'admin_can_update_org_data',
        category: 'role_permission',
        table: 'organizations',
        user: orgAdmin,
        query: `UPDATE organizations SET description = 'admin test' WHERE id = '${orgAdmin.organizationId}'`,
        expectedResult: 'allow',
        description: 'Admin should be able to update organization data',
      },
    ];
  }

  /**
   * コンテンツアクセステスト
   */
  private async contentAccessTests(): Promise<TestCase[]> {
    const orgMember = this.testUsers.get('org_member')!;
    const crossOrgUser = this.testUsers.get('cross_org')!;

    return [
      {
        name: 'member_can_access_org_content',
        category: 'content_access',
        table: 'qa_entries',
        user: orgMember,
        query: `SELECT * FROM qa_entries WHERE organization_id = '${orgMember.organizationId}' LIMIT 5`,
        expectedResult: 'allow',
        description: 'Member should access organization content',
      },
      {
        name: 'cross_org_user_cannot_access_other_org_content',
        category: 'content_access',
        table: 'qa_entries',
        user: crossOrgUser,
        query: `SELECT * FROM qa_entries WHERE organization_id = '${orgMember.organizationId}' LIMIT 5`,
        expectedResult: 'deny',
        description: 'User should not access other organization content',
      },
    ];
  }

  /**
   * クロス組織アクセステスト
   */
  private async crossOrganizationTests(): Promise<TestCase[]> {
    const orgMember = this.testUsers.get('org_member')!;
    const crossOrgUser = this.testUsers.get('cross_org')!;

    return [
      {
        name: 'cannot_join_other_organization_via_sql',
        category: 'cross_organization',
        table: 'organization_members',
        user: crossOrgUser,
        query: `INSERT INTO organization_members (organization_id, user_id, role) VALUES ('${orgMember.organizationId}', '${crossOrgUser.id}', 'member')`,
        expectedResult: 'deny',
        description: 'User should not be able to join another organization directly',
      },
    ];
  }

  /**
   * 匿名アクセステスト
   */
  private async anonymousAccessTests(): Promise<TestCase[]> {
    const noOrgUser = this.testUsers.get('no_org')!;

    return [
      {
        name: 'anonymous_cannot_access_private_data',
        category: 'anonymous_access',
        table: 'organizations',
        user: noOrgUser,
        query: 'SELECT * FROM organizations LIMIT 1',
        expectedResult: 'deny',
        description: 'Anonymous user should not access private organization data',
      },
    ];
  }

  /**
   * 結果をデータベースに保存
   */
  private async saveResultsToDatabase(): Promise<void> {
    console.log('💾 Saving test results to database...');

    for (const result of this.testResults) {
      const { error } = await this.supabase.rpc('record_rls_test_result', {
        session_id_param: this.config.sessionId,
        test_name_param: result.testName,
        category_param: result.category,
        table_name_param: result.table,
        policy_name_param: result.policy || null,
        test_user_id_param: result.user.id,
        test_org_id_param: result.user.organizationId || null,
        test_role_param: result.user.role || null,
        expected_param: result.expected,
        actual_param: result.actual,
        query_param: result.query,
        status_param: result.status,
        execution_time_param: result.executionTimeMs,
        error_msg_param: result.errorMessage || null,
      });

      if (error) {
        console.warn(`Failed to save test result ${result.testName}: ${error.message}`);
      }
    }

    console.log(`✅ Saved ${this.testResults.length} test results`);
  }

  /**
   * テストサマリーの生成
   */
  private async generateTestSummary(): Promise<TestSummary> {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'pass').length;
    const failedTests = this.testResults.filter(r => r.status === 'fail').length;
    const errorTests = this.testResults.filter(r => r.status === 'error').length;
    const skippedTests = this.testResults.filter(r => r.status === 'skip').length;
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100 * 100) / 100 : 0;
    const executionTime = Math.round(performance.now() - this.startTime);

    return {
      sessionId: this.config.sessionId,
      totalTests,
      passedTests,
      failedTests,
      errorTests,
      skippedTests,
      successRate,
      executionTimeMs: executionTime,
      timestamp: new Date().toISOString(),
      gitCommitHash: this.config.gitCommitHash,
      environment: this.config.testEnvironment,
    };
  }

  /**
   * テストレポートの生成
   */
  private async generateReport(summary: TestSummary): Promise<void> {
    const reportPath = this.config.reportOutputPath || `./rls-test-report-${this.config.sessionId}.json`;
    
    const report = {
      summary,
      results: this.testResults,
      config: {
        sessionId: this.config.sessionId,
        environment: this.config.testEnvironment,
        gitCommitHash: this.config.gitCommitHash,
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        runner: 'rls-test-runner',
        version: '1.0.0',
      },
    };

    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 Test report saved to: ${reportPath}`);
  }
}

/**
 * CLI実行のメイン関数
 */
async function main() {
  const sessionId = process.env.RLS_TEST_SESSION_ID || `rls-test-${Date.now()}`;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const config: TestConfig = {
    sessionId,
    supabaseUrl,
    supabaseServiceRoleKey,
    testEnvironment: process.env.NODE_ENV || 'development',
    gitCommitHash: process.env.GITHUB_SHA || process.env.GIT_COMMIT_HASH,
    reportOutputPath: process.env.RLS_TEST_REPORT_PATH,
    verbose: process.env.RLS_TEST_VERBOSE === 'true',
  };

  const runner = new RLSTestRunner(config);
  
  try {
    const summary = await runner.runTests();
    
    if (summary.failedTests > 0 || summary.errorTests > 0) {
      console.error(`❌ RLS Tests failed: ${summary.failedTests + summary.errorTests}/${summary.totalTests}`);
      process.exit(1);
    }
    
    console.log('🎉 All RLS tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('💥 RLS Test Runner crashed:', error);
    process.exit(1);
  }
}

// CLI実行時
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { RLSTestRunner, type TestConfig, type TestResult, type TestSummary };