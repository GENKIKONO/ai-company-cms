/**
 * ✅ CRITICAL TEST - Enforcement Auto-Unpublish Core Functionality
 * 
 * 📌 このテストの役割:
 * - Enforcement systemのauto-unpublish機能の最低限の動作保証
 * - RPC呼び出しが正しいパラメータで実行されることの検証
 * - エラーハンドリングの基本動作確認
 * 
 * 🎯 本番運用において、このテストは必須です:
 * - CI/CDで確実に実行される軽量テスト
 * - 複雑なDB接続やモック設定に依存しない
 * - Enforcementシステムの基本動作を担保
 * 
 * 📝 テスト範囲:
 * ✅ RPC 'unpublish_org_public_content_for_user' が正しいuser_idで呼び出される
 * ✅ 成功時のログ出力が適切に行われる
 * ✅ エラー時のログ出力とグレースフルな処理
 * ✅ 例外発生時の安全な処理
 * 
 * ❌ テスト範囲外（統合テストで検証）:
 * - 実際のDB状態の変更
 * - 複雑なenforcement action workflow
 * - RLS保護の実動作
 */

// Import after mocks are set up
let autoUnpublishPublicContentForUser: any;

// Simple mock for testing RPC calls
const mockRpc = jest.fn();
const mockSupabaseClient = {
  rpc: mockRpc
};

// Mock Supabase client creation
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

jest.mock('../lib/log', () => ({
  logger: mockLogger
}));

describe('Auto-Unpublish RPC Call Verification', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Import function after mocks are set up
    const shared = await import('../app/api/enforcement/actions/_shared');
    autoUnpublishPublicContentForUser = shared.autoUnpublishPublicContentForUser;
  });

  it('should call unpublish_org_public_content_for_user RPC with correct parameters', async () => {
    // Setup successful RPC response
    mockRpc.mockResolvedValue({ data: null, error: null });
    
    const testUserId = 'a0b1c2d3-e4f5-6789-abcd-123456789012';
    
    // Call auto-unpublish function directly
    await autoUnpublishPublicContentForUser(testUserId);
    
    // Verify RPC was called with correct parameters
    expect(mockRpc).toHaveBeenCalledWith('unpublish_org_public_content_for_user', {
      p_user_id: testUserId
    });
    
    // Verify it was called exactly once
    expect(mockRpc).toHaveBeenCalledTimes(1);
    
    // Verify success logging
    expect(mockLogger.info).toHaveBeenCalledWith(
      'auto_unpublish_success',
      expect.objectContaining({
        userId: testUserId,
        component: 'enforcement-auto-unpublish',
        rpc_function: 'unpublish_org_public_content_for_user'
      })
    );
  });

  it('should handle RPC errors gracefully', async () => {
    // Setup RPC error response
    mockRpc.mockResolvedValue({ 
      data: null, 
      error: { message: 'Test RPC error' } 
    });
    
    const testUserId = 'a0b1c2d3-e4f5-6789-abcd-123456789012';
    
    // Call auto-unpublish function - should not throw
    await autoUnpublishPublicContentForUser(testUserId);
    
    // Verify RPC was attempted
    expect(mockRpc).toHaveBeenCalledWith('unpublish_org_public_content_for_user', {
      p_user_id: testUserId
    });
    
    // Verify error was logged
    expect(mockLogger.error).toHaveBeenCalledWith(
      'auto_unpublish_failed',
      expect.objectContaining({
        userId: testUserId,
        error: 'Test RPC error',
        component: 'enforcement-auto-unpublish'
      })
    );
  });

  it('should handle RPC exceptions gracefully', async () => {
    // Setup RPC exception
    mockRpc.mockRejectedValue(new Error('Network error'));
    
    const testUserId = 'a0b1c2d3-e4f5-6789-abcd-123456789012';
    
    // Call auto-unpublish function - should not throw
    await expect(autoUnpublishPublicContentForUser(testUserId)).resolves.not.toThrow();
    
    // Verify error was logged
    expect(mockLogger.error).toHaveBeenCalledWith(
      'auto_unpublish_exception',
      expect.objectContaining({
        userId: testUserId,
        error: 'Network error',
        component: 'enforcement-auto-unpublish'
      })
    );
  });
});