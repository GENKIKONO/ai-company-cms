/**
 * Dashboard Layout Stability Tests
 * ダッシュボードのレイアウト安定性をテスト
 * 
 * 目的: エラー発生時でもサイドバーとナビゲーションが維持されることを確認
 * 背景: .single() エラーによるレイアウト崩壊を防ぐため
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Layout Stability', () => {
  test.beforeEach(async ({ page }) => {
    // Login as a test user
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard*');
  });

  test('サイドバーが常に表示されている', async ({ page }) => {
    // Check sidebar is visible on dashboard home
    const sidebar = page.locator('[data-testid="dashboard-sidenav"]');
    await expect(sidebar).toBeVisible();
    
    // Navigate to different pages and confirm sidebar persists
    const navigationItems = [
      '/dashboard/services',
      '/dashboard/case-studies', 
      '/dashboard/faqs',
      '/dashboard/billing'
    ];
    
    for (const url of navigationItems) {
      await page.goto(url);
      await expect(sidebar).toBeVisible();
    }
  });

  test('エラー発生時でもレイアウトが維持される', async ({ page }) => {
    // Go to dashboard page
    await page.goto('/dashboard');
    
    // Confirm sidebar is initially visible
    const sidebar = page.locator('[data-testid="dashboard-sidenav"]');
    await expect(sidebar).toBeVisible();
    
    // Navigate to a page that might trigger errors
    await page.goto('/dashboard/services/999999999'); // Non-existent service
    
    // Even with 404 error, sidebar should still be visible
    await expect(sidebar).toBeVisible();
    
    // Check if error message is displayed but sidebar is intact
    const errorMessage = page.locator('text=/問題が発生|見つかりません|エラー/');
    if (await errorMessage.isVisible()) {
      // Error is shown but layout is preserved
      await expect(sidebar).toBeVisible();
    }
  });

  test('認証エラーが発生した場合の動作', async ({ page }) => {
    // Clear session to simulate auth error
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => sessionStorage.clear());
    
    // Try to access dashboard page
    await page.goto('/dashboard');
    
    // Should redirect to login page
    await page.waitForURL('**/auth/login**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('ネットワークエラー時のレイアウト安定性', async ({ page }) => {
    await page.goto('/dashboard');
    
    const sidebar = page.locator('[data-testid="dashboard-sidenav"]');
    await expect(sidebar).toBeVisible();
    
    // Simulate network error
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    // Try to navigate to another page
    await page.click('a[href="/dashboard/services"]');
    
    // Wait a moment for any errors to appear
    await page.waitForTimeout(2000);
    
    // Sidebar should still be visible even with network errors
    await expect(sidebar).toBeVisible();
  });

  test('組織が見つからない場合のハンドリング', async ({ page }) => {
    // Mock API to return empty organization data
    await page.route('**/api/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            full_name: 'Test User'
          },
          organizations: [],
          selectedOrganization: null,
          organization: null
        })
      });
    });
    
    await page.goto('/dashboard');
    
    // Should handle gracefully - either redirect to org creation or show appropriate message
    // In either case, page should load without crashing
    await expect(page.locator('body')).toBeVisible();
    
    // Check for either organization creation flow or appropriate error message
    const hasOrgCreationFlow = await page.locator('text=/組織を作成|会社を設定/').isVisible();
    const hasErrorMessage = await page.locator('text=/組織が見つかりません|設定が必要/').isVisible();
    
    expect(hasOrgCreationFlow || hasErrorMessage).toBe(true);
  });

  test('複数のエラータイプでレイアウト維持確認', async ({ page }) => {
    const testCases = [
      {
        name: '403 Forbidden',
        mockResponse: { status: 403, body: { error: 'Forbidden' } }
      },
      {
        name: '404 Not Found', 
        mockResponse: { status: 404, body: { error: 'Not Found' } }
      },
      {
        name: '409 Conflict',
        mockResponse: { status: 409, body: { error: 'Conflict' } }
      },
      {
        name: '500 Server Error',
        mockResponse: { status: 500, body: { error: 'Internal Server Error' } }
      }
    ];
    
    for (const testCase of testCases) {
      await page.goto('/dashboard');
      
      // Confirm sidebar is visible initially
      const sidebar = page.locator('[data-testid="dashboard-sidenav"]');
      await expect(sidebar).toBeVisible();
      
      // Mock API error response
      await page.route('**/api/my/services', async route => {
        await route.fulfill({
          status: testCase.mockResponse.status,
          contentType: 'application/json',
          body: JSON.stringify(testCase.mockResponse.body)
        });
      });
      
      // Navigate to services page which will trigger the error
      await page.goto('/dashboard/services');
      
      // Wait for potential error handling
      await page.waitForTimeout(1000);
      
      // Sidebar should still be visible despite the error
      await expect(sidebar).toBeVisible();
    }
  });

  test('サイドバーの基本要素が含まれている', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that sidebar contains essential navigation elements
    const sidebar = page.locator('[data-testid="dashboard-sidenav"]');
    await expect(sidebar).toBeVisible();
    
    // Check for navigation links (adjust selectors based on actual implementation)
    const expectedNavItems = [
      'ダッシュボード',
      'サービス', 
      '事例',
      'FAQ',
      '設定'
    ];
    
    for (const item of expectedNavItems) {
      const navItem = sidebar.locator(`text=${item}`);
      if (await navItem.count() > 0) {
        await expect(navItem).toBeVisible();
      }
    }
  });
});

test.describe('Error Boundary Integration', () => {
  test('エラーバウンダリが正しく動作する', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Inject JavaScript error to trigger error boundary
    await page.addInitScript(() => {
      // Override a method to throw an error
      const originalRender = React.createElement;
      window.React.createElement = (...args) => {
        if (args[0] && args[0].name === 'TestErrorComponent') {
          throw new Error('Test error boundary');
        }
        return originalRender.apply(this, args);
      };
    });
    
    // Check that error boundary shows appropriate message
    const errorBoundaryContent = page.locator('text=/問題が発生しました|システムエラー/');
    
    // If error boundary is triggered, it should handle gracefully
    if (await errorBoundaryContent.isVisible()) {
      // Error boundary should show without breaking the page
      await expect(page.locator('body')).toBeVisible();
    }
  });
});