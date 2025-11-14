/**
 * Enforcement System Test Helpers
 * テスト環境で enforcement システムをテストするためのヘルパー関数
 */

import { NextRequest } from 'next/server';

// テスト用の NextRequest モック作成
export function createMockRequest(body: any, headers: Record<string, string> = {}): NextRequest {
  const mockHeaders = new Headers();
  
  // デフォルトヘッダー設定
  mockHeaders.set('content-type', 'application/json');
  mockHeaders.set('x-forwarded-for', 'test-ip-127.0.0.1');
  
  // 追加ヘッダー設定
  Object.entries(headers).forEach(([key, value]) => {
    mockHeaders.set(key, value);
  });

  // NextRequest のモック作成
  const request = {
    json: async () => body,
    headers: mockHeaders,
    url: 'http://localhost:3000/api/enforcement/test',
    method: 'POST'
  } as unknown as NextRequest;

  return request;
}

// テスト用の管理者認証モック設定
export const mockAdminAuthSuccess = {
  success: true,
  context: {
    user: {
      id: 'test-admin-user-id',
      email: 'admin@test.local'
    }
  }
};

export const mockAdminAuthFailure = {
  success: false,
  error: 'Unauthorized access',
  context: null
};

// テスト用ユーザーデータ生成
export function generateTestUser(overrides: Partial<any> = {}) {
  const timestamp = Date.now();
  // Generate a valid UUID for testing
  const testUuid = 'a0b1c2d3-e4f5-6789-abcd-' + timestamp.toString().slice(-12).padStart(12, '0');
  return {
    id: testUuid,
    email: `test-${timestamp}@example.com`,
    name: `Test User ${timestamp}`,
    account_status: 'active',
    created_at: new Date().toISOString(),
    ...overrides
  };
}

// テスト用組織データ生成
export function generateTestOrganization(userId: string, overrides: Partial<any> = {}) {
  const timestamp = Date.now();
  return {
    id: `test-org-${timestamp}`,
    name: `Test Organization ${timestamp}`,
    slug: `test-org-${timestamp}`,
    description: 'Test organization for enforcement testing',
    created_by: userId,
    is_published: true,
    status: 'published',
    created_at: new Date().toISOString(),
    ...overrides
  };
}

// テスト用コンテンツデータ生成
export function generateTestContent(orgId: string, userId: string, type: 'post' | 'service' | 'case_study' | 'faq', overrides: Partial<any> = {}) {
  const timestamp = Date.now();
  
  const baseContent = {
    id: `test-${type}-${timestamp}`,
    organization_id: orgId,
    created_by: userId,
    is_published: true,
    status: 'published',
    created_at: new Date().toISOString()
  };

  switch (type) {
    case 'post':
      return {
        ...baseContent,
        title: `Test Post ${timestamp}`,
        body: 'Test post content for enforcement testing',
        ...overrides
      };
    case 'service':
      return {
        ...baseContent,
        name: `Test Service ${timestamp}`,
        description: 'Test service description',
        ...overrides
      };
    case 'case_study':
      return {
        ...baseContent,
        title: `Test Case Study ${timestamp}`,
        ...overrides
      };
    case 'faq':
      return {
        ...baseContent,
        question: `Test FAQ Question ${timestamp}`,
        answer: 'Test FAQ answer',
        ...overrides
      };
    default:
      return baseContent;
  }
}

// テスト環境判定
export function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
}

// テスト用ログモック
export const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Supabase クライアントモック作成ヘルパー
export function createSupabaseMock() {
  const mockSelect = jest.fn().mockReturnThis();
  const mockInsert = jest.fn().mockReturnThis();
  const mockUpdate = jest.fn().mockReturnThis();
  const mockDelete = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockReturnThis();
  const mockIn = jest.fn().mockReturnThis();
  const mockSingle = jest.fn();
  const mockRpc = jest.fn();

  const mockFrom = jest.fn().mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    in: mockIn,
    single: mockSingle
  });

  const supabaseMock = {
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      getUser: jest.fn()
    }
  };

  return {
    supabaseMock,
    mockMethods: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      in: mockIn,
      single: mockSingle,
      rpc: mockRpc
    }
  };
}