/**
 * DEPRECATED - not used, kept only for reference
 * 
 * P1-6: RLS Test Configuration Management
 * 
 * テスト設定とデータ管理のユーティリティ
 */

import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { 
  TestRunnerConfig, 
  TestEnvironmentSetup, 
  TestCaseDefinition, 
  TestSuiteDefinition,
  TestUserContext,
  TestCategory,
  TestUserType,
  OrgRole,
} from './rls-test-types';

// 環境変数の読み込み
config({ path: ['.env.local', '.env'] });

/**
 * テスト設定の管理クラス
 */
export class RLSTestConfig {
  private static instance: RLSTestConfig;
  
  private constructor(private configPath?: string) {}

  public static getInstance(configPath?: string): RLSTestConfig {
    if (!RLSTestConfig.instance) {
      RLSTestConfig.instance = new RLSTestConfig(configPath);
    }
    return RLSTestConfig.instance;
  }

  /**
   * デフォルト設定を取得
   */
  public getDefaultConfig(): TestRunnerConfig {
    return {
      sessionId: this.generateSessionId(),
      supabaseUrl: this.getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
      supabaseServiceRoleKey: this.getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      testEnvironment: this.getEnv('NODE_ENV', 'development') as any,
      gitCommitHash: this.getEnv('GITHUB_SHA') || this.getEnv('GIT_COMMIT_HASH'),
      reportOutputPath: this.getEnv('RLS_TEST_REPORT_PATH'),
      verbose: this.getBooleanEnv('RLS_TEST_VERBOSE', false),
      dryRun: this.getBooleanEnv('RLS_TEST_DRY_RUN', false),
      maxConcurrency: this.getNumberEnv('RLS_TEST_MAX_CONCURRENCY', 5),
      testTimeout: this.getNumberEnv('RLS_TEST_TIMEOUT', 30000),
    };
  }

  /**
   * 設定ファイルから設定を読み込み
   */
  public loadConfigFromFile(configPath?: string): Partial<TestRunnerConfig> {
    const filePath = configPath || this.configPath || join(process.cwd(), 'rls-test.config.json');
    
    if (!existsSync(filePath)) {
      console.warn(`Config file not found: ${filePath}`);
      return {};
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load config from ${filePath}: ${(error as Error).message}`);
    }
  }

  /**
   * 完全な設定を生成
   */
  public buildConfig(overrides: Partial<TestRunnerConfig> = {}): TestRunnerConfig {
    const defaultConfig = this.getDefaultConfig();
    const fileConfig = this.loadConfigFromFile();
    
    return {
      ...defaultConfig,
      ...fileConfig,
      ...overrides,
    };
  }

  /**
   * テスト環境のセットアップ情報を取得
   */
  public getTestEnvironmentSetup(): TestEnvironmentSetup {
    return {
      testOrganizations: [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'RLS Test Org Alpha',
          slug: 'rls-test-alpha',
          description: 'RLS検証用テスト組織A',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'RLS Test Org Beta',
          slug: 'rls-test-beta', 
          description: 'RLS検証用テスト組織B',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'RLS Test Org Gamma',
          slug: 'rls-test-gamma',
          description: 'RLS検証用テスト組織C',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      testUsers: [
        {
          id: '00000000-0000-0000-0000-000000000001',
          test_user_type: 'org_owner',
          email: 'test.owner@rlstest.local',
          test_organization_id: '550e8400-e29b-41d4-a716-446655440001',
          test_role: 'owner',
          is_active: true,
          created_at: new Date().toISOString(),
          metadata: { created_for_testing: true },
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          test_user_type: 'org_admin',
          email: 'test.admin@rlstest.local',
          test_organization_id: '550e8400-e29b-41d4-a716-446655440001',
          test_role: 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
          metadata: { created_for_testing: true },
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          test_user_type: 'org_member',
          email: 'test.member@rlstest.local',
          test_organization_id: '550e8400-e29b-41d4-a716-446655440001',
          test_role: 'member',
          is_active: true,
          created_at: new Date().toISOString(),
          metadata: { created_for_testing: true },
        },
        {
          id: '00000000-0000-0000-0000-000000000004',
          test_user_type: 'org_viewer',
          email: 'test.viewer@rlstest.local',
          test_organization_id: '550e8400-e29b-41d4-a716-446655440001',
          test_role: 'viewer',
          is_active: true,
          created_at: new Date().toISOString(),
          metadata: { created_for_testing: true },
        },
        {
          id: '00000000-0000-0000-0000-000000000005',
          test_user_type: 'no_org',
          email: 'test.noorg@rlstest.local',
          is_active: true,
          created_at: new Date().toISOString(),
          metadata: { created_for_testing: true },
        },
        {
          id: '00000000-0000-0000-0000-000000000006',
          test_user_type: 'cross_org',
          email: 'test.cross@rlstest.local',
          test_organization_id: '550e8400-e29b-41d4-a716-446655440002',
          test_role: 'member',
          is_active: true,
          created_at: new Date().toISOString(),
          metadata: { created_for_testing: true },
        },
      ],
    };
  }

  private generateSessionId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `rls-test-${timestamp}-${randomSuffix}`;
  }

  private getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  private getEnv(key: string, defaultValue?: string): string | undefined {
    return process.env[key] || defaultValue;
  }

  private getBooleanEnv(key: string, defaultValue: boolean = false): boolean {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  private getNumberEnv(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
}

/**
 * 標準テストケース生成器
 */
export class TestCaseGenerator {
  
  /**
   * 組織境界テストケース生成
   */
  public static generateOrganizationBoundaryTests(
    testUsers: Map<TestUserType, TestUserContext>
  ): TestCaseDefinition[] {
    const tests: TestCaseDefinition[] = [];
    const orgOwner = testUsers.get('org_owner')!;
    const crossOrgUser = testUsers.get('cross_org')!;
    const noOrgUser = testUsers.get('no_org')!;

    // 基本的な組織アクセステスト
    tests.push(
      {
        name: 'owner_can_read_own_organization',
        category: 'organization_boundary',
        table: 'organizations',
        user: orgOwner,
        query: `SELECT id, name FROM organizations WHERE id = '${orgOwner.organizationId}'`,
        expectedResult: 'allow',
        description: 'Organization owner should be able to read their own organization',
        tags: ['basic', 'read', 'organization'],
      },
      {
        name: 'cross_org_user_cannot_read_other_org',
        category: 'organization_boundary',
        table: 'organizations',
        user: crossOrgUser,
        query: `SELECT id, name FROM organizations WHERE id = '${orgOwner.organizationId}'`,
        expectedResult: 'deny',
        description: 'User from different organization should not access other organization data',
        tags: ['boundary', 'read', 'organization'],
      },
      {
        name: 'no_org_user_cannot_read_any_org',
        category: 'organization_boundary',
        table: 'organizations',
        user: noOrgUser,
        query: `SELECT id, name FROM organizations WHERE id = '${orgOwner.organizationId}'`,
        expectedResult: 'deny',
        description: 'User without organization should not access any organization data',
        tags: ['boundary', 'read', 'organization'],
      }
    );

    // 組織メンバーシップテスト
    tests.push(
      {
        name: 'cannot_insert_into_other_org_members',
        category: 'organization_boundary',
        table: 'organization_members',
        user: crossOrgUser,
        query: `INSERT INTO organization_members (organization_id, user_id, role) VALUES ('${orgOwner.organizationId}', '${crossOrgUser.id}', 'member')`,
        expectedResult: 'deny',
        description: 'User should not be able to add themselves to another organization',
        tags: ['boundary', 'insert', 'membership'],
      }
    );

    return tests;
  }

  /**
   * ロール権限テストケース生成
   */
  public static generateRolePermissionTests(
    testUsers: Map<TestUserType, TestUserContext>
  ): TestCaseDefinition[] {
    const tests: TestCaseDefinition[] = [];
    const roles: Array<{ userType: TestUserType; role: OrgRole }> = [
      { userType: 'org_owner', role: 'owner' },
      { userType: 'org_admin', role: 'admin' },
      { userType: 'org_member', role: 'member' },
      { userType: 'org_viewer', role: 'viewer' },
    ];

    // 読み取り権限テスト（全ロールが可能）
    roles.forEach(({ userType, role }) => {
      const user = testUsers.get(userType)!;
      tests.push({
        name: `${role}_can_read_org_data`,
        category: 'role_permission',
        table: 'organizations',
        user,
        query: `SELECT name, description FROM organizations WHERE id = '${user.organizationId}'`,
        expectedResult: 'allow',
        description: `${role} should be able to read organization data`,
        tags: ['role', 'read', role],
      });
    });

    // 更新権限テスト（viewer以外が可能）
    roles.filter(r => r.role !== 'viewer').forEach(({ userType, role }) => {
      const user = testUsers.get(userType)!;
      tests.push({
        name: `${role}_can_update_org_data`,
        category: 'role_permission',
        table: 'organizations',
        user,
        query: `UPDATE organizations SET description = 'Updated by ${role}' WHERE id = '${user.organizationId}'`,
        expectedResult: 'allow',
        description: `${role} should be able to update organization data`,
        tags: ['role', 'update', role],
      });
    });

    // viewer の更新拒否テスト
    const viewer = testUsers.get('org_viewer')!;
    tests.push({
      name: 'viewer_cannot_update_org_data',
      category: 'role_permission',
      table: 'organizations',
      user: viewer,
      query: `UPDATE organizations SET description = 'Updated by viewer' WHERE id = '${viewer.organizationId}'`,
      expectedResult: 'deny',
      description: 'Viewer should not be able to update organization data',
      tags: ['role', 'update', 'viewer', 'deny'],
    });

    return tests;
  }

  /**
   * コンテンツアクセステストケース生成
   */
  public static generateContentAccessTests(
    testUsers: Map<TestUserType, TestUserContext>
  ): TestCaseDefinition[] {
    const tests: TestCaseDefinition[] = [];
    const orgMember = testUsers.get('org_member')!;
    const crossOrgUser = testUsers.get('cross_org')!;
    const noOrgUser = testUsers.get('no_org')!;

    // QAエントリアクセステスト
    tests.push(
      {
        name: 'member_can_access_org_qa_entries',
        category: 'content_access',
        table: 'qa_entries',
        user: orgMember,
        query: `SELECT id, question FROM qa_entries WHERE organization_id = '${orgMember.organizationId}' LIMIT 5`,
        expectedResult: 'allow',
        description: 'Organization member should access organization QA entries',
        tags: ['content', 'qa_entries', 'member'],
      },
      {
        name: 'cross_org_user_cannot_access_other_org_qa',
        category: 'content_access',
        table: 'qa_entries',
        user: crossOrgUser,
        query: `SELECT id, question FROM qa_entries WHERE organization_id = '${orgMember.organizationId}' LIMIT 5`,
        expectedResult: 'deny',
        description: 'User should not access another organization QA entries',
        tags: ['content', 'qa_entries', 'boundary'],
      }
    );

    // ケーススタディアクセステスト
    tests.push(
      {
        name: 'member_can_access_org_case_studies',
        category: 'content_access',
        table: 'case_studies',
        user: orgMember,
        query: `SELECT id, title FROM case_studies WHERE organization_id = '${orgMember.organizationId}' LIMIT 5`,
        expectedResult: 'allow',
        description: 'Organization member should access organization case studies',
        tags: ['content', 'case_studies', 'member'],
      }
    );

    return tests;
  }

  /**
   * セキュリティ分離テストケース生成
   */
  public static generateSecurityIsolationTests(
    testUsers: Map<TestUserType, TestUserContext>
  ): TestCaseDefinition[] {
    const tests: TestCaseDefinition[] = [];
    const orgMember = testUsers.get('org_member')!;
    const crossOrgUser = testUsers.get('cross_org')!;

    // データリーク防止テスト
    tests.push(
      {
        name: 'cannot_access_other_org_data_via_join',
        category: 'security_isolation',
        table: 'qa_entries',
        user: crossOrgUser,
        query: `
          SELECT qe.id, qe.question, o.name as org_name 
          FROM qa_entries qe 
          JOIN organizations o ON qe.organization_id = o.id 
          WHERE o.id = '${orgMember.organizationId}'
          LIMIT 1
        `,
        expectedResult: 'deny',
        description: 'User should not access other organization data via JOIN operations',
        tags: ['security', 'join', 'isolation'],
      },
      {
        name: 'cannot_access_other_org_via_subquery',
        category: 'security_isolation',
        table: 'qa_entries',
        user: crossOrgUser,
        query: `
          SELECT id, question 
          FROM qa_entries 
          WHERE organization_id IN (
            SELECT id FROM organizations WHERE id = '${orgMember.organizationId}'
          )
          LIMIT 1
        `,
        expectedResult: 'deny',
        description: 'User should not access other organization data via subqueries',
        tags: ['security', 'subquery', 'isolation'],
      }
    );

    return tests;
  }

  /**
   * 全テストスイートを生成
   */
  public static generateAllTestSuites(
    testUsers: Map<TestUserType, TestUserContext>
  ): TestSuiteDefinition[] {
    return [
      {
        name: 'Organization Boundary Tests',
        description: 'Tests for organization-level data isolation',
        category: 'organization_boundary',
        testCases: this.generateOrganizationBoundaryTests(testUsers),
      },
      {
        name: 'Role Permission Tests',
        description: 'Tests for role-based access control within organizations',
        category: 'role_permission',
        testCases: this.generateRolePermissionTests(testUsers),
      },
      {
        name: 'Content Access Tests',
        description: 'Tests for content-level access control',
        category: 'content_access',
        testCases: this.generateContentAccessTests(testUsers),
      },
      {
        name: 'Security Isolation Tests',
        description: 'Tests for security isolation and data leak prevention',
        category: 'security_isolation',
        testCases: this.generateSecurityIsolationTests(testUsers),
      },
    ];
  }
}

/**
 * 設定検証ユーティリティ
 */
export class ConfigValidator {
  
  /**
   * テスト設定の検証
   */
  public static validateConfig(config: TestRunnerConfig): void {
    const errors: string[] = [];

    if (!config.sessionId) {
      errors.push('sessionId is required');
    }

    if (!config.supabaseUrl) {
      errors.push('supabaseUrl is required');
    }

    if (!config.supabaseServiceRoleKey) {
      errors.push('supabaseServiceRoleKey is required');
    }

    if (!['development', 'staging', 'production'].includes(config.testEnvironment)) {
      errors.push('testEnvironment must be one of: development, staging, production');
    }

    if (config.maxConcurrency && (config.maxConcurrency < 1 || config.maxConcurrency > 20)) {
      errors.push('maxConcurrency must be between 1 and 20');
    }

    if (config.testTimeout && (config.testTimeout < 1000 || config.testTimeout > 300000)) {
      errors.push('testTimeout must be between 1000ms and 300000ms');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * 環境変数の存在確認
   */
  public static validateEnvironment(): void {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}

export default RLSTestConfig;