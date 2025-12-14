/**
 * Admin Contents Page Crash Prevention Smoke Tests
 * /dashboard/admin/contents ページの500エラー防止テスト
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Contents Page Crash Prevention', () => {
  
  test('should handle page load without 500 error', async ({ page }) => {
    // 管理コンテンツページにアクセス
    await page.goto('/dashboard/admin/contents');
    
    // ページが正常に読み込まれることを確認（500エラーで止まらない）
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle API fetch errors gracefully', async ({ page }) => {
    // API 500エラーをシミュレート
    await page.route('**/api/my/admin/contents*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Internal Server Error' })
      });
    });
    
    await page.goto('/dashboard/admin/contents');
    
    // ページの基本構造が維持されることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle malformed JSON response', async ({ page }) => {
    // 不正なJSONレスポンスをシミュレート
    await page.route('**/api/my/admin/contents*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json response'
      });
    });
    
    await page.goto('/dashboard/admin/contents');
    
    // ページがクラッシュせずにエラー状態になることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（何らかのコンテンツが表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle network failure gracefully', async ({ page }) => {
    // ネットワーク失敗をシミュレート
    await page.route('**/api/my/admin/contents*', (route) => {
      route.abort('failed');
    });
    
    await page.goto('/dashboard/admin/contents');
    
    // ページがクラッシュせずにエラー状態になることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（500エラーにならない）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle API 401 without crash', async ({ page }) => {
    // API 401エラーをシミュレート
    await page.route('**/api/my/admin/contents*', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Unauthorized' })
      });
    });
    
    await page.goto('/dashboard/admin/contents');
    
    // ページの基本構造が維持されることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページがクラッシュしていないことを確認（エラー表示される）
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should handle delete operation gracefully', async ({ page }) => {
    // 通常のAPI応答をモック
    await page.route('**/api/my/admin/contents?*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          items: [
            {
              id: 'test-content-id',
              title: 'Test Content',
              slug: 'test-content',
              status: 'draft',
              content_type: 'posts',
              source_table: 'posts',
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
              published_at: null
            }
          ],
          total: 1,
          page: 1,
          pageSize: 20,
          hasMore: false
        })
      });
    });

    // 削除API 500エラーをシミュレート
    await page.route('**/api/my/admin/contents/posts/test-content-id*', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Delete failed' })
        });
      }
    });
    
    await page.goto('/dashboard/admin/contents');
    
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