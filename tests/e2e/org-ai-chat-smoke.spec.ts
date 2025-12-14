/**
 * Org AI Chat Page Smoke Tests
 * /dashboard/org-ai-chat ページの基本動作確認テスト
 */

import { test, expect } from '@playwright/test';

test.describe('Org AI Chat Page Smoke Tests', () => {
  
  test('should load org-ai-chat page without crashes', async ({ page }) => {
    // org-ai-chatページに直接アクセス
    await page.goto('/dashboard/org-ai-chat');
    
    // ページが正常に読み込まれることを確認（500/404エラーで止まらない）
    await expect(page.locator('body')).toBeVisible();
    
    // 基本的なページコンテンツが存在することを確認（認証リダイレクトでも可）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
    
    // 500/404エラーページでないことを確認
    const isErrorPage = await page.locator('text=500, text=404, text=Internal Server Error, text=Not Found').count() > 0;
    expect(isErrorPage).toBe(false);
  });

  test('should handle route access gracefully', async ({ page }) => {
    // ルートアクセスが500/404でクラッシュしないことを確認
    const response = await page.goto('/dashboard/org-ai-chat');
    
    // レスポンスステータスが500/404でないことを確認
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
    
    // ページが表示されること（認証リダイレクトも含む）
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle API endpoint availability', async ({ page }) => {
    // /api/my/org-docs/files へのアクセステスト
    const filesResponse = await page.request.get('/api/my/org-docs/files?organizationId=test-org-id');
    
    // 500エラーでないことを確認（401/403は期待される認証エラー）
    expect(filesResponse.status()).not.toBe(500);
    expect(filesResponse.status()).not.toBe(404);
  });

  test('should handle chat API endpoint availability', async ({ page }) => {
    // /api/my/org-docs/chat へのアクセステスト
    const chatResponse = await page.request.post('/api/my/org-docs/chat', {
      data: {
        query: 'test',
        organization_id: 'test-org-id'
      }
    });
    
    // 500エラーでないことを確認（401/403は期待される認証エラー）
    expect(chatResponse.status()).not.toBe(500);
    expect(chatResponse.status()).not.toBe(404);
  });
});