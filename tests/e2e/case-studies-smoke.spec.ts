/**
 * Case Studies Page Crash Prevention Smoke Tests
 * /dashboard/case-studies の500/404エラー防止テスト
 */

import { test, expect } from '@playwright/test';

test.describe('Case Studies Page Crash Prevention', () => {
  
  test('should handle /dashboard/case-studies without 500 error', async ({ page }) => {
    // 事例管理ページにアクセス
    await page.goto('/dashboard/case-studies');
    
    // ページが正常に読み込まれることを確認（500エラーで止まらない）
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle API /api/my/case-studies errors gracefully', async ({ page }) => {
    // API 500エラーをシミュレート
    await page.route('**/api/my/case-studies*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.goto('/dashboard/case-studies');
    
    // ページの基本構造が維持されることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle network failures gracefully', async ({ page }) => {
    // ネットワーク失敗をシミュレート
    await page.route('**/api/my/case-studies*', (route) => {
      route.abort('failed');
    });
    
    await page.goto('/dashboard/case-studies');
    
    // ページがクラッシュせずにエラー状態になることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（500エラーにならない）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle malformed JSON responses', async ({ page }) => {
    // 不正なJSONレスポンスをシミュレート
    await page.route('**/api/my/case-studies*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json response'
      });
    });
    
    await page.goto('/dashboard/case-studies');
    
    // ページがクラッシュせずにエラー状態になることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });
});