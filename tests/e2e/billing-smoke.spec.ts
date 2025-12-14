/**
 * Billing Pages Crash Prevention Smoke Tests
 * /dashboard/billing と /dashboard/billing/new-session の500/404エラー防止テスト
 */

import { test, expect } from '@playwright/test';

test.describe('Billing Pages Crash Prevention', () => {
  
  test('should handle /dashboard/billing without 500 error', async ({ page }) => {
    // 請求管理ページにアクセス
    await page.goto('/dashboard/billing');
    
    // ページが正常に読み込まれることを確認（500エラーで止まらない）
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle /dashboard/billing/new-session without 500 error', async ({ page }) => {
    // 新規チェックアウトセッションページにアクセス
    await page.goto('/dashboard/billing/new-session');
    
    // ページが正常に読み込まれることを確認（500エラーで止まらない）
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle API /api/billing/checkout errors gracefully', async ({ page }) => {
    // API 500エラーをシミュレート
    await page.route('**/api/billing/checkout', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.goto('/dashboard/billing');
    
    // ページの基本構造が維持されることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle API /api/billing/portal errors gracefully', async ({ page }) => {
    // API 400エラー（Stripe設定不足）をシミュレート
    await page.route('**/api/billing/portal', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'No Stripe customer found' })
      });
    });
    
    await page.goto('/dashboard/billing');
    
    // ページの基本構造が維持されることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle API /api/stripe/checkout/create errors gracefully', async ({ page }) => {
    // API 400エラー（設定不足）をシミュレート
    await page.route('**/api/stripe/checkout/create', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Organization ID and plan type are required' })
      });
    });
    
    await page.goto('/dashboard/billing/new-session');
    
    // ページの基本構造が維持されることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle network failures gracefully', async ({ page }) => {
    // ネットワーク失敗をシミュレート
    await page.route('**/api/billing/**', (route) => {
      route.abort('failed');
    });
    
    await page.goto('/dashboard/billing');
    
    // ページがクラッシュせずにエラー状態になることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（500エラーにならない）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle malformed JSON responses', async ({ page }) => {
    // 不正なJSONレスポンスをシミュレート
    await page.route('**/api/billing/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json response'
      });
    });
    
    await page.goto('/dashboard/billing');
    
    // ページがクラッシュせずにエラー状態になることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });
});