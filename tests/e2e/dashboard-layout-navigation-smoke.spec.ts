import { test, expect } from '@playwright/test';

// Dashboard Layout Navigation Smoke Test
// Prevents regression of sidebar navigation disappearance across dashboard pages
// Part of systematic layout bypassing prevention (8-step methodology step 5)

const DASHBOARD_PAGES = [
  { path: '/dashboard', title: 'ダッシュボード' },
  { path: '/dashboard/posts', title: '記事管理' },
  { path: '/dashboard/case-studies', title: '事例管理' },
  { path: '/dashboard/services', title: 'サービス管理' },
  { path: '/dashboard/faqs', title: 'FAQ管理' }
] as const;

test.describe('Dashboard Layout Navigation Smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authenticated session
    await page.goto('/api/test/setup-session');
  });

  for (const pageConfig of DASHBOARD_PAGES) {
    test(`should show sidebar navigation on ${pageConfig.path}`, async ({ page }) => {
      await page.goto(pageConfig.path);
      
      // Wait for page to stabilize
      await page.waitForLoadState('networkidle');
      
      // Verify sidebar is present and visible
      const sidebar = page.locator('[data-testid="dashboard-sidenav"]');
      await expect(sidebar).toBeVisible();
      
      // Verify sidebar contains expected navigation elements
      await expect(sidebar.locator('text=AIO Hub')).toBeVisible();
      await expect(sidebar.locator('text=ダッシュボード')).toBeVisible();
      await expect(sidebar.locator('text=記事管理')).toBeVisible();
      await expect(sidebar.locator('text=サービス管理')).toBeVisible();
      
      // Verify navigation links are functional
      const dashboardLink = sidebar.locator('a[href="/dashboard"]');
      await expect(dashboardLink).toBeVisible();
      await expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });
  }

  test('should maintain sidebar navigation during error states', async ({ page }) => {
    // Test error condition that previously caused navigation loss
    await page.goto('/dashboard/posts');
    
    // Wait for potential error states to stabilize
    await page.waitForTimeout(2000);
    
    // Even if page shows error, sidebar should still be present
    const sidebar = page.locator('[data-testid="dashboard-sidenav"]');
    await expect(sidebar).toBeVisible();
    
    // Verify navigation still works from error state
    const servicesLink = sidebar.locator('a[href="/dashboard/services"]');
    await expect(servicesLink).toBeVisible();
  });

  test('should preserve sidebar navigation when organization is missing', async ({ page }) => {
    // Simulate organization missing scenario that caused original issue
    await page.goto('/dashboard/posts');
    
    // Wait for page to load and handle organization checks
    await page.waitForLoadState('networkidle');
    
    // Check if organization missing message appears
    const orgMissingMsg = page.locator('text=組織情報が必要です');
    
    // Regardless of organization state, sidebar should be visible
    const sidebar = page.locator('[data-testid="dashboard-sidenav"]');
    await expect(sidebar).toBeVisible();
    
    // If organization missing message is shown, verify it's within dashboard layout
    if (await orgMissingMsg.isVisible()) {
      // Sidebar should still be present even with missing org message
      await expect(sidebar).toBeVisible();
      await expect(sidebar.locator('text=AIO Hub')).toBeVisible();
    }
  });
});