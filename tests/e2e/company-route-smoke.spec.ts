/**
 * Company Route Smoke Tests
 * /dashboard/company の500/404エラー防止テスト
 */

import { test, expect } from '@playwright/test';

test.describe('Company Route Crash Prevention', () => {
  
  test('should handle /dashboard/company without 500 error', async ({ page }) => {
    // 企業情報管理ページにアクセス
    const response = await page.goto('/dashboard/company');
    
    // 500/404は禁止、200/307/302/401/403は許容
    const status = response?.status();
    expect([200, 302, 307, 401, 403]).toContain(status);
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle organization errors gracefully', async ({ page }) => {
    // useOrganization エラーをシミュレート（API応答なし）
    await page.route('**/api/me*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.goto('/dashboard/company');
    
    // ページの基本構造が維持されることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle network failures gracefully', async ({ page }) => {
    // ネットワーク失敗をシミュレート
    await page.route('**/api/me*', (route) => {
      route.abort('failed');
    });
    
    await page.goto('/dashboard/company');
    
    // ページがクラッシュせずにエラー状態になることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（500エラーにならない）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should display organization info when available', async ({ page }) => {
    // 正常なorganization レスポンスをシミュレート
    await page.route('**/api/me*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            organizations: [{
              id: 'test-org-1',
              name: 'テスト組織',
              plan: 'basic'
            }]
          }
        })
      });
    });
    
    await page.goto('/dashboard/company');
    
    // 組織名が表示されることを確認
    await expect(page.locator('text=テスト組織')).toBeVisible();
    await expect(page.locator('text=企業情報管理')).toBeVisible();
  });

  test('should show empty state when no organization', async ({ page }) => {
    // 組織なしのレスポンスをシミュレート
    await page.route('**/api/me*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            organizations: []
          }
        })
      });
    });
    
    await page.goto('/dashboard/company');
    
    // 空状態メッセージが表示されることを確認
    await expect(page.locator('text=企業情報が見つかりません')).toBeVisible();
    
    // ページがクラッシュしていないことを確認
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should navigate from embed page to company page without 404', async ({ page }) => {
    // Embedページにアクセス
    await page.goto('/dashboard/embed');
    
    // 企業情報作成リンクが表示される条件をシミュレート（エラー表示状態）
    await page.route('**/api/my/embed*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: '企業情報を作成してください' })
      });
    });
    
    // ページを再読み込みしてエラー状態を作る
    await page.reload();
    
    // 企業情報作成リンクをクリック
    const companyLink = page.locator('text=企業情報を作成する');
    if (await companyLink.isVisible()) {
      const response = await Promise.all([
        page.waitForResponse(response => response.url().includes('/dashboard/company')),
        companyLink.click()
      ]);
      
      // 遷移先が404でないことを確認（302/307でのリダイレクトも許容）
      const finalResponse = response[0];
      const status = finalResponse.status();
      expect([200, 302, 307, 401, 403]).toContain(status);
    }
    
    // 最終的にページがクラッシュしていないことを確認
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });
});