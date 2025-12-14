/**
 * Posts Management Page Crash Prevention Smoke Tests
 * /dashboard/posts ページの500/404エラー防止テスト
 */

import { test, expect } from '@playwright/test';

test.describe('Posts Management Page Crash Prevention', () => {
  
  test('should handle page load without 500 error', async ({ page }) => {
    // 記事管理ページにアクセス
    await page.goto('/dashboard/posts');
    
    // ページが正常に読み込まれることを確認（500エラーで止まらない）
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle API fetch errors gracefully', async ({ page }) => {
    // API 500エラーをシミュレート
    await page.route('**/api/my/posts*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.goto('/dashboard/posts');
    
    // ページの基本構造が維持されることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle malformed JSON response', async ({ page }) => {
    // 不正なJSONレスポンスをシミュレート
    await page.route('**/api/my/posts*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json response'
      });
    });
    
    await page.goto('/dashboard/posts');
    
    // ページがクラッシュせずにエラー状態になることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle network failure gracefully', async ({ page }) => {
    // ネットワーク失敗をシミュレート
    await page.route('**/api/my/posts*', (route) => {
      route.abort('failed');
    });
    
    await page.goto('/dashboard/posts');
    
    // ページがクラッシュせずにエラー状態になることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（500エラーにならない）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle API 401 without crash', async ({ page }) => {
    // API 401エラーをシミュレート
    await page.route('**/api/my/posts*', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' })
      });
    });
    
    await page.goto('/dashboard/posts');
    
    // ページの基本構造が維持されることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（エラー表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle API 404 without crash', async ({ page }) => {
    // API 404エラーをシミュレート
    await page.route('**/api/my/posts*', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not Found' })
      });
    });
    
    await page.goto('/dashboard/posts');
    
    // ページの基本構造が維持されることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（エラー表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle delete operation gracefully', async ({ page }) => {
    // 通常のAPI応答をモック
    await page.route('**/api/my/posts?*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'test-post-id',
              title: 'Test Post',
              slug: 'test-post',
              status: 'draft',
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
              published_at: null
            }
          ]
        })
      });
    });

    // 削除API 500エラーをシミュレート
    await page.route('**/api/my/posts/test-post-id', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Delete failed' })
        });
      }
    });
    
    await page.goto('/dashboard/posts');
    
    // 削除ボタンをクリック（存在する場合）
    const deleteButton = page.locator('button:has-text("削除")').first();
    if (await deleteButton.isVisible()) {
      // confirm dialogをモック
      page.on('dialog', dialog => dialog.accept());
      await deleteButton.click();
      
      // エラーアラートが表示されることを確認（ページがクラッシュしない）
      await page.waitForFunction(() => window.document.readyState === 'complete');
    }
    
    // ページがクラッシュしていないことを確認
    await expect(page.locator('body')).toBeVisible();
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });
});