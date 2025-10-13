import { test, expect } from '@playwright/test';

/**
 * Simple Smoke Test for E2E Setup Verification
 * E2E環境の基本動作確認用のシンプルなテスト
 */

test.describe('Smoke Tests', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // ページタイトルが読み込まれることを確認
    await expect(page).toHaveTitle(/LuxuCare|AIO Hub/);
    
    // 基本的なナビゲーション要素があることを確認
    await expect(page.locator('header')).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Viewport meta tag
    const viewportMeta = page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveCount(1);
    
    const content = await viewportMeta.getAttribute('content');
    expect(content).toContain('width=device-width');
  });

  test('should load login page without infinite redirect', async ({ page }) => {
    await page.goto('/auth/login');
    
    // 5秒待機してページが安定することを確認
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    expect(currentUrl).not.toMatch(/redirect/);
    
    // ログインフォームが表示されていることを確認
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});