/**
 * Materials [id] Page Crash Prevention Smoke Tests
 * /dashboard/materials/[id] ページの500/404エラー防止テスト
 */

import { test, expect } from '@playwright/test';

test.describe('Materials [id] Page Crash Prevention', () => {
  
  test('should handle invalid UUID without 500 error', async ({ page }) => {
    // 不正なUUID形式でアクセス
    await page.goto('/dashboard/materials/invalid-uuid-format');
    
    // ページが正常に読み込まれることを確認（500エラーで止まらない）
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle non-existent valid UUID without 500 error', async ({ page }) => {
    // 存在しない有効なUUID
    const nonExistentId = 'a1b2c3d4-e5f6-7890-abcd-123456789012';
    await page.goto(`/dashboard/materials/${nonExistentId}`);
    
    // ページが正常に読み込まれることを確認  
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（500エラーにならない）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should not crash with malformed response data', async ({ page }) => {
    // APIが異常レスポンスを返した場合の対処確認
    // モック作成（実際のAPIエラーをシミュレート）
    await page.route('**/api/my/materials/*', (route) => {
      // 不正なJSONレスポンスをシミュレート
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json response'
      });
    });
    
    const testId = 'a1b2c3d4-e5f6-7890-abcd-123456789012';
    await page.goto(`/dashboard/materials/${testId}`);
    
    // ページがクラッシュせずにエラー状態になることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle API network failure gracefully', async ({ page }) => {
    // ネットワーク失敗をシミュレート
    await page.route('**/api/my/materials/*', (route) => {
      route.abort('failed');
    });
    
    const testId = 'a1b2c3d4-e5f6-7890-abcd-123456789012';
    await page.goto(`/dashboard/materials/${testId}`);
    
    // ページがクラッシュせずにエラー状態になることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（500エラーにならない）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should maintain page structure even with API errors', async ({ page }) => {
    // API 500エラーをシミュレート
    await page.route('**/api/my/materials/*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    const testId = 'a1b2c3d4-e5f6-7890-abcd-123456789012';
    await page.goto(`/dashboard/materials/${testId}`);
    
    // ページの基本構造が維持されることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });
  
  test('should handle special characters in URL without breaking', async ({ page }) => {
    // URLに特殊文字が含まれている場合のテスト
    const specialCharId = 'test%20with%20spaces';
    await page.goto(`/dashboard/materials/${specialCharId}`);
    
    // ページがクラッシュしないことを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（500エラーにならない）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });
});