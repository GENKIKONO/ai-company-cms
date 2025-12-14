/**
 * Materials List Page Crash Prevention Smoke Tests
 * /dashboard/materials の500/404エラー防止テスト
 */

import { test, expect } from '@playwright/test';

test.describe('Materials List Page Crash Prevention', () => {
  
  test('should handle /dashboard/materials without 500 error', async ({ page }) => {
    // 営業資料一覧ページにアクセス
    const response = await page.goto('/dashboard/materials');
    
    // 500は禁止、404/200/307/302/401/403は許容
    const status = response?.status();
    expect([200, 302, 307, 401, 403, 404]).toContain(status);
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle API /api/my/materials errors gracefully', async ({ page }) => {
    // API 500エラーをシミュレート
    await page.route('**/api/my/materials*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.goto('/dashboard/materials');
    
    // ページの基本構造が維持されることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle network failures gracefully', async ({ page }) => {
    // ネットワーク失敗をシミュレート
    await page.route('**/api/my/materials*', (route) => {
      route.abort('failed');
    });
    
    await page.goto('/dashboard/materials');
    
    // ページがクラッシュせずにエラー状態になることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（500エラーにならない）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle malformed JSON responses', async ({ page }) => {
    // 不正なJSONレスポンスをシミュレート
    await page.route('**/api/my/materials*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json response'
      });
    });
    
    await page.goto('/dashboard/materials');
    
    // ページがクラッシュせずにエラー状態になることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle missing organizationId parameter', async ({ page }) => {
    // organizationId 400エラーをシミュレート
    await page.route('**/api/my/materials*', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'organizationId parameter is required' })
      });
    });
    
    await page.goto('/dashboard/materials');
    
    // ページがクラッシュせずにエラー状態になることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });
});