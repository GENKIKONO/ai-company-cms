/**
 * Activity Page Smoke Tests
 * /dashboard/activity ページの基本動作確認テスト
 */

import { test, expect } from '@playwright/test';

test.describe('Activity Page Smoke Tests', () => {
  
  test('should load activity page without crashes', async ({ page }) => {
    // アクティビティページに直接アクセス
    await page.goto('/dashboard/activity');
    
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
    const response = await page.goto('/dashboard/activity');
    
    // レスポンスステータスが500/404でないことを確認
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
    
    // ページが表示されること（認証リダイレクトも含む）
    await expect(page.locator('body')).toBeVisible();
  });
});