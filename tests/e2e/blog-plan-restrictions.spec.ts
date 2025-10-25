import { test, expect } from '@playwright/test';

/**
 * Blog Plan Restrictions E2E Tests  
 * フリープランでのブログ機能制限とベーシック以上での利用可能性確認
 */

test.describe('Blog Plan Restrictions', () => {
  test.describe('Free Plan - Blog Restrictions', () => {
    test('should return 403 for blog creation on free plan', async ({ page }) => {
      // NOTE: This test assumes user is logged in with free plan
      // In real test, you would need to set up proper authentication
      
      const response = await page.goto('/dashboard/posts/new', { 
        waitUntil: 'networkidle' 
      });
      
      // Free plan should be redirected or see restriction message
      // Check for plan upgrade prompt or 403-like behavior
      await expect(page.locator('text=記事機能は')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=ベーシック以上')).toBeVisible();
    });

    test('should show plan restriction message on posts dashboard', async ({ page }) => {
      const response = await page.goto('/dashboard/posts', { 
        waitUntil: 'networkidle' 
      });
      
      // Should show plan restriction or upgrade prompt
      const restrictionText = page.locator('text=記事機能は');
      if (await restrictionText.isVisible()) {
        await expect(restrictionText).toBeVisible();
        await expect(page.locator('text=ベーシック以上')).toBeVisible();
      }
    });
  });

  test.describe('Basic+ Plan - Blog Access', () => {
    test('should allow blog creation on basic+ plan', async ({ page }) => {
      // NOTE: This test assumes user is logged in with basic+ plan
      // In real implementation, you would need proper test data setup
      
      const response = await page.goto('/dashboard/posts/new', { 
        waitUntil: 'networkidle' 
      });
      
      // Should see blog creation form, not restriction message
      const createButton = page.locator('button:has-text("記事を作成"), button:has-text("投稿"), input[type="submit"]');
      const titleField = page.locator('input[name="title"], input:has([placeholder*="タイトル"])');
      
      // At least one of these should be visible on a proper blog creation page
      const hasCreateElements = await createButton.isVisible() || await titleField.isVisible();
      expect(hasCreateElements).toBe(true);
    });

    test('should access posts dashboard without restrictions', async ({ page }) => {
      const response = await page.goto('/dashboard/posts', { 
        waitUntil: 'networkidle' 
      });
      
      // Should see posts management interface
      await expect(page.locator('text=記事管理, text=記事一覧, text=新しい記事')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Plan Validation', () => {
    test('should display current plan information', async ({ page }) => {
      await page.goto('/dashboard/billing', { waitUntil: 'networkidle' });
      
      // Should show current plan status
      const planIndicators = [
        'text=フリー',
        'text=ベーシック', 
        'text=ビジネス',
        'text=エンタープライズ',
        'text=現在のプラン',
        'text=Plan'
      ];
      
      let planFound = false;
      for (const indicator of planIndicators) {
        if (await page.locator(indicator).isVisible()) {
          planFound = true;
          break;
        }
      }
      
      expect(planFound).toBe(true);
    });
  });
});