/**
 * DEPRECATED - not used, kept only for reference
 * 
 * P1-6: RLS Test Runner Type Definitions
 * 
 * TypeScript型定義とインターフェース
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ===================================
// Core Types
// ===================================

export interface DatabaseUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
  updated_at: string;
}

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

// ===================================
// RLS Test Infrastructure Types
// ===================================

export interface RLSTestResult {
  id: string;
  test_session_id: string;
  test_name: string;
  test_category: string;
  table_name: string;
  policy_name?: string;
  test_user_id?: string;
  test_org_id?: string;
  test_role?: string;
  expected_result: TestExpectedResult;
  actual_result: TestActualResult;
  test_query: string;
  error_message?: string;
  execution_time_ms?: number;
  status: TestStatus;
  created_at: string;
  additional_data?: Record<string, any>;
}

export interface RLSPolicySnapshot {
  id: string;
  snapshot_name: string;
  table_name: string;
  policy_name: string;
  policy_definition: string;
  policy_type: string;
  roles?: string[];
  created_at: string;
  git_commit_hash?: string;
  environment: string;
}

export interface RLSTestUser {
  id: string;
  test_user_type: TestUserType;
  email: string;
  test_organization_id?: string;
  test_role?: string;
  is_active: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

// ===================================
// Test Execution Types
// ===================================

export type TestUserType = 'org_owner' | 'org_admin' | 'org_member' | 'org_viewer' | 'no_org' | 'cross_org';
export type TestExpectedResult = 'allow' | 'deny' | 'partial';
export type TestActualResult = 'allow' | 'deny' | 'partial' | 'error';
export type TestStatus = 'pass' | 'fail' | 'error' | 'skip';
export type TestCategory = 
  | 'organization_boundary' 
  | 'role_permission' 
  | 'content_access' 
  | 'cross_organization' 
  | 'anonymous_access'
  | 'data_integrity'
  | 'security_isolation';

export interface TestUserContext {
  id: string;
  email: string;
  type: TestUserType;
  organizationId?: string;
  role?: OrgRole;
  accessToken?: string;
  supabaseClient?: SupabaseClient;
}

export interface TestCaseDefinition {
  name: string;
  category: TestCategory;
  table: string;
  policy?: string;
  user: TestUserContext;
  targetOrgId?: string;
  query: string;
  expectedResult: TestExpectedResult;
  description: string;
  tags?: string[];
  prerequisites?: string[];
  cleanup?: string[];
}

export interface TestExecutionResult {
  testName: string;
  category: TestCategory;
  table: string;
  policy?: string;
  user: TestUserContext;
  expected: TestExpectedResult;
  actual: TestActualResult;
  status: TestStatus;
  executionTimeMs: number;
  errorMessage?: string;
  query: string;
  metadata?: Record<string, any>;
}

export interface TestSuiteDefinition {
  name: string;
  description: string;
  category: TestCategory;
  testCases: TestCaseDefinition[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

// ===================================
// Configuration Types
// ===================================

export interface TestRunnerConfig {
  sessionId: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  testEnvironment: 'development' | 'staging' | 'production';
  gitCommitHash?: string;
  reportOutputPath?: string;
  verbose?: boolean;
  dryRun?: boolean;
  maxConcurrency?: number;
  testTimeout?: number;
}

export interface TestEnvironmentSetup {
  testOrganizations: Organization[];
  testUsers: RLSTestUser[];
  testData?: Record<string, any[]>;
}

export interface TestSessionSummary {
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
  testSuites: TestSuiteResult[];
}

export interface TestSuiteResult {
  name: string;
  category: TestCategory;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  errorTests: number;
  executionTimeMs: number;
  tests: TestExecutionResult[];
}

// ===================================
// Database Function Types
// ===================================

export interface DumpRLSPoliciesResult {
  table_name: string;
  policy_name: string;
  policy_type: string;
  roles: string[];
  policy_definition: string;
}

export interface CreateRLSSnapshotResult {
  snapshot_id: string;
  policies_count: number;
}

export interface SetupTestUserParams {
  user_type_param: TestUserType;
  email_param: string;
  org_id_param?: string;
  role_param?: string;
}

export interface RecordTestResultParams {
  session_id_param: string;
  test_name_param: string;
  category_param: string;
  table_name_param: string;
  policy_name_param?: string;
  test_user_id_param?: string;
  test_org_id_param?: string;
  test_role_param?: string;
  expected_param: string;
  actual_param: string;
  query_param: string;
  status_param: string;
  execution_time_param?: number;
  error_msg_param?: string;
}

export interface TestSummaryQueryResult {
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  error_tests: number;
  skipped_tests: number;
  success_rate: number;
}

// ===================================
// Report Types
// ===================================

export interface TestReport {
  summary: TestSessionSummary;
  results: TestExecutionResult[];
  config: {
    sessionId: string;
    environment: string;
    gitCommitHash?: string;
  };
  metadata: {
    generatedAt: string;
    runner: string;
    version: string;
  };
  coverage?: PolicyCoverageReport;
}

export interface PolicyCoverageReport {
  totalPolicies: number;
  testedPolicies: number;
  coveragePercentage: number;
  untestedPolicies: PolicyInfo[];
  policyResults: Record<string, PolicyTestResult>;
}

export interface PolicyInfo {
  tableName: string;
  policyName: string;
  policyType: string;
  definition: string;
}

export interface PolicyTestResult {
  policyName: string;
  tableName: string;
  testCount: number;
  passCount: number;
  failCount: number;
  errorCount: number;
  tests: TestExecutionResult[];
}

// ===================================
// Error Types
// ===================================

export class RLSTestError extends Error {
  constructor(
    message: string,
    public code: 'SETUP_FAILED' | 'TEST_EXECUTION_FAILED' | 'CONFIG_INVALID' | 'DB_CONNECTION_FAILED',
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'RLSTestError';
  }
}

export class TestTimeoutError extends Error {
  constructor(testName: string, timeoutMs: number) {
    super(`Test "${testName}" timed out after ${timeoutMs}ms`);
    this.name = 'TestTimeoutError';
  }
}

export class TestSetupError extends Error {
  constructor(step: string, cause?: Error) {
    super(`Test setup failed at step: ${step}${cause ? ` - ${cause.message}` : ''}`);
    this.name = 'TestSetupError';
  }
}

// ===================================
// Utility Types
// ===================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type TestFilter = {
  categories?: TestCategory[];
  tables?: string[];
  userTypes?: TestUserType[];
  tags?: string[];
  status?: TestStatus[];
};

export type TestHook = {
  beforeAll?: () => Promise<void>;
  afterAll?: () => Promise<void>;
  beforeEach?: (testCase: TestCaseDefinition) => Promise<void>;
  afterEach?: (result: TestExecutionResult) => Promise<void>;
};

// ===================================
// CLI Types
// ===================================

export interface CLIOptions {
  config?: string;
  sessionId?: string;
  environment?: string;
  verbose?: boolean;
  dryRun?: boolean;
  filter?: string;
  output?: string;
  gitCommit?: string;
  maxConcurrency?: number;
  timeout?: number;
}

export interface CLICommand {
  name: string;
  description: string;
  options: CLIOptions;
  action: (options: CLIOptions) => Promise<void>;
}