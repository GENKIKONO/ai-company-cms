/**
 * RLS Policy Test Suite
 * Row Level Security ポリシーの包括的テストシステム
 */

import { createClient } from '@supabase/supabase-js';
import { Organization, Service, CaseStudy, FAQ } from '@/types/database';

export interface RLSTestConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string;
}

export interface RLSTestResult {
  testName: string;
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  userRole: 'admin' | 'partner' | 'org_owner' | 'unauthorized';
  expected: 'ALLOW' | 'DENY';
  actual: 'ALLOW' | 'DENY' | 'ERROR';
  passed: boolean;
  error?: string;
  executionTime: number;
}

export interface RLSTestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  errorTests: number;
  successRate: number;
  results: RLSTestResult[];
  failedResults: RLSTestResult[];
}

export class RLSTestRunner {
  private config: RLSTestConfig;
  private serviceClient: any;
  private results: RLSTestResult[] = [];

  constructor(config: RLSTestConfig) {
    this.config = config;
    this.serviceClient = createClient(config.supabaseUrl, config.supabaseServiceKey);
  }

  /**
   * 既存テストデータをクリーンアップ
   */
  private async cleanupTestData() {
    try {
      const testEmails = [
        'admin@test.com',
        'partner1@test.com', 
        'partner2@test.com',
        'orgowner1@test.com',
        'orgowner2@test.com'
      ];

      // 既存のテストユーザーを削除
      for (const email of testEmails) {
        try {
          await this.serviceClient.auth.admin.deleteUser({
            email
          });
        } catch (error) {
          // ユーザーが存在しない場合はエラーを無視
        }
      }

      // テストデータをクリーンアップ
      await this.serviceClient.from('services').delete().ilike('name', '%test%');
      await this.serviceClient.from('organizations').delete().ilike('name', '%test%');
      
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  }

  /**
   * テストユーザーを作成
   */
  private async createTestUsers() {
    // まずクリーンアップを実行
    await this.cleanupTestData();

    // 固定UUIDを使用してエラーを回避
    const fixedPartnerId1 = '550e8400-e29b-41d4-a716-446655440001';
    const fixedPartnerId2 = '550e8400-e29b-41d4-a716-446655440002';
    
    const users = [
      { email: 'admin@test.com', role: 'admin', partnerId: null },
      { email: 'partner1@test.com', role: 'partner', partnerId: fixedPartnerId1 },
      { email: 'partner2@test.com', role: 'partner', partnerId: fixedPartnerId2 },
      { email: 'orgowner1@test.com', role: 'org_owner', partnerId: null },
      { email: 'orgowner2@test.com', role: 'org_owner', partnerId: null },
    ];

    const createdUsers = [];

    for (const userData of users) {
      try {
        // ユーザー作成
        const { data: authUser, error: authError } = await this.serviceClient.auth.admin.createUser({
          email: userData.email,
          password: 'test-password-123',
          email_confirm: true,
        });

        if (authError) throw authError;

        // app_users テーブルに登録
        const { error: appUserError } = await this.serviceClient
          .from('app_users')
          .insert({
            id: authUser.user.id,
            role: userData.role,
            partner_id: userData.partnerId,
          });

        if (appUserError) throw appUserError;

        createdUsers.push({
          id: authUser.user.id,
          email: userData.email,
          role: userData.role,
          partnerId: userData.partnerId,
        });
      } catch (error) {
        console.warn(`Failed to create test user ${userData.email}:`, error);
      }
    }

    return createdUsers;
  }

  /**
   * テストデータを作成
   */
  private async createTestData(users: any[]) {
    const adminUser = users.find(u => u.role === 'admin');
    const partner1User = users.find(u => u.role === 'partner');
    const orgOwner1 = users.find(u => u.role === 'org_owner');

    // 固定UUIDを使用してエラーを回避
    const fixedPartnerId1 = '550e8400-e29b-41d4-a716-446655440001';
    const fixedPartnerId2 = '550e8400-e29b-41d4-a716-446655440002';

    // テスト用組織を作成
    const testOrg1 = {
      name: 'Test Organization 1',
      slug: 'test-org-1',
      description: 'Test organization for RLS testing',
      address_country: 'JP',
      address_region: 'Tokyo',
      address_locality: 'Shibuya',
      telephone: '03-1234-5678',
      email_public: false,
      status: 'published',
      is_published: true,
      partner_id: fixedPartnerId1,
      created_by: orgOwner1?.id,
    };

    const testOrg2 = {
      name: 'Test Organization 2',
      slug: 'test-org-2',
      description: 'Another test organization for RLS testing',
      address_country: 'JP',
      address_region: 'Osaka',
      address_locality: 'Namba',
      telephone: '06-1234-5678',
      email_public: false,
      status: 'draft',
      is_published: false,
      partner_id: fixedPartnerId2,
      created_by: users.find(u => u.email === 'orgowner2@test.com')?.id,
    };

    const { data: orgs, error: orgError } = await this.serviceClient
      .from('organizations')
      .insert([testOrg1, testOrg2])
      .select();

    if (orgError) throw orgError;

    return { organizations: orgs, users };
  }

  /**
   * 特定のユーザーとしてクライアントを作成
   */
  private async createUserClient(userEmail: string): Promise<any> {
    const client = createClient(this.config.supabaseUrl, this.config.supabaseAnonKey);
    
    const { error } = await client.auth.signInWithPassword({
      email: userEmail,
      password: 'test-password-123',
    });

    if (error) throw error;
    return client;
  }

  /**
   * Organizations テーブルのRLSテスト
   */
  private async testOrganizationsRLS(testData: any): Promise<RLSTestResult[]> {
    const results: RLSTestResult[] = [];
    const { organizations, users } = testData;

    const testCases = [
      // Admin - 全権限
      { userEmail: 'admin@test.com', operation: 'SELECT' as const, expected: 'ALLOW' as const },
      { userEmail: 'admin@test.com', operation: 'INSERT' as const, expected: 'ALLOW' as const },
      { userEmail: 'admin@test.com', operation: 'UPDATE' as const, expected: 'ALLOW' as const },
      { userEmail: 'admin@test.com', operation: 'DELETE' as const, expected: 'ALLOW' as const },
      
      // Partner - 自社のみ
      { userEmail: 'partner1@test.com', operation: 'SELECT' as const, expected: 'ALLOW' as const, targetOrgIndex: 0 },
      { userEmail: 'partner1@test.com', operation: 'SELECT' as const, expected: 'DENY' as const, targetOrgIndex: 1 },
      { userEmail: 'partner1@test.com', operation: 'UPDATE' as const, expected: 'ALLOW' as const, targetOrgIndex: 0 },
      { userEmail: 'partner1@test.com', operation: 'UPDATE' as const, expected: 'DENY' as const, targetOrgIndex: 1 },
      
      // Org Owner - 自分の組織のみ
      { userEmail: 'orgowner1@test.com', operation: 'SELECT' as const, expected: 'ALLOW' as const, targetOrgIndex: 0 },
      { userEmail: 'orgowner1@test.com', operation: 'SELECT' as const, expected: 'DENY' as const, targetOrgIndex: 1 },
      { userEmail: 'orgowner1@test.com', operation: 'UPDATE' as const, expected: 'ALLOW' as const, targetOrgIndex: 0 },
      { userEmail: 'orgowner1@test.com', operation: 'UPDATE' as const, expected: 'DENY' as const, targetOrgIndex: 1 },
    ];

    for (const testCase of testCases) {
      const startTime = Date.now();
      
      try {
        const userClient = await this.createUserClient(testCase.userEmail);
        let actual: 'ALLOW' | 'DENY' | 'ERROR' = 'ERROR';
        let error: string | undefined;

        const targetOrg = testCase.targetOrgIndex !== undefined 
          ? organizations[testCase.targetOrgIndex] 
          : organizations[0];

        switch (testCase.operation) {
          case 'SELECT':
            const { data: selectData, error: selectError } = await userClient
              .from('organizations')
              .select('*')
              .eq('id', targetOrg.id);
            
            if (selectError) {
              actual = 'ERROR';
              error = selectError.message;
            } else {
              actual = selectData && selectData.length > 0 ? 'ALLOW' : 'DENY';
            }
            break;

          case 'INSERT':
            const { error: insertError } = await userClient
              .from('organizations')
              .insert({
                name: 'Test Insert Org',
                slug: 'test-insert-' + Date.now(),
                description: 'Test insert',
                address_region: 'Test',
                address_locality: 'Test',
                telephone: '03-0000-0000',
              });
            
            actual = insertError ? 'DENY' : 'ALLOW';
            if (insertError) error = insertError.message;
            break;

          case 'UPDATE':
            const { error: updateError } = await userClient
              .from('organizations')
              .update({ description: 'Updated by RLS test' })
              .eq('id', targetOrg.id);
            
            actual = updateError ? 'DENY' : 'ALLOW';
            if (updateError) error = updateError.message;
            break;

          case 'DELETE':
            const { error: deleteError } = await userClient
              .from('organizations')
              .delete()
              .eq('id', targetOrg.id);
            
            actual = deleteError ? 'DENY' : 'ALLOW';
            if (deleteError) error = deleteError.message;
            break;
        }

        const result: RLSTestResult = {
          testName: `${testCase.userEmail} ${testCase.operation} org ${testCase.targetOrgIndex || 0}`,
          table: 'organizations',
          operation: testCase.operation,
          userRole: testCase.userEmail.includes('admin') ? 'admin' : 
                   testCase.userEmail.includes('partner') ? 'partner' : 'org_owner',
          expected: testCase.expected,
          actual,
          passed: testCase.expected === actual,
          error,
          executionTime: Date.now() - startTime,
        };

        results.push(result);
      } catch (error: any) {
        results.push({
          testName: `${testCase.userEmail} ${testCase.operation} org ${testCase.targetOrgIndex || 0}`,
          table: 'organizations',
          operation: testCase.operation,
          userRole: testCase.userEmail.includes('admin') ? 'admin' : 
                   testCase.userEmail.includes('partner') ? 'partner' : 'org_owner',
          expected: testCase.expected,
          actual: 'ERROR',
          passed: false,
          error: error.message,
          executionTime: Date.now() - startTime,
        });
      }
    }

    return results;
  }

  /**
   * Services テーブルのRLSテスト
   */
  private async testServicesRLS(testData: any): Promise<RLSTestResult[]> {
    const results: RLSTestResult[] = [];
    const { organizations } = testData;

    // まずテスト用サービスを作成
    const testService = {
      organization_id: organizations[0].id,
      name: 'Test Service',
      description: 'Test service for RLS testing',
    };

    const { data: services, error: serviceError } = await this.serviceClient
      .from('services')
      .insert(testService)
      .select();

    if (serviceError) {
      results.push({
        testName: 'Create test service',
        table: 'services',
        operation: 'INSERT',
        userRole: 'admin',
        expected: 'ALLOW',
        actual: 'ERROR',
        passed: false,
        error: serviceError.message,
        executionTime: 0,
      });
      return results;
    }

    const testCases = [
      { userEmail: 'admin@test.com', operation: 'SELECT' as const, expected: 'ALLOW' as const },
      { userEmail: 'partner1@test.com', operation: 'SELECT' as const, expected: 'ALLOW' as const },
      { userEmail: 'partner2@test.com', operation: 'SELECT' as const, expected: 'DENY' as const },
      { userEmail: 'orgowner1@test.com', operation: 'SELECT' as const, expected: 'ALLOW' as const },
      { userEmail: 'orgowner2@test.com', operation: 'SELECT' as const, expected: 'DENY' as const },
    ];

    for (const testCase of testCases) {
      const startTime = Date.now();
      
      try {
        const userClient = await this.createUserClient(testCase.userEmail);
        const { data, error } = await userClient
          .from('services')
          .select('*')
          .eq('id', services[0].id);

        const actual: 'ALLOW' | 'DENY' | 'ERROR' = error ? 'ERROR' : 
          (data && data.length > 0 ? 'ALLOW' : 'DENY');

        results.push({
          testName: `${testCase.userEmail} ${testCase.operation} service`,
          table: 'services',
          operation: testCase.operation,
          userRole: testCase.userEmail.includes('admin') ? 'admin' : 
                   testCase.userEmail.includes('partner') ? 'partner' : 'org_owner',
          expected: testCase.expected,
          actual,
          passed: testCase.expected === actual,
          error: error?.message,
          executionTime: Date.now() - startTime,
        });
      } catch (error: any) {
        results.push({
          testName: `${testCase.userEmail} ${testCase.operation} service`,
          table: 'services',
          operation: testCase.operation,
          userRole: testCase.userEmail.includes('admin') ? 'admin' : 
                   testCase.userEmail.includes('partner') ? 'partner' : 'org_owner',
          expected: testCase.expected,
          actual: 'ERROR',
          passed: false,
          error: error.message,
          executionTime: Date.now() - startTime,
        });
      }
    }

    return results;
  }

  /**
   * 全RLSテストを実行
   */
  async runAllTests(): Promise<RLSTestSummary> {
    this.results = [];

    try {
      // テストユーザー作成
      const users = await this.createTestUsers();
      
      // テストデータ作成
      const testData = await this.createTestData(users);
      
      // Organizations RLSテスト
      const orgResults = await this.testOrganizationsRLS(testData);
      this.results.push(...orgResults);
      
      // Services RLSテスト
      const serviceResults = await this.testServicesRLS(testData);
      this.results.push(...serviceResults);

      // TODO: case_studies, faqs, contact_points テーブルのテストも追加

    } catch (error: any) {
      console.error('RLS Test Setup Error:', error);
      this.results.push({
        testName: 'Test Setup',
        table: 'setup',
        operation: 'SELECT',
        userRole: 'admin',
        expected: 'ALLOW',
        actual: 'ERROR',
        passed: false,
        error: error.message,
        executionTime: 0,
      });
    }

    // 結果集計
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed && r.actual !== 'ERROR').length;
    const errorTests = this.results.filter(r => r.actual === 'ERROR').length;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    return {
      totalTests,
      passedTests,
      failedTests,
      errorTests,
      successRate,
      results: this.results,
      failedResults: this.results.filter(r => !r.passed),
    };
  }

  /**
   * テストデータのクリーンアップ
   */
  async cleanup(): Promise<void> {
    try {
      // テスト用データを削除
      await this.serviceClient.from('services').delete().like('name', 'Test%');
      await this.serviceClient.from('organizations').delete().like('name', 'Test%');
      
      // テストユーザーを削除
      const testEmails = [
        'admin@test.com',
        'partner1@test.com', 
        'partner2@test.com',
        'orgowner1@test.com',
        'orgowner2@test.com'
      ];

      for (const email of testEmails) {
        try {
          const { data: user } = await this.serviceClient.auth.admin.getUserByEmail(email);
          if (user) {
            await this.serviceClient.auth.admin.deleteUser(user.id);
          }
        } catch (error) {
          // ユーザーが存在しない場合は無視
        }
      }
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  }
}

/**
 * RLSテスト結果をマークダウン形式でフォーマット
 */
export function formatRLSTestResults(summary: RLSTestSummary): string {
  const lines: string[] = [];
  
  lines.push('# RLS Policy Test Results');
  lines.push('');
  lines.push(`**Total Tests:** ${summary.totalTests}`);
  lines.push(`**Passed:** ${summary.passedTests} ✅`);
  lines.push(`**Failed:** ${summary.failedTests} ❌`);
  lines.push(`**Errors:** ${summary.errorTests} 🚨`);
  lines.push(`**Success Rate:** ${summary.successRate.toFixed(1)}%`);
  lines.push('');
  
  if (summary.failedResults.length > 0) {
    lines.push('## Failed Tests');
    lines.push('');
    summary.failedResults.forEach(result => {
      lines.push(`### ${result.testName}`);
      lines.push(`- **Table:** ${result.table}`);
      lines.push(`- **Operation:** ${result.operation}`);
      lines.push(`- **User Role:** ${result.userRole}`);
      lines.push(`- **Expected:** ${result.expected}`);
      lines.push(`- **Actual:** ${result.actual}`);
      if (result.error) {
        lines.push(`- **Error:** ${result.error}`);
      }
      lines.push(`- **Execution Time:** ${result.executionTime}ms`);
      lines.push('');
    });
  }
  
  lines.push('## All Test Results');
  lines.push('');
  lines.push('| Test Name | Table | Operation | User Role | Expected | Actual | Passed | Time (ms) |');
  lines.push('|-----------|-------|-----------|-----------|----------|--------|--------|-----------|');
  
  summary.results.forEach(result => {
    const passed = result.passed ? '✅' : '❌';
    lines.push(`| ${result.testName} | ${result.table} | ${result.operation} | ${result.userRole} | ${result.expected} | ${result.actual} | ${passed} | ${result.executionTime} |`);
  });
  
  return lines.join('\n');
}